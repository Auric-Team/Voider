use crate::analysis::cfg::{build_cfg_for_instructions, detect_functions};
use crate::disasm::disassemble_x86;
use crate::entropy::{calculate_entropy, compute_entropy_blocks};
use crate::strings::extract_strings;
use crate::types::{
    BinaryAnalysis, BinaryInfo, ExportItem, HeaderField, ImportItem, SectionInfo,
};
use goblin::{Object, elf, pe, mach};

pub fn parse_and_analyze(bytes: &[u8], filename: &str) -> Result<BinaryAnalysis, String> {
    if bytes.is_empty() {
        return Err("Binary file is empty".to_string());
    }

    let overall_entropy = calculate_entropy(bytes);
    let entropy_blocks = compute_entropy_blocks(bytes, 64);

    let parsed_obj = Object::parse(bytes).map_err(|e| format!("Parsing error: {}", e));

    match parsed_obj {
        Ok(Object::Elf(elf)) => analyze_elf(bytes, filename, elf, overall_entropy, entropy_blocks),
        Ok(Object::PE(pe)) => analyze_pe(bytes, filename, pe, overall_entropy, entropy_blocks),
        Ok(Object::Mach(mach)) => analyze_mach(bytes, filename, mach, overall_entropy, entropy_blocks),
        _ => analyze_raw(bytes, filename, overall_entropy, entropy_blocks),
    }
}

fn analyze_elf(
    bytes: &[u8],
    filename: &str,
    elf: elf::Elf,
    overall_entropy: f32,
    entropy_blocks: Vec<f32>,
) -> Result<BinaryAnalysis, String> {
    let mut sections = Vec::new();
    let mut instructions = Vec::new();
    let mut header_summary = Vec::new();

    // Headers
    header_summary.push(HeaderField {
        category: "ELF Header".into(),
        name: "Magic".into(),
        value: "7F 45 4C 46 (ELF)".into(),
        offset: 0,
    });
    header_summary.push(HeaderField {
        category: "ELF Header".into(),
        name: "Class".into(),
        value: if elf.is_64 { "64-bit".into() } else { "32-bit".into() },
        offset: 4,
    });
    header_summary.push(HeaderField {
        category: "ELF Header".into(),
        name: "Entry Point".into(),
        value: format!("0x{:08X}", elf.entry),
        offset: 0x18,
    });
    header_summary.push(HeaderField {
        category: "ELF Header".into(),
        name: "Machine".into(),
        value: format!("{:?}", elf.header.e_machine),
        offset: 0x12,
    });

    for sh in &elf.section_headers {
        let name = elf.shdr_strtab.get_at(sh.sh_name).unwrap_or("unnamed").to_string();
        let is_exec = (sh.sh_flags as u64 & elf::section_header::SHF_EXECINSTR as u64) != 0;
        let is_write = (sh.sh_flags as u64 & elf::section_header::SHF_WRITE as u64) != 0;
        let perm = format!(
            "r{}{}",
            if is_write { "w" } else { "-" },
            if is_exec { "x" } else { "-" }
        );

        let slice_start = sh.sh_offset as usize;
        let slice_end = (slice_start + sh.sh_size as usize).min(bytes.len());
        let sec_entropy = if slice_start < slice_end {
            calculate_entropy(&bytes[slice_start..slice_end])
        } else {
            0.0
        };

        sections.push(SectionInfo {
            name: name.clone(),
            virtual_address: sh.sh_addr,
            virtual_size: sh.sh_size,
            raw_offset: sh.sh_offset,
            raw_size: sh.sh_size,
            permissions: perm,
            entropy: sec_entropy,
            is_executable: is_exec,
        });

        // Disassemble executable sections (e.g. .text)
        if is_exec && slice_start < slice_end {
            let code_slice = &bytes[slice_start..slice_end];
            let bitness = if elf.is_64 { 64 } else { 32 };
            let ins = disassemble_x86(code_slice, sh.sh_addr, bitness, 5000);
            instructions.extend(ins);
        }
    }

    let strings = extract_strings(bytes, 4, &sections);

    let mut imports = Vec::new();
    for import in &elf.libraries {
        imports.push(ImportItem {
            library: import.to_string(),
            name: "*".to_string(),
            address: 0,
            ordinal: None,
        });
    }

    let mut exports = Vec::new();
    for sym in &elf.dynsyms {
        if let Some(name) = elf.dynstrtab.get_at(sym.st_name) {
            if sym.st_value != 0 {
                exports.push(ExportItem {
                    name: name.to_string(),
                    address: sym.st_value,
                    ordinal: None,
                });
            }
        }
    }

    // Function detection & CFG
    let functions = detect_functions(&instructions, elf.entry);
    let mut basic_blocks = Vec::new();
    for func in &functions {
        let func_ins: Vec<_> = instructions
            .iter()
            .filter(|i| i.address >= func.start_address && i.address < func.end_address)
            .cloned()
            .collect();
        basic_blocks.extend(build_cfg_for_instructions(&func_ins, &func.id));
    }

    Ok(BinaryAnalysis {
        info: BinaryInfo {
            filename: filename.to_string(),
            format: if elf.is_64 { "ELF64".into() } else { "ELF32".into() },
            arch: if elf.is_64 { "x86_64".into() } else { "x86".into() },
            endianness: if elf.little_endian { "Little Endian".into() } else { "Big Endian".into() },
            entry_point: elf.entry,
            base_address: 0x400000,
            is_64bit: elf.is_64,
            size: bytes.len(),
            sha256: format!("{:x}", simple_hash(bytes)),
            overall_entropy,
        },
        sections,
        functions,
        basic_blocks,
        instructions,
        strings,
        imports,
        exports,
        entropy_blocks,
        header_summary,
    })
}

