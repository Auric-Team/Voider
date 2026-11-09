use crate::types::{BasicBlockInfo, BranchType, CfgEdge, DisasmInstruction, FunctionInfo};
use std::collections::{HashMap, HashSet};

pub fn build_cfg_for_instructions(
    instructions: &[DisasmInstruction],
    function_id: &str,
) -> Vec<BasicBlockInfo> {
    if instructions.is_empty() {
        return Vec::new();
    }

    // Step 1: Find leaders (start addresses of basic blocks)
    let mut leaders = HashSet::new();
    leaders.insert(instructions[0].address);

    let addr_to_idx: HashMap<u64, usize> = instructions
        .iter()
        .enumerate()
        .map(|(idx, ins)| (ins.address, idx))
        .collect();

    for (idx, ins) in instructions.iter().enumerate() {
        if ins.is_jump || ins.is_cond_jump {
            if let Some(target) = ins.target_address {
                if addr_to_idx.contains_key(&target) {
                    leaders.insert(target);
                }
            }
            // Next instruction is also a leader
            if idx + 1 < instructions.len() {
                leaders.insert(instructions[idx + 1].address);
            }
        } else if ins.is_ret {
            if idx + 1 < instructions.len() {
                leaders.insert(instructions[idx + 1].address);
            }
        }
    }

    // Sort leaders by address
    let mut sorted_leaders: Vec<u64> = leaders.into_iter().collect();
    sorted_leaders.sort_unstable();

    // Step 2: Form basic blocks
    let mut blocks: Vec<BasicBlockInfo> = Vec::new();

    for (i, &leader_addr) in sorted_leaders.iter().enumerate() {
        let start_idx = match addr_to_idx.get(&leader_addr) {
            Some(&idx) => idx,
            None => continue,
        };

        let end_idx = if i + 1 < sorted_leaders.len() {
            match addr_to_idx.get(&sorted_leaders[i + 1]) {
                Some(&idx) => idx,
                None => instructions.len(),
            }
        } else {
            instructions.len()
        };

        if start_idx >= end_idx {
            continue;
        }

        let block_instructions = instructions[start_idx..end_idx].to_vec();
        let start_address = block_instructions.first().unwrap().address;
        let end_address = block_instructions.last().unwrap().address + block_instructions.last().unwrap().size as u64;

        let block_id = format!("bb_{:08x}", start_address);

        blocks.push(BasicBlockInfo {
            id: block_id,
            function_id: function_id.to_string(),
            start_address,
            end_address,
            instructions: block_instructions,
            successors: Vec::new(),
            predecessors: Vec::new(),
        });
    }

    // Step 3: Link edges between blocks
    let block_addr_to_id: HashMap<u64, String> = blocks
        .iter()
        .map(|b| (b.start_address, b.id.clone()))
        .collect();

    let mut pred_map: HashMap<String, Vec<String>> = HashMap::new();

    for i in 0..blocks.len() {
        let last_ins = match blocks[i].instructions.last() {
            Some(ins) => ins.clone(),
            None => continue,
        };

        let current_id = blocks[i].id.clone();
        let mut edges = Vec::new();

        if last_ins.is_cond_jump {
            // Edge 1: Target branch (taken / true -> green)
            if let Some(target) = last_ins.target_address {
                if let Some(target_id) = block_addr_to_id.get(&target) {
                    edges.push(CfgEdge {
                        from_block: current_id.clone(),
                        to_block: target_id.clone(),
                        branch_type: BranchType::ConditionalTrue,
                    });
                    pred_map.entry(target_id.clone()).or_default().push(current_id.clone());
                }
            }
            // Edge 2: Fallthrough (not taken / false -> red)
            if i + 1 < blocks.len() {
                let next_id = blocks[i + 1].id.clone();
                edges.push(CfgEdge {
                    from_block: current_id.clone(),
                    to_block: next_id.clone(),
                    branch_type: BranchType::ConditionalFalse,
                });
                pred_map.entry(next_id).or_default().push(current_id.clone());
            }
        } else if last_ins.is_jump {
            // Unconditional jump
            if let Some(target) = last_ins.target_address {
                if let Some(target_id) = block_addr_to_id.get(&target) {
                    edges.push(CfgEdge {
                        from_block: current_id.clone(),
                        to_block: target_id.clone(),
                        branch_type: BranchType::Unconditional,
                    });
                    pred_map.entry(target_id.clone()).or_default().push(current_id.clone());
                }
            }
        } else if last_ins.is_ret {
            // Return - terminates control flow in this function
        } else {
            // Regular fallthrough
            if i + 1 < blocks.len() {
                let next_id = blocks[i + 1].id.clone();
                edges.push(CfgEdge {
                    from_block: current_id.clone(),
                    to_block: next_id.clone(),
                    branch_type: BranchType::Fallthrough,
                });
                pred_map.entry(next_id).or_default().push(current_id.clone());
            }
        }

        blocks[i].successors = edges;
    }

    // Attach predecessors
    for block in blocks.iter_mut() {
        if let Some(preds) = pred_map.remove(&block.id) {
            block.predecessors = preds;
        }
    }

    blocks
}

