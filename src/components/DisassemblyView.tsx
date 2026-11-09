import { useState } from "react";
import { MessageSquare, ArrowRight } from "lucide-react";
import type { DisasmInstruction, FunctionInfo } from "../types/binary";

interface DisassemblyViewProps {
  instructions: DisasmInstruction[];
  functions: FunctionInfo[];
  selectedAddress: number | null;
  onSelectAddress: (address: number) => void;
  onJumpToAddress: (address: number) => void;
  comments: Record<number, string>;
  onSetComment: (address: number, comment: string) => void;
}

export const DisassemblyView: React.FC<DisassemblyViewProps> = ({
  instructions,
  functions,
  selectedAddress,
  onSelectAddress,
  onJumpToAddress,
  comments,
  onSetComment,
}) => {
  const [editingCommentAddress, setEditingCommentAddress] = useState<number | null>(null);
  const [tempCommentText, setTempCommentText] = useState("");

  const functionStarts = new Map<number, FunctionInfo>();
  for (const f of functions) {
    functionStarts.set(f.start_address, f);
  }

  const getMnemonicColor = (mnemonic: string, isCall: boolean, isJump: boolean, isRet: boolean) => {
    if (isRet) return "text-rose-400 font-bold";
    if (isCall) return "text-purple-400 font-bold";
    if (isJump) return "text-amber-400 font-bold";
    if (mnemonic === "mov" || mnemonic === "lea") return "text-cyan-400 font-semibold";
    if (mnemonic === "push" || mnemonic === "pop") return "text-blue-400 font-medium";
    if (mnemonic === "xor" || mnemonic === "sub" || mnemonic === "add") return "text-emerald-400 font-medium";
    if (mnemonic === "cmp" || mnemonic === "test") return "text-yellow-400 font-medium";
    return "text-gray-200";
  };

  const handleStartComment = (address: number, currentComment?: string | null) => {
    setEditingCommentAddress(address);
    setTempCommentText(currentComment || comments[address] || "");
  };

  const handleSaveComment = (address: number) => {
    onSetComment(address, tempCommentText);
    setEditingCommentAddress(null);
  };

  return (
    <div className="flex-1 bg-[#090a10] overflow-y-auto font-mono text-xs select-text focus:outline-none">
      <div className="p-3 divide-y divide-[#171926]">
        {instructions.map((ins) => {
          const isSelected = selectedAddress === ins.address;
          const funcHeader = functionStarts.get(ins.address);
          const activeComment = comments[ins.address] || ins.comment;

          return (
            <div key={ins.address} className="py-0.5">
              {/* Function Header Banner */}
              {funcHeader && (
                <div className="mt-4 mb-2 p-2 rounded bg-gradient-to-r from-cyan-950/40 via-transparent to-transparent border-l-2 border-cyan-400">
                  <div className="flex items-center space-x-2 text-cyan-300 font-bold text-sm">
                    <span>; ========== FUNCTION: {funcHeader.name} ==========</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 space-x-3">
                    <span>Address: 0x{funcHeader.start_address.toString(16).toUpperCase()}</span>
                    <span>•</span>
                    <span>Size: {funcHeader.size} bytes</span>
                    <span>•</span>
                    <span>Convention: {funcHeader.calling_convention}</span>
                  </div>
                  {funcHeader.comment && (
                    <div className="text-gray-400 text-[11px] mt-1 italic">
                      ; {funcHeader.comment}
                    </div>
                  )}
                </div>
              )}

              {/* Instruction Line */}
              <div
                onClick={() => onSelectAddress(ins.address)}
                className={`flex items-center px-2 py-1 rounded transition-colors group cursor-pointer ${
                  isSelected
                    ? "bg-[#182035] border-l-2 border-cyan-400 text-white shadow-inner"
                    : "hover:bg-[#12141f] text-gray-300"
                }`}
              >
                {/* Address Column */}
                <div className="w-32 text-cyan-500/80 group-hover:text-cyan-400 shrink-0 select-none">
                  0x{ins.address.toString(16).toUpperCase().padStart(8, "0")}
                </div>

                {/* Opcode Hex Bytes */}
                <div className="w-40 text-gray-500 font-mono text-[11px] shrink-0 truncate select-none">
                  {ins.bytes_hex}
                </div>

                {/* Mnemonic Column */}
                <div
                  className={`w-20 shrink-0 ${getMnemonicColor(
                    ins.mnemonic,
                    ins.is_call,
                    ins.is_jump,
                    ins.is_ret
                  )}`}
                >
                  {ins.mnemonic}
                </div>

                {/* Operands Column */}
                <div className="w-64 text-gray-200 shrink-0 flex items-center space-x-2">
                  <span>{ins.operands}</span>
                  {ins.target_address && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToAddress(ins.target_address!);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-cyan-950 text-cyan-400 transition-opacity"
                      title={`Jump to 0x${ins.target_address.toString(16).toUpperCase()}`}
                    >
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>

                {/* Inline Comment Column */}
                <div className="flex-1 flex items-center space-x-2 text-gray-400 text-[11px]">
                  {editingCommentAddress === ins.address ? (
                    <div
                      className="flex items-center space-x-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={tempCommentText}
                        onChange={(e) => setTempCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveComment(ins.address);
                          if (e.key === "Escape") setEditingCommentAddress(null);
                        }}
                        placeholder="Add comment (press Enter)..."
                        autoFocus
                        className="bg-[#1c2033] text-white px-2 py-0.5 rounded border border-cyan-500 focus:outline-none w-full text-xs"
                      />
                      <button
                        onClick={() => handleSaveComment(ins.address)}
                        className="px-2 py-0.5 rounded bg-cyan-600 text-white text-[10px]"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center space-x-1.5 w-full cursor-pointer group-hover:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartComment(ins.address, activeComment);
                      }}
                    >
                      {activeComment ? (
                        <span className="text-amber-300/90 italic flex items-center space-x-1">
                          <MessageSquare size={11} className="inline mr-1 text-amber-400" />
                          ; {activeComment}
                        </span>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-60 text-gray-600 text-[10px] flex items-center space-x-1">
                          <MessageSquare size={10} />
                          <span>; add comment</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
