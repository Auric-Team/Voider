import React, { useState } from "react";
import { Search, ArrowRight, Crosshair, Sparkles } from "lucide-react";
import type { DisasmInstruction } from "../../core/types/binary";

interface PatternScannerProps {
  instructions: DisasmInstruction[];
  onJumpToAddress: (address: number) => void;
}

export const PatternScanner: React.FC<PatternScannerProps> = ({
  instructions,
  onJumpToAddress,
}) => {
  const [patternInput, setPatternInput] = useState("48 8D ?? ??");
  const [matches, setMatches] = useState<
    { address: number; instruction: DisasmInstruction; matchedBytes: string }[]
  >([]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const queryTokens = patternInput.trim().toUpperCase().split(/\s+/);
    if (queryTokens.length === 0) return;

    const results: { address: number; instruction: DisasmInstruction; matchedBytes: string }[] = [];

    for (const ins of instructions) {
      const insBytes = ins.bytes_hex.split(/\s+/);
      if (insBytes.length >= queryTokens.length) {
        let isMatch = true;
        for (let i = 0; i < queryTokens.length; i++) {
          if (queryTokens[i] !== "??" && queryTokens[i] !== "?" && queryTokens[i] !== insBytes[i]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          results.push({
            address: ins.address,
            instruction: ins,
            matchedBytes: insBytes.slice(0, queryTokens.length).join(" "),
          });
        }
      }
    }

    setMatches(results);
  };

  const samplePresets = [
    { label: "Function Prologue (push rbp)", pattern: "55 48 89 E5" },
    { label: "Check & Branch (test eax, eax; jz)", pattern: "85 C0 74 ??" },
    { label: "LEA RIP Relative (48 8D ?? ??)", pattern: "48 8D ?? ??" },
    { label: "XOR Return (31 C0)", pattern: "31 C0" },
  ];

  return (
    <div className="flex-1 bg-[#090a10] overflow-y-auto font-mono text-xs flex flex-col p-6 select-text">
      {/* Banner */}
      <div className="bg-[#11131e] rounded-xl border border-[#23273a] p-5 mb-6 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Crosshair size={16} className="text-cyan-400" />
            <span>Byte Signature & Pattern Scanner (Wildcard Search)</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Search memory and code segments using hex byte patterns with wildcard support (`??`).
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-[#10121d] rounded-xl border border-[#232637] p-5 shadow-lg mb-6">
        <form onSubmit={handleScan} className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-3 text-gray-500" />
            <input
              type="text"
              value={patternInput}
              onChange={(e) => setPatternInput(e.target.value)}
              placeholder="e.g. 48 89 ?? ?? 55"
              className="w-full bg-[#171a28] text-cyan-300 font-bold text-sm pl-10 pr-4 py-2 rounded-lg border border-[#292d42] focus:border-cyan-500 focus:outline-none placeholder-gray-600"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center space-x-2 shadow-lg shadow-cyan-600/20"
          >
            <Search size={14} />
            <span>Scan Memory</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div className="mt-3 flex items-center space-x-2 text-[11px]">
          <span className="text-gray-500 flex items-center space-x-1">
            <Sparkles size={12} className="text-amber-400" />
            <span>Presets:</span>
          </span>
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPatternInput(preset.pattern);
              }}
              className="px-2 py-0.5 rounded bg-[#171926] hover:bg-[#202334] text-gray-400 hover:text-cyan-300 border border-[#26293d] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Results Table */}
      <div className="bg-[#10121d] rounded-xl border border-[#232637] p-5 shadow-lg flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-200 text-xs">
            Pattern Matches ({matches.length})
          </h3>
          <span className="text-[10px] text-gray-500">
            Click any row to jump to disassembly
          </span>
        </div>

        <div className="divide-y divide-[#171926] max-h-96 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="p-8 text-center text-gray-500 italic">
              No matches found. Enter a signature pattern above and click "Scan Memory".
            </div>
          ) : (
            matches.map((m, idx) => (
              <div
                key={idx}
                onClick={() => onJumpToAddress(m.address)}
                className="py-2.5 px-3 hover:bg-[#161828] rounded cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-cyan-400 font-bold w-28">
                    0x{m.address.toString(16).toUpperCase()}
                  </span>
                  <span className="text-amber-300 font-bold w-36">
                    {m.matchedBytes}
                  </span>
                  <div className="space-x-2">
                    <span className="text-white font-semibold">
                      {m.instruction.mnemonic}
                    </span>
                    <span className="text-gray-400">
                      {m.instruction.operands}
                    </span>
                  </div>
                </div>

                <ArrowRight size={13} className="text-gray-600 group-hover:text-cyan-400" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
