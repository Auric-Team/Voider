import { useState, useEffect } from "react";
import { Search, Code2, Network, Binary, Layers, FileCode, ArrowRight, X } from "lucide-react";
import type { FunctionInfo } from "../types/binary";
import type { WorkbenchView } from "./HeaderBar";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  functions: FunctionInfo[];
  onSelectView: (view: WorkbenchView) => void;
  onJumpToAddress: (address: number) => void;
  onSelectFunction: (func: FunctionInfo) => void;
}

export const CommandPalette = ({
  isOpen,
  onClose,
  functions,
  onSelectView,
  onJumpToAddress,
  onSelectFunction,
}: CommandPaletteProps) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: "view-listing",
      title: "View: Disassembly Listing",
      icon: <FileCode size={14} className="text-cyan-400" />,
      run: () => onSelectView("listing"),
    },
    {
      id: "view-graph",
      title: "View: Control Flow Graph (CFG)",
      icon: <Network size={14} className="text-purple-400" />,
      run: () => onSelectView("graph"),
    },
    {
      id: "view-decompiler",
      title: "View: Pseudo-C Decompiler",
      icon: <Code2 size={14} className="text-amber-400" />,
      run: () => onSelectView("decompiler"),
    },
    {
      id: "view-hex",
      title: "View: Hex & ASCII Editor",
      icon: <Binary size={14} className="text-emerald-400" />,
      run: () => onSelectView("hex"),
    },
    {
      id: "view-headers",
      title: "View: Binary Headers",
      icon: <Layers size={14} className="text-blue-400" />,
      run: () => onSelectView("headers"),
    },
  ];

  const filteredFunctions = functions.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = parseInt(query.trim(), 16);
    if (!isNaN(addr)) {
      onJumpToAddress(addr);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#11131e] rounded-xl border border-[#2b3045] shadow-2xl overflow-hidden flex flex-col font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={handleAddressSubmit}
          className="flex items-center px-4 py-3 border-b border-[#212435] bg-[#161825]"
        >
          <Search size={16} className="text-cyan-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, function name, or hex address (e.g. 140001000)..."
            autoFocus
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500 font-mono"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-gray-500 hover:text-white"
          >
            <X size={16} />
          </button>
        </form>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-[#191b29] p-2">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Commands
              </div>
              {filteredActions.map((act) => (
                <div
                  key={act.id}
                  onClick={() => {
                    act.run();
                    onClose();
                  }}
                  className="px-3 py-2 rounded hover:bg-[#1a1d2e] cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2 text-gray-200 group-hover:text-white">
                    {act.icon}
                    <span>{act.title}</span>
                  </div>
                  <ArrowRight size={13} className="text-gray-600 group-hover:text-cyan-400" />
                </div>
              ))}
            </div>
          )}

          {/* Functions */}
          {filteredFunctions.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Jump to Function
              </div>
              {filteredFunctions.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    onSelectFunction(f);
                    onClose();
                  }}
                  className="px-3 py-2 rounded hover:bg-[#1a1d2e] cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-400 font-bold">{f.name}</span>
                    <span className="text-gray-500 text-[11px]">
                      0x{f.start_address.toString(16).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-600 text-[10px]">
                    {f.basic_block_count} BBs
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
