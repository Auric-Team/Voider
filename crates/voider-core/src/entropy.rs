/// Calculate Shannon Entropy (0.0 to 8.0) for a byte slice
pub fn calculate_entropy(bytes: &[u8]) -> f32 {
    if bytes.is_empty() {
        return 0.0;
    }

    let mut counts = [0usize; 256];
    for &b in bytes {
        counts[b as usize] += 1;
    }

    let len_f = bytes.len() as f32;
    let mut entropy = 0.0f32;

    for &count in counts.iter() {
        if count > 0 {
            let p = (count as f32) / len_f;
            entropy -= p * p.log2();
        }
    }

    entropy
}

/// Compute chunked entropy across a file to render an IDA/Ghidra style entropy visualization bar
pub fn compute_entropy_blocks(bytes: &[u8], num_blocks: usize) -> Vec<f32> {
    if bytes.is_empty() || num_blocks == 0 {
        return vec![0.0; num_blocks.max(1)];
    }

    let chunk_size = (bytes.len() + num_blocks - 1) / num_blocks;
    let mut blocks = Vec::with_capacity(num_blocks);

    for chunk in bytes.chunks(chunk_size) {
        blocks.push(calculate_entropy(chunk));
    }

    // Pad if fewer chunks than requested
    while blocks.len() < num_blocks {
        blocks.push(0.0);
    }

    blocks
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_zero_entropy() {
        let zeroes = vec![0u8; 1024];
        let ent = calculate_entropy(&zeroes);
        assert_eq!(ent, 0.0);
    }

    #[test]
    fn test_high_entropy() {
        let pattern: Vec<u8> = (0..=255).cycle().take(256 * 4).collect();
        let ent = calculate_entropy(&pattern);
        assert!((ent - 8.0).abs() < 0.01);
    }

    #[test]
    fn test_blocks_count() {
        let data = vec![0x41; 1000];
        let blocks = compute_entropy_blocks(&data, 50);
        assert_eq!(blocks.len(), 50);
    }
}