fn analyze_pe(
    bytes: &[u8],
    filename: &str,
    pe: pe::PE,
    overall_entropy: f32,
    entropy_blocks: Vec<f32>,
) -> Result<BinaryAnalysis, String> {
    let mut sections = Vec::new();
    let mut instructions = Vec::new();
    let mut header_summary = Vec::new();

    let image_base = pe.image_base as u64;
    let entry_va = image_base + pe.entry as u64;

    // Headers
    header_summary.push(HeaderField {
        category: "DOS Header".into(),
        name: "e_magic".into(),
        value: "4D 5A (MZ)".into(),
        offset: 0,
    });
    header_summary.push(HeaderField {
        category: "PE Header".into(),
        name: "Machine".into(),
        value: format!("0x{:04X}", pe.header.coff_header.machine),
        offset: 0x80,
    });
    header_summary.push(HeaderField {
        category: "Optional Header".into(),
        name: "AddressOfEntryPoint".into(),
        value: format!("0x{:08X} (RVA: 0x{:08X})", entry_va, pe.entry),
        offset: 0x90,
    });
    header_summary.push(HeaderField {
        category: "Optional Header".into(),
        name: "ImageBase".into(),
        value: format!("0x{:08X}", image_base),
        offset: 0x98,
    });

    for sh in &pe.sections {
        let name = sh.name().unwrap_or("unnamed").to_string();
        let is_exec = (sh.characteristics & pe::section_table::IMAGE_SCN_MEM_EXECUTE) != 0;
        let is_write = (sh.characteristics & pe::section_table::IMAGE_SCN_MEM_WRITE) != 0;
        let perm = format!(
            "r{}{}",
            if is_write { "w" } else { "-" },
            if is_exec { "x" } else { "-" }
        );

        let slice_start = sh.pointer_to_raw_data as usize;
        let slice_end = (slice_start + sh.size_of_raw_data as usize).min(bytes.len());
        let sec_entropy = if slice_start < slice_end {
            calculate_entropy(&bytes[slice_start..slice_end])
        } else {
            0.0
        };

        let va = image_base + sh.virtual_address as u64;
        sections.push(SectionInfo {
            name: name.clone(),
            virtual_address: va,
            virtual_size: sh.virtual_size as u64,
            raw_offset: sh.pointer_to_raw_data as u64,
            raw_size: sh.size_of_raw_data as u64,
            permissions: perm,
            entropy: sec_entropy,
            is_executable: is_exec,
        });

        if is_exec && slice_start < slice_end {
            let code_slice = &bytes[slice_start..slice_end];
            let bitness = if pe.is_64 { 64 } else { 32 };
            let ins = disassemble_x86(code_slice, va, bitness, 5000);
            instructions.extend(ins);
        }
    }

    let strings = extract_strings(bytes, 4, &sections);

    let mut imports = Vec::new();
    for imp in &pe.imports {
        imports.push(ImportItem {
            library: imp.dll.to_string(),
            name: imp.name.to_string(),
            address: imp.rva as u64 + image_base,
            ordinal: Some(imp.ordinal),
        });
    }

    let mut exports = Vec::new();
    for exp in &pe.exports {
        if let Some(name) = exp.name {
            exports.push(ExportItem {
                name: name.to_string(),
                address: exp.rva as u64 + image_base,
                ordinal: None,
            });
        }
    }

    let functions = detect_functions(&instructions, entry_va);
    let mut basic_blocks = Vec::new();
    for func in &functions {
        let func_ins: Vec<_> = instructions
            .iter()
            .filter(|i| i.address >= func.start_address && i.address < func.end_address)
            .cloned()
            .collect();
        basic_blocks.extend(build_cfg_for_instructions(&func_ins, &func.id));
    }

    Ok(BinaryAnalysis {
        info: BinaryInfo {
            filename: filename.to_string(),
            format: if pe.is_64 { "PE64".into() } else { "PE32".into() },
            arch: if pe.is_64 { "x86_64".into() } else { "x86".into() },
            endianness: "Little Endian".into(),
            entry_point: entry_va,
            base_address: image_base,
            is_64bit: pe.is_64,
            size: bytes.len(),
            sha256: format!("{:x}", simple_hash(bytes)),
            overall_entropy,
        },
        sections,
        functions,
        basic_blocks,
        instructions,
        strings,
        imports,
        exports,
        entropy_blocks,
        header_summary,
    })
}

