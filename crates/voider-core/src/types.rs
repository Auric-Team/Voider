use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryAnalysis {
    pub info: BinaryInfo,
    pub sections: Vec<SectionInfo>,
    pub functions: Vec<FunctionInfo>,
    pub basic_blocks: Vec<BasicBlockInfo>,
    pub instructions: Vec<DisasmInstruction>,
    pub strings: Vec<StringItem>,
    pub imports: Vec<ImportItem>,
    pub exports: Vec<ExportItem>,
    pub entropy_blocks: Vec<f32>,
    pub header_summary: Vec<HeaderField>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryInfo {
    pub filename: String,
    pub format: String, // "PE64", "ELF64", "Mach-O", "Raw x86_64", etc.
    pub arch: String,   // "x86_64", "x86", "ARM64", "Unknown"
    pub endianness: String,
    pub entry_point: u64,
    pub base_address: u64,
    pub is_64bit: bool,
    pub size: usize,
    pub sha256: String,
    pub overall_entropy: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionInfo {
    pub name: String,
    pub virtual_address: u64,
    pub virtual_size: u64,
    pub raw_offset: u64,
    pub raw_size: u64,
    pub permissions: String, // "r-x", "rw-", "r--", etc.
    pub entropy: f32,
    pub is_executable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionInfo {
    pub id: String,
    pub name: String,
    pub start_address: u64,
    pub end_address: u64,
    pub size: u64,
    pub basic_block_count: usize,
    pub is_entry: bool,
    pub calling_convention: String,
    pub x_refs_to: Vec<u64>,
    pub comment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BranchType {
    Unconditional,
    ConditionalTrue,
    ConditionalFalse,
    Call,
    Return,
    Indirect,
    Fallthrough,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CfgEdge {
    pub from_block: String,
    pub to_block: String,
    pub branch_type: BranchType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BasicBlockInfo {
    pub id: String,
    pub function_id: String,
    pub start_address: u64,
    pub end_address: u64,
    pub instructions: Vec<DisasmInstruction>,
    pub successors: Vec<CfgEdge>,
    pub predecessors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisasmInstruction {
    pub address: u64,
    pub size: usize,
    pub bytes_hex: String,
    pub mnemonic: String,
    pub operands: String,
    pub is_call: bool,
    pub is_jump: bool,
    pub is_cond_jump: bool,
    pub is_ret: bool,
    pub target_address: Option<u64>,
    pub comment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StringItem {
    pub address: u64,
    pub offset: u64,
    pub length: usize,
    pub string_type: String, // "ASCII" or "UTF-16LE"
    pub value: String,
    pub section: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportItem {
    pub library: String,
    pub name: String,
    pub address: u64,
    pub ordinal: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportItem {
    pub name: String,
    pub address: u64,
    pub ordinal: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeaderField {
    pub category: String,
    pub name: String,
    pub value: String,
    pub offset: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecompiledFunction {
    pub function_id: String,
    pub name: String,
    pub signature: String,
    pub code_lines: Vec<DecompiledLine>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecompiledLine {
    pub line_number: usize,
    pub text: String,
    pub address_ref: Option<u64>,
    pub indent: usize,
}
