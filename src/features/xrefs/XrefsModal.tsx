import React from "react";
import { Link2, ArrowRight, X } from "lucide-react";
import type { XrefItem } from "../../core/types/binary";

interface XrefsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAddress: number;
  xrefs: XrefItem[];
  onJumpToAddress: (address: number) => void;
}

export const XrefsModal: React.FC<XrefsModalProps> = ({
  isOpen,
  onClose,
  targetAddress,
  xrefs,
  onJumpToAddress,
}) => {
  if (!isOpen) return null;

  // Filter XREFs for target address
  const relevantXrefs = xrefs.filter(
    (x) => x.to_address === targetAddress || x.from_address === targetAddress
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0f111a] rounded-xl border border-[#272b3d] shadow-2xl overflow-hidden flex flex-col font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#151825] px-4 py-3 border-b border-[#24283b] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link2 size={16} className="text-cyan-400" />
            <span className="font-bold text-white text-sm">
              Cross References (XREFs) to 0x{targetAddress.toString(16).toUpperCase()}
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-500/30">
              {relevantXrefs.length} references
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Table */}
        <div className="max-h-96 overflow-y-auto divide-y divide-[#181a28]">
          {relevantXrefs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 italic">
              No cross-references detected for this address.
            </div>
          ) : (
            relevantXrefs.map((xref, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onJumpToAddress(xref.from_address);
                  onClose();
                }}
                className="px-4 py-2.5 hover:bg-[#181b2b] cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      xref.type === "Call"
                        ? "bg-purple-950 text-purple-300 border border-purple-500/30"
                        : xref.type === "Jump"
                        ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                        : "bg-blue-950 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {xref.type}
                  </span>
                  <div>
                    <div className="text-gray-200 font-semibold group-hover:text-cyan-300">
                      {xref.from_function} + 0x
                      {(xref.from_address - targetAddress).toString(16).toUpperCase()}
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      {xref.context_instruction}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-cyan-400">
                  <span className="text-[11px] font-bold">
                    0x{xref.from_address.toString(16).toUpperCase()}
                  </span>
                  <ArrowRight size={13} className="text-gray-500 group-hover:text-cyan-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
