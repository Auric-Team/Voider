use crate::types::{BasicBlockInfo, BranchType, DecompiledFunction, DecompiledLine, FunctionInfo};

pub fn decompile_function(
    func: &FunctionInfo,
    blocks: &[BasicBlockInfo],
) -> DecompiledFunction {
    let mut lines = Vec::new();
    let mut line_no = 1;

    // Header comment
    lines.push(DecompiledLine {
        line_number: line_no,
        text: format!("// Decompiled function: {} (Address: 0x{:08X}, Size: {} bytes)", func.name, func.start_address, func.size),
        address_ref: Some(func.start_address),
        indent: 0,
    });
    line_no += 1;

    // Function signature
    let signature = format!("int64_t {}(int64_t a1, int64_t a2)", func.name);
    lines.push(DecompiledLine {
        line_number: line_no,
        text: format!("{} {{", signature),
        address_ref: Some(func.start_address),
        indent: 0,
    });
    line_no += 1;

    // Local variable declarations
    lines.push(DecompiledLine {
        line_number: line_no,
        text: "    int64_t rax = 0;".to_string(),
        address_ref: None,
        indent: 1,
    });
    line_no += 1;
    lines.push(DecompiledLine {
        line_number: line_no,
        text: "    int32_t var_4 = 0;".to_string(),
        address_ref: None,
        indent: 1,
    });
    line_no += 1;

    // Filter blocks belonging to this function
    let func_blocks: Vec<&BasicBlockInfo> = blocks
        .iter()
        .filter(|b| b.function_id == func.id || (b.start_address >= func.start_address && b.start_address < func.end_address))
        .collect();

    if func_blocks.is_empty() {
        lines.push(DecompiledLine {
            line_number: line_no,
            text: "    // [Empty or external thunk body]".to_string(),
            address_ref: Some(func.start_address),
            indent: 1,
        });
        line_no += 1;
    } else {
        for (b_idx, block) in func_blocks.iter().enumerate() {
            // Block label if multiple blocks
            if func_blocks.len() > 1 && b_idx > 0 {
                lines.push(DecompiledLine {
                    line_number: line_no,
                    text: format!("{}:", block.id),
                    address_ref: Some(block.start_address),
                    indent: 0,
                });
                line_no += 1;
            }

            for ins in &block.instructions {
                let m = ins.mnemonic.as_str();
                let op = ins.operands.as_str();

                // Skip pure stack frame setup in high-level C
                if (m == "push" && (op == "rbp" || op == "ebp"))
                    || (m == "mov" && (op == "rbp, rsp" || op == "ebp, esp"))
                    || (m == "pop" && (op == "rbp" || op == "ebp"))
                    || m.starts_with("endbr")
                {
                    continue;
                }

                let pseudo_line = match m {
                    "xor" if op.contains("eax, eax") || op.contains("rax, rax") => {
                        "rax = 0;".to_string()
                    }
                    "xor" => {
                        let parts: Vec<&str> = op.split(',').map(|s| s.trim()).collect();
                        if parts.len() == 2 {
                            format!("{} ^= {};", parts[0], parts[1])
                        } else {
                            format!("/* xor {} */", op)
                        }
                    }
                    "mov" => {
                        let parts: Vec<&str> = op.split(',').map(|s| s.trim()).collect();
                        if parts.len() == 2 {
                            format!("{} = {};", parts[0], parts[1])
                        } else {
                            format!("/* mov {} */", op)
                        }
                    }
                    "add" => {
                        let parts: Vec<&str> = op.split(',').map(|s| s.trim()).collect();
                        if parts.len() == 2 {
                            format!("{} += {};", parts[0], parts[1])
                        } else {
                            format!("/* add {} */", op)
                        }
                    }
                    "sub" => {
                        let parts: Vec<&str> = op.split(',').map(|s| s.trim()).collect();
                        if parts.len() == 2 {
                            format!("{} -= {};", parts[0], parts[1])
                        } else {
                            format!("/* sub {} */", op)
                        }
                    }
                    "call" => {
                        if let Some(target) = ins.target_address {
                            format!("rax = sub_{:08X}({});", target, op)
                        } else {
                            format!("rax = call({});", op)
                        }
                    }
                    "cmp" => {
                        let parts: Vec<&str> = op.split(',').map(|s| s.trim()).collect();
                        if parts.len() == 2 {
                            format!("// test if ({} == {})", parts[0], parts[1])
                        } else {
                            format!("// cmp {}", op)
                        }
                    }
                    "test" => {
                        format!("// test {}", op)
                    }
                    "ret" => {
                        "return rax;".to_string()
                    }
                    "lea" => {
                        let parts: Vec<&str> = op.split(',').map(|s| s.trim()).collect();
                        if parts.len() == 2 {
                            format!("{} = &{};", parts[0], parts[1])
                        } else {
                            format!("/* lea {} */", op)
                        }
                    }
                    _ if ins.is_cond_jump => {
                        let target_str = ins.target_address
                            .map(|a| format!("goto bb_{:08X};", a))
                            .unwrap_or_else(|| format!("goto {};", op));
                        format!("if (/* condition */) {}", target_str)
                    }
                    _ if ins.is_jump => {
                        let target_str = ins.target_address
                            .map(|a| format!("goto bb_{:08X};", a))
                            .unwrap_or_else(|| format!("goto {};", op));
                        target_str
                    }
                    _ => {
                        format!("__asm__(\"{} {}\");", m, op)
                    }
                };

                lines.push(DecompiledLine {
                    line_number: line_no,
                    text: format!("    {}", pseudo_line),
                    address_ref: Some(ins.address),
                    indent: 1,
                });
                line_no += 1;
            }

            // If block ends without explicit ret/jump, show branch logic
            for edge in &block.successors {
                if edge.branch_type == BranchType::ConditionalTrue {
                    lines.push(DecompiledLine {
                        line_number: line_no,
                        text: format!("    // [branch taken -> {}]", edge.to_block),
                        address_ref: None,
                        indent: 1,
                    });
                    line_no += 1;
                }
            }
        }
    }

    // Closing brace
    lines.push(DecompiledLine {
        line_number: line_no,
        text: "}".to_string(),
        address_ref: Some(func.end_address),
        indent: 0,
    });

    DecompiledFunction {
        function_id: func.id.clone(),
        name: func.name.clone(),
        signature,
        code_lines: lines,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::DisasmInstruction;

    #[test]
    fn test_decompiler_simple() {
        let func = FunctionInfo {
            id: "func_1000".into(),
            name: "calculate".into(),
            start_address: 0x1000,
            end_address: 0x1010,
            size: 16,
            basic_block_count: 1,
            is_entry: false,
            calling_convention: "cdecl".into(),
            x_refs_to: vec![],
            comment: None,
        };

        let ins = vec![
            DisasmInstruction {
                address: 0x1000,
                size: 3,
                bytes_hex: "48 31 c0".into(),
                mnemonic: "xor".into(),
                operands: "rax, rax".into(),
                is_call: false,
                is_jump: false,
                is_cond_jump: false,
                is_ret: false,
                target_address: None,
                comment: None,
            },
            DisasmInstruction {
                address: 0x1003,
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

        let block = BasicBlockInfo {
            id: "bb_00001000".into(),
            function_id: "func_1000".into(),
            start_address: 0x1000,
            end_address: 0x1004,
            instructions: ins,
            successors: vec![],
            predecessors: vec![],
        };

        let decompiled = decompile_function(&func, &[block]);
        assert!(decompiled.code_lines.iter().any(|l| l.text.contains("rax = 0;")));
        assert!(decompiled.code_lines.iter().any(|l| l.text.contains("return rax;")));
    }
}
