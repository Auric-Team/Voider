import { useState } from "react";
import {
  ListTree,
  Quote,
  Library,
  Layers,
  Search,
  ChevronRight,
  Flame,
} from "lucide-react";
import type {
  FunctionInfo,
  StringItem,
  ImportItem,
  ExportItem,
  SectionInfo,
} from "../../core/types/binary";

type SidebarTab = "functions" | "strings" | "imports" | "sections";

interface SidebarProps {
  functions: FunctionInfo[];
  strings: StringItem[];
  imports: ImportItem[];
  exports: ExportItem[];
  sections: SectionInfo[];
  selectedFunctionId: string;
  onSelectFunction: (func: FunctionInfo) => void;
  onJumpToAddress: (address: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  functions,
  strings,
  imports,
  exports,
  sections,
  selectedFunctionId,
  onSelectFunction,
  onJumpToAddress,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("functions");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFunctions = functions.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.start_address.toString(16).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStrings = strings.filter(
    (s) =>
      s.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toString(16).toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredImports = imports.filter(
    (imp) =>
      imp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      imp.library.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-80 bg-[#0e0f18] border-r border-[#202332] flex flex-col h-full select-none text-xs">
      {/* Sidebar Navigation Tabs */}
      <div className="flex border-b border-[#202332] bg-[#090a10]">
        <button
          onClick={() => {
            setActiveTab("functions");
            setSearchQuery("");
          }}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 font-medium transition-colors ${
            activeTab === "functions"
              ? "border-cyan-500 text-cyan-400 bg-[#141622]"
              : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#11131c]"
          }`}
          title="Functions (F)"
        >
          <ListTree size={14} />
          <span>Funcs ({functions.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("strings");
            setSearchQuery("");
          }}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 font-medium transition-colors ${
            activeTab === "strings"
              ? "border-cyan-500 text-cyan-400 bg-[#141622]"
              : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#11131c]"
          }`}
          title="Strings (S)"
        >
          <Quote size={14} />
          <span>Strings</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("imports");
            setSearchQuery("");
          }}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 font-medium transition-colors ${
            activeTab === "imports"
              ? "border-cyan-500 text-cyan-400 bg-[#141622]"
              : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#11131c]"
          }`}
          title="Imports & Exports"
        >
          <Library size={14} />
          <span>Imports</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("sections");
            setSearchQuery("");
          }}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 border-b-2 font-medium transition-colors ${
            activeTab === "sections"
              ? "border-cyan-500 text-cyan-400 bg-[#141622]"
              : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#11131c]"
          }`}
          title="Sections"
        >
          <Layers size={14} />
          <span>Secs</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      {activeTab !== "sections" && (
        <div className="p-2 border-b border-[#1c1e2b] bg-[#11121c]">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-2.5 text-gray-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filter ${activeTab}...`}
              className="w-full bg-[#181a26] text-gray-200 text-xs pl-8 pr-3 py-1.5 rounded border border-[#2b2f42] focus:border-cyan-500 focus:outline-none placeholder-gray-600 font-mono"
            />
          </div>
        </div>
      )}

      {/* List Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* FUNCTIONS TAB */}
        {activeTab === "functions" && (
          <div className="divide-y divide-[#1a1c29]">
            {filteredFunctions.map((func) => {
              const isSelected = selectedFunctionId === func.id;
              return (
                <div
                  key={func.id}
                  onClick={() => onSelectFunction(func)}
                  className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between group ${
                    isSelected
                      ? "bg-cyan-950/40 border-l-2 border-cyan-400 text-white"
                      : "hover:bg-[#141622] text-gray-300"
                  }`}
                >
                  <div className="truncate flex-1 pr-2">
                    <div className="flex items-center space-x-1.5">
                      {func.is_entry && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                      )}
                      <span className="font-mono font-medium text-[12px] group-hover:text-cyan-300 truncate">
                        {func.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono flex items-center space-x-2 mt-0.5">
                      <span>0x{func.start_address.toString(16).toUpperCase()}</span>
                      <span>•</span>
                      <span>{func.size} B</span>
                      <span>•</span>
                      <span>{func.basic_block_count} BBs</span>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`text-gray-600 group-hover:text-cyan-400 transition-transform ${
                      isSelected ? "transform rotate-90 text-cyan-400" : ""
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* STRINGS TAB */}
        {activeTab === "strings" && (
          <div className="divide-y divide-[#1a1c29]">
            {filteredStrings.map((str, idx) => (
              <div
                key={idx}
                onClick={() => onJumpToAddress(str.address)}
                className="px-3 py-2 hover:bg-[#141622] cursor-pointer transition-colors group"
              >
                <div className="font-mono text-amber-300 text-[11px] truncate group-hover:text-amber-200">
                  "{str.value}"
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-0.5">
                  <span>0x{str.address.toString(16).toUpperCase()}</span>
                  <span className="px-1 rounded bg-[#1c1e2b] text-gray-400">
                    {str.section}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* IMPORTS TAB */}
        {activeTab === "imports" && (
          <div className="divide-y divide-[#1a1c29]">
            <div className="px-3 py-1 bg-[#121420] text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
              Imports ({filteredImports.length})
            </div>
            {filteredImports.map((imp, idx) => (
              <div
                key={idx}
                onClick={() => onJumpToAddress(imp.address)}
                className="px-3 py-2 hover:bg-[#141622] cursor-pointer transition-colors"
              >
                <div className="font-mono text-cyan-300 font-medium text-[11px] truncate">
                  {imp.name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-0.5">
                  <span className="text-gray-400">{imp.library}</span>
                  <span>0x{imp.address.toString(16).toUpperCase()}</span>
                </div>
              </div>
            ))}

            {exports.length > 0 && (
              <>
                <div className="px-3 py-1 bg-[#121420] text-gray-400 font-semibold text-[10px] uppercase tracking-wider mt-2">
                  Exports ({exports.length})
                </div>
                {exports.map((exp, idx) => (
                  <div
                    key={idx}
                    onClick={() => onJumpToAddress(exp.address)}
                    className="px-3 py-2 hover:bg-[#141622] cursor-pointer transition-colors"
                  >
                    <div className="font-mono text-emerald-300 font-medium text-[11px] truncate">
                      {exp.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      0x{exp.address.toString(16).toUpperCase()}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* SECTIONS TAB */}
        {activeTab === "sections" && (
          <div className="p-2 space-y-2">
            {sections.map((sec, idx) => (
              <div
                key={idx}
                onClick={() => onJumpToAddress(sec.virtual_address)}
                className="p-2.5 rounded bg-[#131522] border border-[#212538] hover:border-cyan-500/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-white text-[12px]">
                    {sec.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      sec.is_executable
                        ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-950/70 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {sec.permissions}
                  </span>
                </div>
                <div className="mt-1.5 text-[10px] text-gray-400 font-mono space-y-0.5">
                  <div className="flex justify-between">
                    <span>Virtual Addr:</span>
                    <span className="text-gray-300">
                      0x{sec.virtual_address.toString(16).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Virtual Size:</span>
                    <span className="text-gray-300">
                      0x{sec.virtual_size.toString(16)} ({sec.virtual_size} B)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Raw Offset:</span>
                    <span className="text-gray-300">
                      0x{sec.raw_offset.toString(16)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-gray-500 flex items-center space-x-1">
                    <Flame size={12} className="text-amber-500" />
                    <span>Entropy:</span>
                  </span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {sec.entropy.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
