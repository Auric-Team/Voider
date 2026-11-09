import { describe, it, expect } from "vitest";
import {
  calculateEntropy,
  computeEntropyBlocks,
  extractClientStrings,
} from "../engine/clientAnalyzer";
import { SAMPLE_PE, SAMPLE_DECOMPILED } from "../engine/demoSamples";

describe("Voider Core Analysis Tests", () => {
  it("computes zero entropy for uniform zero bytes", () => {
    const zeroes = new Uint8Array(512);
    expect(calculateEntropy(zeroes)).toBe(0);
  });

  it("computes high entropy for diverse byte distribution", () => {
    const bytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      bytes[i] = i;
    }
    const entropy = calculateEntropy(bytes);
    expect(entropy).toBeGreaterThan(7.9);
  });

  it("partitions entropy into visual heat blocks", () => {
    const bytes = new Uint8Array(1024);
    const blocks = computeEntropyBlocks(bytes, 16);
    expect(blocks).toHaveLength(16);
  });

  it("extracts ASCII strings with minimum length constraint", () => {
    const buffer = new Uint8Array([
      0x00, 0x01, 0x02,
      // "VoiderTest"
      0x56, 0x6f, 0x69, 0x64, 0x65, 0x72, 0x54, 0x65, 0x73, 0x74,
      0x00, 0x00,
    ]);
    const strings = extractClientStrings(buffer, 4);
    expect(strings.length).toBeGreaterThanOrEqual(1);
    expect(strings[0].value).toBe("VoiderTest");
  });

  it("loads and structures built-in PE analysis sample", () => {
    expect(SAMPLE_PE.info.filename).toBe("crackme_keygen.exe");
    expect(SAMPLE_PE.sections).toHaveLength(5);
    expect(SAMPLE_PE.functions.length).toBeGreaterThanOrEqual(4);
    expect(SAMPLE_PE.basic_blocks.length).toBeGreaterThanOrEqual(3);
  });

  it("contains valid control flow graph edges in sample", () => {
    const entryBlock = SAMPLE_PE.basic_blocks[0];
    expect(entryBlock.successors).toHaveLength(2);
    expect(entryBlock.successors[0].branch_type).toBe("ConditionalTrue");
    expect(entryBlock.successors[1].branch_type).toBe("ConditionalFalse");
  });

  it("reconstructs Pseudo-C decompiler lines with address references", () => {
    const mainDecomp = SAMPLE_DECOMPILED["func_entry"];
    expect(mainDecomp).toBeDefined();
    expect(mainDecomp.code_lines.length).toBeGreaterThan(10);
    expect(mainDecomp.code_lines.some((l) => l.text.includes("check_license_key"))).toBe(true);
    expect(mainDecomp.code_lines.some((l) => l.address_ref === 0x140001021)).toBe(true);
  });
});