/// Detect function boundaries from disassembly and call targets
pub fn detect_functions(
    instructions: &[DisasmInstruction],
    entry_point: u64,
) -> Vec<FunctionInfo> {
    if instructions.is_empty() {
        return Vec::new();
    }

    let mut function_starts = HashSet::new();
    function_starts.insert(entry_point);

    // Call targets and prologue detection
    for (i, ins) in instructions.iter().enumerate() {
        if ins.is_call {
            if let Some(target) = ins.target_address {
                function_starts.insert(target);
            }
        }
        // Classic function prologues: `push rbp` (0x55) or `push ebp`
        if ins.mnemonic == "push" && (ins.operands == "rbp" || ins.operands == "ebp") {
            function_starts.insert(ins.address);
        }
        // `endbr64` or `endbr32`
        if ins.mnemonic.starts_with("endbr") {
            function_starts.insert(ins.address);
        }
        // After an unconditional ret, next instruction may be a function start
        if ins.is_ret && i + 1 < instructions.len() {
            function_starts.insert(instructions[i + 1].address);
        }
    }

    let addr_to_ins: HashMap<u64, usize> = instructions
        .iter()
        .enumerate()
        .map(|(idx, ins)| (ins.address, idx))
        .collect();

    let mut valid_starts: Vec<u64> = function_starts
        .into_iter()
        .filter(|addr| addr_to_ins.contains_key(addr))
        .collect();
    valid_starts.sort_unstable();

    let mut functions = Vec::new();

    for (idx, &start_addr) in valid_starts.iter().enumerate() {
        let ins_idx = addr_to_ins[&start_addr];
        let end_idx = if idx + 1 < valid_starts.len() {
            addr_to_ins.get(&valid_starts[idx + 1]).copied().unwrap_or(instructions.len())
        } else {
            instructions.len()
        };

        if ins_idx >= end_idx {
            continue;
        }

        let func_ins = &instructions[ins_idx..end_idx];
        let last_ins = func_ins.last().unwrap();
        let end_address = last_ins.address + last_ins.size as u64;
        let size = end_address.saturating_sub(start_addr);

        let func_id = format!("func_{:08x}", start_addr);
        let name = if start_addr == entry_point {
            "entry_point".to_string()
        } else {
            format!("sub_{:08x}", start_addr)
        };

        let blocks = build_cfg_for_instructions(func_ins, &func_id);

        functions.push(FunctionInfo {
            id: func_id,
            name,
            start_address: start_addr,
            end_address,
            size,
            basic_block_count: blocks.len(),
            is_entry: start_addr == entry_point,
            calling_convention: "cdecl/fastcall".to_string(),
            x_refs_to: Vec::new(),
            comment: None,
        });
    }

    functions
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cfg_branching() {
        let ins = vec![
            DisasmInstruction {
                address: 0x1000,
                size: 2,
                bytes_hex: "31 c0".into(),
                mnemonic: "xor".into(),
                operands: "eax, eax".into(),
                is_call: false,
                is_jump: false,
                is_cond_jump: false,
                is_ret: false,
                target_address: None,
                comment: None,
            },
            DisasmInstruction {
                address: 0x1002,
                size: 2,
                bytes_hex: "74 04".into(),
                mnemonic: "je".into(),
                operands: "0x1008".into(),
                is_call: false,
                is_jump: true,
                is_cond_jump: true,
                is_ret: false,
                target_address: Some(0x1008),
                comment: None,
            },
            DisasmInstruction {
                address: 0x1004,
                size: 4,
                bytes_hex: "b8 01 00 00".into(),
                mnemonic: "mov".into(),
                operands: "eax, 1".into(),
                is_call: false,
                is_jump: false,
                is_cond_jump: false,
                is_ret: false,
                target_address: None,
                comment: None,
            },
            DisasmInstruction {
                address: 0x1008,
                size: 1,
                bytes_hex: "c3".into(),
                mnemonic: "ret".into(),
                operands: "".into(),
                is_call: false,
                is_jump: false,
                is_cond_jump: false,
                is_ret: true,
                target_address: None,
                comment: None,
            },
        ];

        let blocks = build_cfg_for_instructions(&ins, "func_1000");
        assert_eq!(blocks.len(), 3);
        assert_eq!(blocks[0].successors.len(), 2);
    }
}
