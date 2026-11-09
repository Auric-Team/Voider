import { useState, useEffect, useCallback } from "react";
import { HeaderBar, type WorkbenchView } from "./shared/layout/HeaderBar";
import { StatusBar } from "./shared/layout/StatusBar";
import { EntropyBar } from "./features/entropy/EntropyBar";
import { Sidebar } from "./features/navigator/Sidebar";
import { DisassemblyView } from "./features/disassembly/DisassemblyView";
import { GraphView } from "./features/cfg/GraphView";
import { DecompilerView } from "./features/decompiler/DecompilerView";
import { HexView } from "./features/hex/HexView";
import { HeaderInspector } from "./features/headers/HeaderInspector";
import { XrefsModal } from "./features/xrefs/XrefsModal";
import { CallGraphView } from "./features/callgraph/CallGraphView";
import { StructsManager } from "./features/structs/StructsManager";
import { PatchStudio } from "./features/patcher/PatchStudio";
import { PatternScanner } from "./features/search/PatternScanner";
import { BookmarksManager } from "./features/bookmarks/BookmarksManager";
import { CommandPalette } from "./features/command-palette/CommandPalette";

import {
  SAMPLE_PE,
  SAMPLE_XREFS,
  SAMPLE_CALLGRAPH,
  SAMPLE_STRUCTS,
  SAMPLE_BOOKMARKS,
} from "./core/samples/demoSamples";
import { analyzeFileBuffer } from "./core/analyzer/clientAnalyzer";
import type {
  BinaryAnalysis,
  FunctionInfo,
  XrefItem,
  CallGraphNode,
  StructDefinition,
  BinaryPatch,
  BookmarkItem,
} from "./core/types/binary";
import "./App.css";

