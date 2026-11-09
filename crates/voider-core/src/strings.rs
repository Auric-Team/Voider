use crate::types::{SectionInfo, StringItem};

pub fn extract_strings(bytes: &[u8], min_length: usize, sections: &[SectionInfo]) -> Vec<StringItem> {
    let mut results = Vec::new();

    // 1. Extract ASCII strings
    let mut current_ascii = Vec::new();
    let mut start_offset = 0;

    for (i, &b) in bytes.iter().enumerate() {
        // Printable ASCII range + tab, newline, carriage return
        if (0x20..=0x7E).contains(&b) {
            if current_ascii.is_empty() {
                start_offset = i;
            }
            current_ascii.push(b);
        } else {
            if current_ascii.len() >= min_length {
                if let Ok(s) = String::from_utf8(current_ascii.clone()) {
                    let va = offset_to_va(start_offset as u64, sections);
                    let sec = find_section_name(start_offset as u64, sections);
                    results.push(StringItem {
                        address: va,
                        offset: start_offset as u64,
                        length: s.len(),
                        string_type: "ASCII".to_string(),
                        value: s,
                        section: sec,
                    });
                }
            }
            current_ascii.clear();
        }
    }

    if current_ascii.len() >= min_length {
        if let Ok(s) = String::from_utf8(current_ascii) {
            let va = offset_to_va(start_offset as u64, sections);
            let sec = find_section_name(start_offset as u64, sections);
            results.push(StringItem {
                address: va,
                offset: start_offset as u64,
                length: s.len(),
                string_type: "ASCII".to_string(),
                value: s,
                section: sec,
            });
        }
    }

    // 2. Extract UTF-16LE strings (common in Windows binaries)
    if bytes.len() >= min_length * 2 {
        let mut current_u16: Vec<u16> = Vec::new();
        let mut u16_start = 0;

        let mut i = 0;
        while i + 1 < bytes.len() {
            let val = (bytes[i] as u16) | ((bytes[i + 1] as u16) << 8);
            if (0x20..=0x7E).contains(&val) {
                if current_u16.is_empty() {
                    u16_start = i;
                }
                current_u16.push(val);
                i += 2;
            } else {
                if current_u16.len() >= min_length {
                    if let Ok(s) = String::from_utf16(&current_u16) {
                        let va = offset_to_va(u16_start as u64, sections);
                        let sec = find_section_name(u16_start as u64, sections);
                        results.push(StringItem {
                            address: va,
                            offset: u16_start as u64,
                            length: s.len(),
                            string_type: "UTF-16LE".to_string(),
                            value: s,
                            section: sec,
                        });
                    }
                }
                current_u16.clear();
                i += 2;
            }
        }
    }

    results
}

fn offset_to_va(offset: u64, sections: &[SectionInfo]) -> u64 {
    for sec in sections {
        if offset >= sec.raw_offset && offset < sec.raw_offset + sec.raw_size {
            return sec.virtual_address + (offset - sec.raw_offset);
        }
    }
    offset
}

fn find_section_name(offset: u64, sections: &[SectionInfo]) -> String {
    for sec in sections {
        if offset >= sec.raw_offset && offset < sec.raw_offset + sec.raw_size {
            return sec.name.clone();
        }
    }
    "HEADER".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_ascii() {
        let mut data = vec![0u8; 10];
        data.extend_from_slice(b"Hello World!");
        data.extend_from_slice(&[0, 0, 0]);

        let items = extract_strings(&data, 4, &[]);
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].value, "Hello World!");
        assert_eq!(items[0].offset, 10);
    }
}
