import { useState, useRef } from "react";
import { ZoomIn, ZoomOut, Maximize2, Split } from "lucide-react";
import type { BasicBlockInfo, FunctionInfo, DisasmInstruction } from "../types/binary";

interface GraphViewProps {
  currentFunction: FunctionInfo | null;
  blocks: BasicBlockInfo[];
  selectedAddress: number | null;
  onSelectAddress: (address: number) => void;
  onJumpToAddress: (address: number) => void;
}

export const GraphView = ({
  currentFunction,
  blocks,
  selectedAddress,
  onSelectAddress,
  onJumpToAddress,
}: GraphViewProps) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter blocks for the current function
  const funcBlocks = currentFunction
    ? blocks.filter(
        (b) =>
          b.function_id === currentFunction.id ||
          (b.start_address >= currentFunction.start_address &&
            b.start_address < currentFunction.end_address)
      )
    : blocks;

  // Simple clean automatic layout calculation
  // Root block at top, children staggered downwards
  const blockPositions = new Map<string, { x: number; y: number; width: number; height: number }>();
  let currentY = 20;

  funcBlocks.forEach((block, idx) => {
    const width = 360;
    const height = 40 + block.instructions.length * 20 + 20;

    let x = 200;
    if (idx > 0) {
      // Alternate left / right branching for conditional blocks
      if (idx % 2 === 1) {
        x = 60;
      } else {
        x = 440;
      }
    }

    blockPositions.set(block.id, { x, y: currentY, width, height });
    if (idx % 2 === 0 || idx === 0) {
      currentY += height + 60;
    }
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === "svg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.4), 2.2));
  };

  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 60, y: 40 });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="flex-1 bg-[#07080d] overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
    >
      {/* Top Floating Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-[#12131e]/90 p-1.5 rounded-lg border border-[#272b3d] shadow-xl backdrop-blur-sm">
        <button
          onClick={() => handleZoom(0.15)}
          className="p-1.5 rounded hover:bg-[#1f2233] text-gray-300 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 rounded hover:bg-[#1f2233] text-gray-300 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded hover:bg-[#1f2233] text-gray-300 hover:text-white"
          title="Reset View"
        >
          <Maximize2 size={14} />
        </button>
        <span className="text-[10px] font-mono text-gray-400 px-1.5">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Function Title Floating Badge */}
      {currentFunction && (
        <div className="absolute top-3 left-3 z-10 bg-[#12131e]/90 px-3 py-1.5 rounded-lg border border-[#272b3d] shadow-xl backdrop-blur-sm flex items-center space-x-2">
          <Split size={14} className="text-cyan-400" />
          <span className="font-mono text-xs font-bold text-white">
            {currentFunction.name}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            ({funcBlocks.length} Basic Blocks)
          </span>
        </div>
      )}

      {/* Interactive Canvas Canvas Layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          transition: isDragging ? "none" : "transform 0.05s ease-out",
        }}
        className="w-[3000px] h-[3000px] relative pointer-events-none"
      >
        {/* SVG Arrow Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#00d4ff" />
            </marker>
          </defs>

          {funcBlocks.flatMap((fromBlock) =>
            fromBlock.successors.map((edge, eIdx) => {
              const fromPos = blockPositions.get(edge.from_block);
              const toPos = blockPositions.get(edge.to_block);
              if (!fromPos || !toPos) return null;

              const startX = fromPos.x + fromPos.width / 2;
              const startY = fromPos.y + fromPos.height;
              const endX = toPos.x + toPos.width / 2;
              const endY = toPos.y;

              const isTrue = edge.branch_type === "ConditionalTrue";
              const isFalse = edge.branch_type === "ConditionalFalse";
              const strokeColor = isTrue ? "#10b981" : isFalse ? "#ef4444" : "#00d4ff";
              const marker = isTrue
                ? "url(#arrow-green)"
                : isFalse
                ? "url(#arrow-red)"
                : "url(#arrow-cyan)";

              const midY = (startY + endY) / 2;
              const pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

              return (
                <path
                  key={`${edge.from_block}-${edge.to_block}-${eIdx}`}
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  markerEnd={marker}
                  className="opacity-80"
                />
              );
            })
          )}
        </svg>

        {/* Basic Block Cards */}
        {funcBlocks.map((block) => {
          const pos = blockPositions.get(block.id);
          if (!pos) return null;

          return (
            <div
              key={block.id}
              style={{
                position: "absolute",
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${pos.width}px`,
              }}
              className="bg-[#10121d] rounded-lg border border-[#262a3e] shadow-2xl overflow-hidden pointer-events-auto font-mono text-xs select-text hover:border-cyan-500/80 transition-colors"
            >
              {/* Block Header */}
              <div className="bg-[#171a28] px-3 py-1.5 border-b border-[#262a3e] flex items-center justify-between">
                <span className="font-bold text-cyan-400 text-[11px]">
                  {block.id}
                </span>
                <span className="text-[10px] text-gray-500">
                  0x{block.start_address.toString(16).toUpperCase()}
                </span>
              </div>

              {/* Instructions List */}
              <div className="p-2 space-y-1">
                {block.instructions.map((ins: DisasmInstruction) => {
                  const isSelected = selectedAddress === ins.address;
                  return (
                    <div
                      key={ins.address}
                      onClick={() => onSelectAddress(ins.address)}
                      onDoubleClick={() => {
                        if (ins.target_address) onJumpToAddress(ins.target_address);
                      }}
                      className={`flex items-center px-1.5 py-0.5 rounded cursor-pointer ${
                        isSelected
                          ? "bg-cyan-950/80 text-white font-semibold"
                          : "hover:bg-[#1a1d2e] text-gray-300"
                      }`}
                    >
                      <span className="w-20 text-[10px] text-gray-500 shrink-0 select-none">
                        0x{ins.address.toString(16).toUpperCase()}
                      </span>
                      <span
                        className={`w-14 font-semibold shrink-0 ${
                          ins.is_ret
                            ? "text-rose-400"
                            : ins.is_call
                            ? "text-purple-400"
                            : ins.is_jump
                            ? "text-amber-400"
                            : "text-cyan-300"
                        }`}
                      >
                        {ins.mnemonic}
                      </span>
                      <span className="truncate text-gray-200">
                        {ins.operands}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
