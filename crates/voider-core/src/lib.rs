pub mod analysis;
pub mod decompiler;
pub mod disasm;
pub mod entropy;
pub mod parser;
pub mod strings;
pub mod types;

use types::{BasicBlockInfo, BinaryAnalysis, DecompiledFunction, FunctionInfo};

/// Analyze a binary buffer (ELF, PE, Mach-O, or raw code)
pub fn analyze_binary(bytes: &[u8], filename: &str) -> Result<BinaryAnalysis, String> {
    parser::parse_and_analyze(bytes, filename)
}

/// Decompile a function using control flow blocks into structured pseudo-C
pub fn decompile(func: &FunctionInfo, blocks: &[BasicBlockInfo]) -> DecompiledFunction {
    decompiler::decompile_function(func, blocks)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_end_to_end_raw_analysis() {
        // x86_64 sample code with function prologue, logic, conditional jump, return
        let code = vec![
            0x55,                         // push rbp
            0x48, 0x89, 0xE5,             // mov rbp, rsp
            0x89, 0x7D, 0xFC,             // mov [rbp-4], edi
            0x83, 0x7D, 0xFC, 0x0A,       // cmp dword ptr [rbp-4], 10
            0x7E, 0x07,                   // jle 0x13
            0xB8, 0x01, 0x00, 0x00, 0x00, // mov eax, 1
            0xEB, 0x05,                   // jmp 0x18
            0xB8, 0x00, 0x00, 0x00, 0x00, // mov eax, 0
            0x5D,                         // pop rbp
            0xC3,                         // ret
        ];

        let result = analyze_binary(&code, "test_binary.bin").expect("Analysis failed");
        assert_eq!(result.info.filename, "test_binary.bin");
        assert!(result.instructions.len() >= 9);
        assert!(!result.functions.is_empty());
        assert!(!result.basic_blocks.is_empty());

        // Test decompiler
        let decompiled = decompile(&result.functions[0], &result.basic_blocks);
        assert!(!decompiled.code_lines.is_empty());
    }
}
