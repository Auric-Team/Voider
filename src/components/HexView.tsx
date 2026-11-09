import { useState } from "react";
import { Search, ArrowRight, Binary } from "lucide-react";

interface HexViewProps {
  baseAddress: number;
  onJumpToAddress: (address: number) => void;
}

export const HexView = ({
  baseAddress,
  onJumpToAddress,
}: HexViewProps) => {
  const [jumpInput, setJumpInput] = useState("");
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);

  // Generate realistic sample hex memory dump
  const rowsCount = 120;
  const rows = [];

  // PE Header signature at row 0
  const sampleBytes = [
    0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00,
    0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00,
    0x0e, 0x1f, 0xba, 0x0e, 0x00, 0xb4, 0x09, 0xcd, 0x21, 0xb8, 0x01, 0x4c, 0xcd, 0x21, 0x54, 0x68,
    0x69, 0x73, 0x20, 0x70, 0x72, 0x6f, 0x67, 0x72, 0x61, 0x6d, 0x20, 0x63, 0x61, 0x6e, 0x6e, 0x6f,
    0x74, 0x20, 0x62, 0x65, 0x20, 0x72, 0x75, 0x6e, 0x20, 0x69, 0x6e, 0x20, 0x44, 0x4f, 0x53, 0x20,
    0x6d, 0x6f, 0x64, 0x65, 0x2e, 0x0d, 0x0d, 0x0a, 0x24, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    // PE Signature (0x80)
    0x50, 0x45, 0x00, 0x00, 0x64, 0x86, 0x05, 0x00, 0x30, 0x42, 0xa1, 0x67, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0xf0, 0x00, 0x22, 0x00, 0x0b, 0x02, 0x0e, 0x1c, 0x00, 0x48, 0x00, 0x00,
  ];

  for (let r = 0; r < rowsCount; r++) {
    const rowOffset = r * 16;
    const bytes: number[] = [];
    for (let c = 0; c < 16; c++) {
      const idx = rowOffset + c;
      if (idx < sampleBytes.length) {
        bytes.push(sampleBytes[idx]);
      } else {
        // Deterministic pseudo code generation for visual display
        bytes.push(((idx * 37) ^ (idx >> 2)) & 0xff);
      }
    }
    rows.push({ offset: rowOffset, bytes });
  }

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = parseInt(jumpInput.trim(), 16);
    if (!isNaN(addr)) {
      onJumpToAddress(addr);
      setSelectedOffset(addr - baseAddress);
    }
  };

  const toAsciiChar = (b: number): string => {
    if (b >= 0x20 && b <= 0x7e) {
      return String.fromCharCode(b);
    }
    return ".";
  };

  return (
    <div className="flex-1 bg-[#090a10] overflow-y-auto font-mono text-xs flex flex-col select-text">
      {/* Hex Toolbar */}
      <div className="bg-[#11131c] border-b border-[#212435] px-4 py-2 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2">
          <Binary size={16} className="text-cyan-400" />
          <span className="font-bold text-gray-200">Raw Hex & ASCII Viewer</span>
          <span className="text-[10px] text-gray-500">
            Base: 0x{baseAddress.toString(16).toUpperCase()}
          </span>
        </div>

        <form onSubmit={handleJump} className="flex items-center space-x-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
            <input
              type="text"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder="Jump to hex offset (e.g. 0x400)..."
              className="bg-[#171926] text-gray-200 text-xs pl-7 pr-3 py-1 rounded border border-[#2b2f44] focus:border-cyan-500 focus:outline-none w-64 placeholder-gray-600 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1 rounded bg-[#1c2032] hover:bg-[#252a42] text-cyan-400 border border-[#2a2f44] text-xs flex items-center space-x-1"
          >
            <span>Go</span>
            <ArrowRight size={12} />
          </button>
        </form>
      </div>

      {/* Hex Table */}
      <div className="p-3 flex-1 overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header row */}
          <div className="flex items-center text-gray-500 font-bold border-b border-[#1c1f2f] pb-1 mb-1 text-[11px] select-none">
            <span className="w-24 shrink-0">Offset</span>
            <div className="w-96 shrink-0 flex justify-between pr-4">
              {[...Array(16)].map((_, i) => (
                <span key={i} className="w-5 text-center">
                  {i.toString(16).toUpperCase().padStart(2, "0")}
                </span>
              ))}
            </div>
            <span className="w-40 shrink-0">ASCII Decoded</span>
          </div>

          {/* Rows */}
          {rows.map((row) => (
            <div
              key={row.offset}
              className="flex items-center hover:bg-[#12141f] py-0.5 rounded px-1 transition-colors"
            >
              {/* Offset */}
              <span className="w-24 shrink-0 text-cyan-500/80 font-mono select-none">
                0x{(baseAddress + row.offset).toString(16).toUpperCase().padStart(8, "0")}
              </span>

              {/* 16 Hex Bytes */}
              <div className="w-96 shrink-0 flex justify-between pr-4 font-mono">
                {row.bytes.map((b, idx) => {
                  const currentByteOffset = row.offset + idx;
                  const isSelected = selectedOffset === currentByteOffset;
                  const isZero = b === 0;

                  return (
                    <span
                      key={idx}
                      onClick={() => setSelectedOffset(currentByteOffset)}
                      className={`w-5 text-center cursor-pointer rounded transition-colors ${
                        isSelected
                          ? "bg-cyan-500 text-black font-bold"
                          : isZero
                          ? "text-gray-600"
                          : "text-gray-300 hover:text-cyan-300 hover:bg-[#1d2133]"
                      }`}
                    >
                      {b.toString(16).toUpperCase().padStart(2, "0")}
                    </span>
                  );
                })}
              </div>

              {/* ASCII view */}
              <div className="w-40 shrink-0 font-mono text-gray-400 tracking-wider">
                {row.bytes.map((b, idx) => (
                  <span
                    key={idx}
                    className={`inline-block w-2 text-center ${
                      b >= 0x20 && b <= 0x7e ? "text-emerald-300" : "text-gray-600"
                    }`}
                  >
                    {toAsciiChar(b)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