export function App() {
  const [analysis, setAnalysis] = useState<BinaryAnalysis>(SAMPLE_PE);
  const [currentView, setCurrentView] = useState<WorkbenchView>("listing");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("func_entry");
  const [selectedAddress, setSelectedAddress] = useState<number | null>(
    SAMPLE_PE.info.entry_point
  );
  const [comments, setComments] = useState<Record<number, string>>({});
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Extended Reverse Engineering Features State
  const [xrefs] = useState<XrefItem[]>(SAMPLE_XREFS);
  const [isXrefsModalOpen, setIsXrefsModalOpen] = useState(false);
  const [xrefsTargetAddress, setXrefsTargetAddress] = useState<number>(
    SAMPLE_PE.info.entry_point
  );
  const [callGraphNodes] = useState<CallGraphNode[]>(SAMPLE_CALLGRAPH);
  const [structs, setStructs] = useState<StructDefinition[]>(SAMPLE_STRUCTS);
  const [patches, setPatches] = useState<BinaryPatch[]>([
    {
      id: "patch_default_1",
      address: 0x140001028,
      original_bytes: "74 0D",
      patched_bytes: "90 90",
      mnemonic: "nop; nop (Bypass license key verify)",
      comment: "Inverted conditional jump to bypass auth failure",
      is_active: true,
      timestamp: Date.now() - 3600000,
    },
  ]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(SAMPLE_BOOKMARKS);

  const currentFunction =
    analysis.functions.find((f) => f.id === selectedFunctionId) ||
    analysis.functions[0] ||
    null;

  const handleOpenXrefs = useCallback((address: number) => {
    setXrefsTargetAddress(address);
    setIsXrefsModalOpen(true);
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.code === "Space") {
        e.preventDefault();
        setCurrentView((prev) => (prev === "listing" ? "graph" : "listing"));
      } else if (e.key === "F5") {
        e.preventDefault();
        setCurrentView("decompiler");
      } else if (e.key.toLowerCase() === "x") {
        e.preventDefault();
        if (selectedAddress !== null) {
          handleOpenXrefs(selectedAddress);
        }
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        setCurrentView("callgraph");
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setCurrentView("structs");
      } else if (e.key.toLowerCase() === "p" && !e.ctrlKey) {
        e.preventDefault();
        setCurrentView("patcher");
      } else if (e.key.toLowerCase() === "b" && !e.ctrlKey) {
        e.preventDefault();
        setCurrentView("bookmarks");
      } else if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setCurrentView("search");
      } else if (e.altKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setCurrentView("hex");
      } else if (e.altKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setCurrentView("headers");
      } else if (e.key.toLowerCase() === "g") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAddress, handleOpenXrefs]);

  const handleSelectFunction = useCallback((func: FunctionInfo) => {
    setSelectedFunctionId(func.id);
    setSelectedAddress(func.start_address);
  }, []);

  const handleSelectFunctionByName = useCallback(
    (name: string) => {
      const match = analysis.functions.find((f) => f.name === name);
      if (match) {
        setSelectedFunctionId(match.id);
        setSelectedAddress(match.start_address);
      }
    },
    [analysis.functions]
  );

  const handleJumpToAddress = useCallback(
    (address: number) => {
      setSelectedAddress(address);
      const matchingFunc = analysis.functions.find(
        (f) => address >= f.start_address && address < f.end_address
      );
      if (matchingFunc) {
        setSelectedFunctionId(matchingFunc.id);
      }
    },
    [analysis.functions]
  );

  const handleLoadFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const result = await analyzeFileBuffer(buffer, file.name);
      setAnalysis(result);
      if (result.functions.length > 0) {
        setSelectedFunctionId(result.functions[0].id);
        setSelectedAddress(result.functions[0].start_address);
      } else {
        setSelectedAddress(result.info.entry_point);
      }
    } catch (err) {
      alert("Failed to analyze binary: " + err);
    }
  };

  const handleLoadSample = () => {
    setAnalysis(SAMPLE_PE);
    setSelectedFunctionId("func_entry");
    setSelectedAddress(SAMPLE_PE.info.entry_point);
  };

  const handleSetComment = (address: number, comment: string) => {
    setComments((prev) => ({
      ...prev,
      [address]: comment,
    }));
  };

  // Patch Studio actions
  const handleAddPatch = (patchData: Omit<BinaryPatch, "id" | "timestamp">) => {
    const newPatch: BinaryPatch = {
      ...patchData,
      id: `patch_${Date.now()}`,
      timestamp: Date.now(),
    };
    setPatches((prev) => [newPatch, ...prev]);
  };

  const handleTogglePatch = (id: string) => {
    setPatches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );
  };

  const handleRemovePatch = (id: string) => {
    setPatches((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDownloadPatchedBinary = () => {
    const patchSummary = {
      target: analysis.info.filename,
      applied_patches: patches.filter((p) => p.is_active),
      export_timestamp: new Date().toISOString(),
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(patchSummary, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `${analysis.info.filename}.patched.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Bookmarks actions
  const handleAddBookmark = (bm: BookmarkItem) => {
    setBookmarks((prev) => [bm, ...prev]);
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  // Structs actions
  const handleAddStruct = (def: StructDefinition) => {
    setStructs((prev) => [...prev, def]);
  };

  const handleExport = () => {
    const exportBundle = {
      analysis,
      comments,
      patches,
      bookmarks,
      structs,
      export_version: "2.0-pro",
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${analysis.info.filename}.voiderdb.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const activeSection =
    analysis.sections.find(
      (s) =>
        selectedAddress !== null &&
        selectedAddress >= s.virtual_address &&
        selectedAddress < s.virtual_address + s.virtual_size
    )?.name || ".text";

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07080d] text-gray-200">
      {/* 1. Global Navigation Header */}
      <HeaderBar
        currentView={currentView}
        onSelectView={setCurrentView}
        info={analysis.info}
        onLoadFile={handleLoadFile}
        onLoadSample={handleLoadSample}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onExport={handleExport}
      />

      {/* 2. Visual Shannon Entropy Heat Bar */}
      <EntropyBar
        blocks={analysis.entropy_blocks}
        overallEntropy={analysis.info.overall_entropy}
      />

      {/* 3. Main Center Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigator Sidebar (Functions, Strings, Imports, Sections) */}
        <Sidebar
          functions={analysis.functions}
          strings={analysis.strings}
          imports={analysis.imports}
          exports={analysis.exports}
          sections={analysis.sections}
          selectedFunctionId={selectedFunctionId}
          onSelectFunction={handleSelectFunction}
          onJumpToAddress={handleJumpToAddress}
        />

        {/* Center Active Analysis View */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {currentView === "listing" && (
            <DisassemblyView
              instructions={analysis.instructions}
              functions={analysis.functions}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onJumpToAddress={handleJumpToAddress}
              comments={comments}
              onSetComment={handleSetComment}
              onOpenXrefs={handleOpenXrefs}
            />
          )}

          {currentView === "graph" && (
            <GraphView
              currentFunction={currentFunction}
              blocks={analysis.basic_blocks}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
              onJumpToAddress={handleJumpToAddress}
            />
          )}

          {currentView === "decompiler" && (
            <DecompilerView
              currentFunction={currentFunction}
              selectedAddress={selectedAddress}
              onSelectAddress={setSelectedAddress}
            />
          )}

          {currentView === "hex" && (
            <HexView
              baseAddress={analysis.info.base_address}
              onJumpToAddress={handleJumpToAddress}
            />
          )}

          {currentView === "xrefs" && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="bg-[#10121d] rounded-xl border border-[#232637] p-5 shadow-lg">
                <h3 className="font-bold text-gray-200 text-sm mb-4">
                  Full Project Cross References (XREFs)
                </h3>
                <div className="divide-y divide-[#181a28]">
                  {xrefs.map((xref, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleJumpToAddress(xref.from_address)}
                      className="py-3 px-3 hover:bg-[#161828] rounded cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300">
                          {xref.type}
                        </span>
                        <div>
                          <div className="text-gray-200 font-bold">
                            {xref.from_function} → 0x{xref.to_address.toString(16).toUpperCase()}
                          </div>
                          <div className="text-gray-500 text-[11px]">
                            {xref.context_instruction}
                          </div>
                        </div>
                      </div>
                      <span className="text-cyan-400 font-bold">
                        0x{xref.from_address.toString(16).toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === "callgraph" && (
            <CallGraphView
              currentFunction={currentFunction}
              callGraphNodes={callGraphNodes}
              onSelectFunctionByName={handleSelectFunctionByName}
              onJumpToAddress={handleJumpToAddress}
            />
          )}

          {currentView === "structs" && (
            <StructsManager
              structs={structs}
              onAddStruct={handleAddStruct}
            />
          )}

          {currentView === "patcher" && (
            <PatchStudio
              patches={patches}
              onAddPatch={handleAddPatch}
              onTogglePatch={handleTogglePatch}
              onRemovePatch={handleRemovePatch}
              onDownloadPatchedBinary={handleDownloadPatchedBinary}
              selectedAddress={selectedAddress}
            />
          )}

          {currentView === "search" && (
            <PatternScanner
              instructions={analysis.instructions}
              onJumpToAddress={handleJumpToAddress}
            />
          )}

          {currentView === "bookmarks" && (
            <BookmarksManager
              bookmarks={bookmarks}
              onAddBookmark={handleAddBookmark}
              onRemoveBookmark={handleRemoveBookmark}
              onJumpToAddress={handleJumpToAddress}
              currentAddress={selectedAddress}
            />
          )}

          {currentView === "headers" && (
            <HeaderInspector
              info={analysis.info}
              headers={analysis.header_summary}
            />
          )}
        </main>
      </div>

      {/* 4. Global Status Bar */}
      <StatusBar
        info={analysis.info}
        selectedAddress={selectedAddress}
        currentSection={activeSection}
        functionsCount={analysis.functions.length}
        instructionsCount={analysis.instructions.length}
        stringsCount={analysis.strings.length}
      />

      {/* 5. Modals (XREFs & Command Palette) */}
      <XrefsModal
        isOpen={isXrefsModalOpen}
        onClose={() => setIsXrefsModalOpen(false)}
        targetAddress={xrefsTargetAddress}
        xrefs={xrefs}
        onJumpToAddress={handleJumpToAddress}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        functions={analysis.functions}
        onSelectView={setCurrentView}
        onJumpToAddress={handleJumpToAddress}
        onSelectFunction={handleSelectFunction}
      />
    </div>
  );
}

export default App;
