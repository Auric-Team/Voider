import { Cpu } from "lucide-react";
import type { BinaryInfo } from "../types/binary";

interface StatusBarProps {
  info: BinaryInfo;
  selectedAddress: number | null;
  currentSection: string;
  functionsCount: number;
  instructionsCount: number;
  stringsCount: number;
}

export const StatusBar = ({
  info,
  selectedAddress,
  currentSection,
  functionsCount,
  instructionsCount,
  stringsCount,
}: StatusBarProps) => {
  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  return (
    <footer className="bg-[#0b0c13] border-t border-[#1f2231] px-4 py-1.5 flex items-center justify-between text-[11px] font-mono select-none text-gray-400">
      <div className="flex items-center space-x-4">
        {/* Status indicator */}
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          <span className="text-gray-300 font-semibold">
            {isTauri ? "TAURI CORE ONLINE" : "VOIDER CORE READY"}
          </span>
        </div>

        {/* Selected Address */}
        <div className="flex items-center space-x-1 border-l border-[#212433] pl-3">
          <span className="text-gray-500">Cursor:</span>
          <span className="text-cyan-400 font-bold">
            {selectedAddress
              ? `0x${selectedAddress.toString(16).toUpperCase()}`
              : "0x" + info.entry_point.toString(16).toUpperCase()}
          </span>
        </div>

        {/* Current Section */}
        <div className="flex items-center space-x-1">
          <span className="text-gray-500">Sec:</span>
          <span className="text-emerald-400 font-medium">{currentSection}</span>
        </div>

        {/* Architecture */}
        <div className="hidden sm:flex items-center space-x-1">
          <Cpu size={12} className="text-gray-500" />
          <span>{info.arch}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Counts */}
        <div className="hidden md:flex items-center space-x-3 text-gray-500">
          <span>
            Funcs: <strong className="text-gray-300">{functionsCount}</strong>
          </span>
          <span>
            Ins: <strong className="text-gray-300">{instructionsCount}</strong>
          </span>
          <span>
            Strings: <strong className="text-gray-300">{stringsCount}</strong>
          </span>
        </div>

        {/* Keyboard tips */}
        <div className="hidden lg:flex items-center space-x-2 text-[10px] text-gray-500">
          <span className="px-1 py-0.5 rounded bg-[#171926] text-gray-400">Space</span>
          <span>Graph</span>
          <span className="px-1 py-0.5 rounded bg-[#171926] text-gray-400">F5</span>
          <span>Decompile</span>
          <span className="px-1 py-0.5 rounded bg-[#171926] text-gray-400">;</span>
          <span>Comment</span>
        </div>
      </div>
    </footer>
  );
};
