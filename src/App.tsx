import { useState, useEffect, useCallback } from "react";
import { HeaderBar, type WorkbenchView } from "./components/HeaderBar";
import { EntropyBar } from "./components/EntropyBar";
import { Sidebar } from "./components/Sidebar";
import { DisassemblyView } from "./components/DisassemblyView";
import { GraphView } from "./components/GraphView";
import { DecompilerView } from "./components/DecompilerView";
import { HexView } from "./components/HexView";
import { HeaderInspector } from "./components/HeaderInspector";
import { StatusBar } from "./components/StatusBar";
import { CommandPalette } from "./components/CommandPalette";
import { SAMPLE_PE } from "./engine/demoSamples";
import { analyzeFileBuffer } from "./engine/clientAnalyzer";
import type { BinaryAnalysis, FunctionInfo } from "./types/binary";
import "./App.css";

export function App() {
  const [analysis, setAnalysis] = useState<BinaryAnalysis>(SAMPLE_PE);
  const [currentView, setCurrentView] = useState<WorkbenchView>("listing");
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>("func_entry");
  const [selectedAddress, setSelectedAddress] = useState<number | null>(SAMPLE_PE.info.entry_point);
  const [comments, setComments] = useState<Record<number, string>>({});
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const currentFunction =
    analysis.functions.find((f) => f.id === selectedFunctionId) ||
    analysis.functions[0] ||
    null;

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.code === "Space") {
        e.preventDefault();
        // Toggle between Listing and Graph view like IDA Pro
        setCurrentView((prev) => (prev === "listing" ? "graph" : "listing"));
      } else if (e.key === "F5") {
        e.preventDefault();
        setCurrentView("decompiler");
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
  }, []);

  const handleSelectFunction = useCallback((func: FunctionInfo) => {
    setSelectedFunctionId(func.id);
    setSelectedAddress(func.start_address);
  }, []);

  const handleJumpToAddress = useCallback(
    (address: number) => {
      setSelectedAddress(address);

      // Find if address is within any known function
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

  const handleExport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(analysis, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${analysis.info.filename}.voiderdb.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Find active section name based on selected address
  const activeSection =
    analysis.sections.find(
      (s) =>
        selectedAddress !== null &&
        selectedAddress >= s.virtual_address &&
        selectedAddress < s.virtual_address + s.virtual_size
    )?.name || ".text";

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#07080d] text-gray-200">
      {/* 1. Top Global Navigation Header */}
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

          {currentView === "headers" && (
            <HeaderInspector
              info={analysis.info}
              headers={analysis.header_summary}
            />
          )}
        </main>
      </div>

      {/* 4. Bottom Global Status Bar */}
      <StatusBar
        info={analysis.info}
        selectedAddress={selectedAddress}
        currentSection={activeSection}
        functionsCount={analysis.functions.length}
        instructionsCount={analysis.instructions.length}
        stringsCount={analysis.strings.length}
      />

      {/* 5. Command Palette Modal (Ctrl+K) */}
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
