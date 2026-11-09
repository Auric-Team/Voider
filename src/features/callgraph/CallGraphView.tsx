import { useState } from "react";
import { GitFork, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { CallGraphNode, FunctionInfo } from "../../core/types/binary";

interface CallGraphViewProps {
  currentFunction: FunctionInfo | null;
  callGraphNodes: CallGraphNode[];
  onSelectFunctionByName: (name: string) => void;
  onJumpToAddress: (address: number) => void;
}

export const CallGraphView: React.FC<CallGraphViewProps> = ({
  currentFunction,
  callGraphNodes,
  onSelectFunctionByName,
  onJumpToAddress,
}) => {
  const [selectedFunc, setSelectedFunc] = useState(
    currentFunction?.name || "main"
  );

  const activeNode =
    callGraphNodes.find((n) => n.name === selectedFunc) ||
    callGraphNodes[0] ||
    null;

  return (
    <div className="flex-1 bg-[#090a10] overflow-y-auto font-mono text-xs flex flex-col p-6 select-text">
      {/* Banner */}
      <div className="bg-[#11131e] rounded-xl border border-[#23273a] p-5 mb-6 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <GitFork size={16} className="text-purple-400" />
            <span>Function Call Graph & Hierarchy (Caller/Callee)</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Analyze call paths, upstream callers, and downstream execution dependencies.
          </p>
        </div>

        {activeNode && (
          <div className="text-right">
            <div className="text-cyan-400 font-bold text-sm">
              0x{activeNode.address.toString(16).toUpperCase()}
            </div>
            <div className="text-gray-500 text-[11px]">Selected Root</div>
          </div>
        )}
      </div>

      {activeNode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Callers (Functions calling this function) */}
          <div className="bg-[#10121d] rounded-xl border border-[#24283b] p-5 shadow-lg flex flex-col">
            <h3 className="font-bold text-purple-400 text-xs flex items-center space-x-2 mb-3">
              <ArrowDownRight size={14} />
              <span>Callers (Upstream Invocations)</span>
            </h3>
            <div className="space-y-2 flex-1">
              {activeNode.callers.length === 0 ? (
                <div className="text-gray-500 italic p-4 text-center">
                  No direct callers detected (or root entry).
                </div>
              ) : (
                activeNode.callers.map((caller, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedFunc(caller);
                      onSelectFunctionByName(caller);
                    }}
                    className="p-3 rounded-lg bg-[#161826] hover:bg-[#1e2236] border border-[#262a3f] cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <span className="font-bold text-gray-200 group-hover:text-purple-300">
                      {caller}()
                    </span>
                    <span className="text-[10px] text-gray-500">Jump</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. Current Function Node */}
          <div className="bg-gradient-to-b from-[#181c2f] to-[#121422] rounded-xl border-2 border-cyan-500/60 p-6 shadow-2xl flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xl mb-3 shadow-lg shadow-cyan-500/10">
              ƒ
            </div>
            <h2 className="text-base font-extrabold text-white">
              {activeNode.name}()
            </h2>
            <div className="text-cyan-400 font-mono text-xs mt-1">
              0x{activeNode.address.toString(16).toUpperCase()}
            </div>
            <button
              onClick={() => onJumpToAddress(activeNode.address)}
              className="mt-4 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
            >
              Open in Disassembly
            </button>
          </div>

          {/* 3. Callees (Functions called by this function) */}
          <div className="bg-[#10121d] rounded-xl border border-[#24283b] p-5 shadow-lg flex flex-col">
            <h3 className="font-bold text-emerald-400 text-xs flex items-center space-x-2 mb-3">
              <ArrowUpRight size={14} />
              <span>Callees (Downstream Functions)</span>
            </h3>
            <div className="space-y-2 flex-1">
              {activeNode.callees.length === 0 ? (
                <div className="text-gray-500 italic p-4 text-center">
                  Leaf function (makes no calls).
                </div>
              ) : (
                activeNode.callees.map((callee, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedFunc(callee);
                      onSelectFunctionByName(callee);
                    }}
                    className="p-3 rounded-lg bg-[#161826] hover:bg-[#1e2236] border border-[#262a3f] cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <span className="font-bold text-gray-200 group-hover:text-emerald-300">
                      {callee}()
                    </span>
                    <span className="text-[10px] text-gray-500">Jump</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-center p-12">
          Select a function to inspect its call hierarchy.
        </div>
      )}
    </div>
  );
};
