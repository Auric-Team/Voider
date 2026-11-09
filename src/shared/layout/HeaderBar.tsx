import { useRef } from "react";
import {
  Code2,
  FileCode,
  Network,
  Binary,
  Layers,
  Upload,
  Sparkles,
  Command,
  Download,
  Link2,
  GitFork,
  Boxes,
  Wrench,
  Crosshair,
  Bookmark,
} from "lucide-react";
import type { BinaryInfo } from "../../core/types/binary";

export type WorkbenchView =
  | "listing"
  | "graph"
  | "decompiler"
  | "hex"
  | "headers"
  | "xrefs"
  | "callgraph"
  | "structs"
  | "patcher"
  | "search"
  | "bookmarks";

interface HeaderBarProps {
  currentView: WorkbenchView;
  onSelectView: (view: WorkbenchView) => void;
  info: BinaryInfo;
  onLoadFile: (file: File) => void;
  onLoadSample: () => void;
  onOpenCommandPalette: () => void;
  onExport: () => void;
}

export const HeaderBar = ({
  currentView,
  onSelectView,
  info,
  onLoadFile,
  onLoadSample,
  onOpenCommandPalette,
  onExport,
}: HeaderBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLoadFile(e.target.files[0]);
    }
  };

  const navItems: { id: WorkbenchView; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: "listing", label: "Disassembly", icon: <FileCode size={15} />, shortcut: "Space" },
    { id: "graph", label: "Graph (CFG)", icon: <Network size={15} />, shortcut: "Space" },
    { id: "decompiler", label: "Decompiler", icon: <Code2 size={15} />, shortcut: "F5" },
    { id: "hex", label: "Hex Editor", icon: <Binary size={15} />, shortcut: "Alt+H" },
    { id: "xrefs", label: "XREFs", icon: <Link2 size={15} />, shortcut: "X" },
    { id: "callgraph", label: "Call Graph", icon: <GitFork size={15} />, shortcut: "C" },
    { id: "structs", label: "Structs", icon: <Boxes size={15} />, shortcut: "T" },
    { id: "patcher", label: "Patch Studio", icon: <Wrench size={15} />, shortcut: "P" },
    { id: "search", label: "Signature Scan", icon: <Crosshair size={15} />, shortcut: "Alt+S" },
    { id: "bookmarks", label: "Bookmarks", icon: <Bookmark size={15} />, shortcut: "B" },
    { id: "headers", label: "Headers", icon: <Layers size={15} />, shortcut: "Alt+E" },
  ];

  return (
    <header className="bg-[#0b0c13] border-b border-[#212433] px-4 py-2 flex items-center justify-between select-none">
      {/* Brand & File Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-sm tracking-wider">
            V
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-200 to-white">
                VOIDER
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 font-mono font-semibold">
                v2.0 PRO
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono truncate max-w-[140px]">
              {info.filename}
            </div>
          </div>
        </div>

        {/* Binary Info Tags */}
        <div className="hidden xl:flex items-center space-x-1.5 pl-3 border-l border-[#232635]">
          <span className="px-2 py-0.5 rounded bg-[#161822] text-[#00d4ff] font-mono text-[11px] border border-[#2d3145]">
            {info.format}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#161822] text-emerald-400 font-mono text-[11px] border border-[#2d3145]">
            {info.arch}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#161822] text-purple-400 font-mono text-[11px] border border-[#2d3145]">
            EP: 0x{info.entry_point.toString(16).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <div className="flex items-center bg-[#13141f] p-1 rounded-lg border border-[#232635] overflow-x-auto max-w-[55vw]">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1c2a]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              <kbd className="hidden 2xl:inline-block text-[9px] px-1 py-0.2 rounded bg-black/40 text-gray-500 font-mono">
                {item.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-[#171926] hover:bg-[#202334] text-gray-300 hover:text-white border border-[#2a2e42] text-xs transition-colors"
          title="Open binary file from your PC (ELF, PE, raw)"
        >
          <Upload size={14} className="text-cyan-400" />
          <span className="hidden sm:inline">Open Binary</span>
        </button>

        <button
          onClick={onLoadSample}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-[#171926] hover:bg-[#202334] text-gray-300 hover:text-white border border-[#2a2e42] text-xs transition-colors"
          title="Reload demo crackme binary"
        >
          <Sparkles size={14} className="text-amber-400" />
          <span className="hidden sm:inline">Demo Sample</span>
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-[#171926] hover:bg-[#202334] text-gray-300 hover:text-white border border-[#2a2e42] text-xs transition-colors"
          title="Command Palette (Ctrl+K)"
        >
          <Command size={14} className="text-purple-400" />
          <kbd className="text-[10px] text-gray-500 font-mono">Ctrl+K</kbd>
        </button>

        <button
          onClick={onExport}
          className="p-1.5 rounded bg-[#171926] hover:bg-[#202334] text-gray-400 hover:text-white border border-[#2a2e42] text-xs transition-colors"
          title="Export Analysis JSON"
        >
          <Download size={14} />
        </button>
      </div>
    </header>
  );
};