fn analyze_mach(
    bytes: &[u8],
    filename: &str,
    _mach: mach::Mach,
    overall_entropy: f32,
    entropy_blocks: Vec<f32>,
) -> Result<BinaryAnalysis, String> {
    analyze_raw(bytes, filename, overall_entropy, entropy_blocks)
}

fn analyze_raw(
    bytes: &[u8],
    filename: &str,
    overall_entropy: f32,
    entropy_blocks: Vec<f32>,
) -> Result<BinaryAnalysis, String> {
    let sections = vec![SectionInfo {
        name: ".raw".into(),
        virtual_address: 0x1000,
        virtual_size: bytes.len() as u64,
        raw_offset: 0,
        raw_size: bytes.len() as u64,
        permissions: "rwx".into(),
        entropy: overall_entropy,
        is_executable: true,
    }];

    let instructions = disassemble_x86(bytes, 0x1000, 64, 5000);
    let strings = extract_strings(bytes, 4, &sections);
    let functions = detect_functions(&instructions, 0x1000);

    let mut basic_blocks = Vec::new();
    for func in &functions {
        let func_ins: Vec<_> = instructions
            .iter()
            .filter(|i| i.address >= func.start_address && i.address < func.end_address)
            .cloned()
            .collect();
        basic_blocks.extend(build_cfg_for_instructions(&func_ins, &func.id));
    }

    Ok(BinaryAnalysis {
        info: BinaryInfo {
            filename: filename.to_string(),
            format: "Raw / Shellcode".into(),
            arch: "x86_64".into(),
            endianness: "Little Endian".into(),
            entry_point: 0x1000,
            base_address: 0x1000,
            is_64bit: true,
            size: bytes.len(),
            sha256: format!("{:x}", simple_hash(bytes)),
            overall_entropy,
        },
        sections,
        functions,
        basic_blocks,
        instructions,
        strings,
        imports: Vec::new(),
        exports: Vec::new(),
        entropy_blocks,
        header_summary: vec![HeaderField {
            category: "Raw File".into(),
            name: "Size".into(),
            value: format!("{} bytes", bytes.len()),
            offset: 0,
        }],
    })
}

fn simple_hash(bytes: &[u8]) -> u64 {
    let mut h: u64 = 0xcbf29ce484222325;
    for &b in bytes {
        h ^= b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    h
}
