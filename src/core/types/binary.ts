export type BranchType =
  | "Unconditional"
  | "ConditionalTrue"
  | "ConditionalFalse"
  | "Call"
  | "Return"
  | "Indirect"
  | "Fallthrough";

export interface CfgEdge {
  from_block: string;
  to_block: string;
  branch_type: BranchType;
}

export interface DisasmInstruction {
  address: number;
  size: number;
  bytes_hex: string;
  mnemonic: string;
  operands: string;
  is_call: boolean;
  is_jump: boolean;
  is_cond_jump: boolean;
  is_ret: boolean;
  target_address?: number | null;
  comment?: string | null;
}

export interface BasicBlockInfo {
  id: string;
  function_id: string;
  start_address: number;
  end_address: number;
  instructions: DisasmInstruction[];
  successors: CfgEdge[];
  predecessors: string[];
}

export interface FunctionInfo {
  id: string;
  name: string;
  start_address: number;
  end_address: number;
  size: number;
  basic_block_count: number;
  is_entry: boolean;
  calling_convention: string;
  x_refs_to: number[];
  comment?: string | null;
}

export interface SectionInfo {
  name: string;
  virtual_address: number;
  virtual_size: number;
  raw_offset: number;
  raw_size: number;
  permissions: string;
  entropy: number;
  is_executable: boolean;
}

export interface StringItem {
  address: number;
  offset: number;
  length: number;
  string_type: string;
  value: string;
  section: string;
}

export interface ImportItem {
  library: string;
  name: string;
  address: number;
  ordinal?: number | null;
}

export interface ExportItem {
  name: string;
  address: number;
  ordinal?: number | null;
}

export interface HeaderField {
  category: string;
  name: string;
  value: string;
  offset: number;
}

export interface BinaryInfo {
  filename: string;
  format: string;
  arch: string;
  endianness: string;
  entry_point: number;
  base_address: number;
  is_64bit: boolean;
  size: number;
  sha256: string;
  overall_entropy: number;
}

export interface BinaryAnalysis {
  info: BinaryInfo;
  sections: SectionInfo[];
  functions: FunctionInfo[];
  basic_blocks: BasicBlockInfo[];
  instructions: DisasmInstruction[];
  strings: StringItem[];
  imports: ImportItem[];
  exports: ExportItem[];
  entropy_blocks: number[];
  header_summary: HeaderField[];
}

export interface DecompiledLine {
  line_number: number;
  text: string;
  address_ref?: number | null;
  indent: number;
}

export interface DecompiledFunction {
  function_id: string;
  name: string;
  signature: string;
  code_lines: DecompiledLine[];
}

// XREFs (Cross References)
export type XrefType = "Call" | "Data" | "Jump" | "Read" | "Write";

export interface XrefItem {
  from_address: number;
  to_address: number;
  type: XrefType;
  from_function: string;
  context_instruction: string;
}

// Call Graph Hierarchy
export interface CallGraphNode {
  function_id: string;
  name: string;
  address: number;
  callers: string[];
  callees: string[];
}

// Type & Struct Definitions
export interface StructMember {
  name: string;
  type_name: string;
  offset: number;
  size: number;
  comment?: string;
}

export interface StructDefinition {
  id: string;
  name: string;
  total_size: number;
  alignment: number;
  members: StructMember[];
}

// Binary Patch Studio
export interface BinaryPatch {
  id: string;
  address: number;
  original_bytes: string;
  patched_bytes: string;
  mnemonic: string;
  comment?: string;
  is_active: boolean;
  timestamp: number;
}

// Bookmarks & Annotations
export interface BookmarkItem {
  id: string;
  address: number;
  label: string;
  color: string;
  category: string;
  created_at: string;
}
