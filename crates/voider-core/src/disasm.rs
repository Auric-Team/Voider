use crate::types::DisasmInstruction;
use iced_x86::{Decoder, DecoderOptions, FlowControl, Formatter, IntelFormatter};

pub fn disassemble_x86(
    bytes: &[u8],
    base_ip: u64,
    bitness: u32,
    max_instructions: usize,
) -> Vec<DisasmInstruction> {
    if bytes.is_empty() {
        return Vec::new();
    }

    let mut decoder = Decoder::with_ip(bitness, bytes, base_ip, DecoderOptions::NONE);
    let mut formatter = IntelFormatter::new();
    formatter.options_mut().set_first_operand_char_index(10);
    formatter.options_mut().set_rip_relative_addresses(true);

    let mut instructions = Vec::new();
    let mut instruction = iced_x86::Instruction::default();
    let mut output = String::new();

    while decoder.can_decode() && instructions.len() < max_instructions {
        decoder.decode_out(&mut instruction);
        let ip = instruction.ip();
        let len = instruction.len();

        let slice_start = if ip >= base_ip {
            (ip - base_ip) as usize
        } else {
            0
        };
        let slice_end = (slice_start + len).min(bytes.len());
        let raw_bytes = if slice_start < bytes.len() {
            &bytes[slice_start..slice_end]
        } else {
            &[]
        };

        let bytes_hex = raw_bytes
            .iter()
            .map(|b| format!("{:02X}", b))
            .collect::<Vec<String>>()
            .join(" ");

        output.clear();
        formatter.format(&instruction, &mut output);

        let parts: Vec<&str> = output.splitn(2, ' ').collect();
        let mnemonic = parts.first().unwrap_or(&"???").trim().to_string();
        let operands = parts.get(1).unwrap_or(&"").trim().to_string();

        let flow = instruction.flow_control();
        let is_call = matches!(flow, FlowControl::Call);
        let is_ret = matches!(flow, FlowControl::Return);
        let is_cond_jump = matches!(
            flow,
            FlowControl::ConditionalBranch
        );
        let is_jump = matches!(
            flow,
            FlowControl::UnconditionalBranch | FlowControl::IndirectBranch
        ) || is_cond_jump;

        let has_near_target = matches!(
            flow,
            FlowControl::Call
                | FlowControl::ConditionalBranch
                | FlowControl::UnconditionalBranch
        );

        let target_address = if has_near_target {
            Some(instruction.near_branch_target())
        } else {
            None
        };

        instructions.push(DisasmInstruction {
            address: ip,
            size: len,
            bytes_hex,
            mnemonic,
            operands,
            is_call,
            is_jump,
            is_cond_jump,
            is_ret,
            target_address,
            comment: None,
        });
    }

    instructions
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_disasm_simple_function() {
        // x86_64:
        // 55                push rbp
        // 48 89 e5          mov rbp, rsp
        // b8 2a 00 00 00    mov eax, 42
        // 5d                pop rbp
        // c3                ret
        let code = [0x55, 0x48, 0x89, 0xE5, 0xB8, 0x2A, 0x00, 0x00, 0x00, 0x5D, 0xC3];
        let disasm = disassemble_x86(&code, 0x1000, 64, 100);

        assert_eq!(disasm.len(), 5);
        assert_eq!(disasm[0].mnemonic, "push");
        assert_eq!(disasm[0].operands, "rbp");
        assert_eq!(disasm[2].mnemonic, "mov");
        assert!(disasm[4].is_ret);
    }
}
