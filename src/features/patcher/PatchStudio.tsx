import { useState } from "react";
import { Wrench, Plus, Trash2, Download } from "lucide-react";
import type { BinaryPatch } from "../../core/types/binary";

interface PatchStudioProps {
  patches: BinaryPatch[];
  onAddPatch: (patch: Omit<BinaryPatch, "id" | "timestamp">) => void;
  onTogglePatch: (id: string) => void;
  onRemovePatch: (id: string) => void;
  onDownloadPatchedBinary: () => void;
  selectedAddress: number | null;
}

export const PatchStudio: React.FC<PatchStudioProps> = ({
  patches,
  onAddPatch,
  onTogglePatch,
  onRemovePatch,
  onDownloadPatchedBinary,
  selectedAddress,
}) => {
  const [addrInput, setAddrInput] = useState(
    selectedAddress ? "0x" + selectedAddress.toString(16).toUpperCase() : "0x140001028"
  );
  const [originalBytes, setOriginalBytes] = useState("74 0D");
  const [patchedBytes, setPatchedBytes] = useState("90 90");
  const [mnemonic, setMnemonic] = useState("nop; nop (Bypass license check)");
  const [comment, setComment] = useState("Force successful verification branch");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = parseInt(addrInput.replace("0x", ""), 16);
    if (isNaN(addr)) {
      alert("Invalid address format");
      return;
    }

    onAddPatch({
      address: addr,
      original_bytes: originalBytes.trim().toUpperCase(),
      patched_bytes: patchedBytes.trim().toUpperCase(),
      mnemonic: mnemonic.trim(),
      comment: comment.trim(),
      is_active: true,
    });
  };

  return (
    <div className="flex-1 bg-[#090a10] overflow-y-auto font-mono text-xs flex flex-col p-6 select-text">
      {/* Header Banner */}
      <div className="bg-[#11131e] rounded-xl border border-[#23273a] p-5 mb-6 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Wrench size={16} className="text-amber-400" />
            <span>Binary Patch Studio (Live Byte Assembler)</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Modify instructions, NOP-out branches, or inject shellcode directly.
            Export the modified binary with verified checksums.
          </p>
        </div>

        <button
          onClick={onDownloadPatchedBinary}
          disabled={patches.length === 0}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            patches.length > 0
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:opacity-90 shadow-lg shadow-amber-500/20"
              : "bg-[#181a26] text-gray-500 border border-[#272b3d] cursor-not-allowed"
          }`}
        >
          <Download size={14} />
          <span>Export Patched Executable</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Patch Form */}
        <div className="bg-[#10121d] rounded-xl border border-[#232637] p-5 shadow-lg">
          <h3 className="font-bold text-gray-200 text-xs flex items-center space-x-2 mb-4">
            <Plus size={14} className="text-cyan-400" />
            <span>Assemble New Patch</span>
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                Virtual Address (VA)
              </label>
              <input
                type="text"
                value={addrInput}
                onChange={(e) => setAddrInput(e.target.value)}
                placeholder="0x140001028"
                className="w-full bg-[#171a28] text-gray-200 px-3 py-1.5 rounded border border-[#282c40] focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                  Original Bytes
                </label>
                <input
                  type="text"
                  value={originalBytes}
                  onChange={(e) => setOriginalBytes(e.target.value)}
                  placeholder="74 0D"
                  className="w-full bg-[#171a28] text-rose-300 px-3 py-1.5 rounded border border-[#282c40] focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                  Patched Bytes
                </label>
                <input
                  type="text"
                  value={patchedBytes}
                  onChange={(e) => setPatchedBytes(e.target.value)}
                  placeholder="90 90"
                  className="w-full bg-[#171a28] text-emerald-300 font-bold px-3 py-1.5 rounded border border-[#282c40] focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                Instruction Mnemonic
              </label>
              <input
                type="text"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="nop; nop"
                className="w-full bg-[#171a28] text-gray-200 px-3 py-1.5 rounded border border-[#282c40] focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                Patch Note / Description
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Bypass check"
                className="w-full bg-[#171a28] text-gray-200 px-3 py-1.5 rounded border border-[#282c40] focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2"
            >
              <Plus size={14} />
              <span>Apply Patch to Workspace</span>
            </button>
          </form>
        </div>

        {/* Right: Active Patches List */}
        <div className="lg:col-span-2 bg-[#10121d] rounded-xl border border-[#232637] p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-200 text-xs">
              Active Patches ({patches.length})
            </h3>
            <span className="text-gray-500 text-[10px]">
              Toggle checkbox to activate/deactivate
            </span>
          </div>

          <div className="flex-1 divide-y divide-[#181a28] overflow-y-auto">
            {patches.length === 0 ? (
              <div className="p-8 text-center text-gray-500 italic">
                No active patches yet. Use the form on the left or select an instruction in Disassembly to patch opcodes.
              </div>
            ) : (
              patches.map((p) => (
                <div
                  key={p.id}
                  className="py-3 px-3 hover:bg-[#151726] rounded flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={p.is_active}
                      onChange={() => onTogglePatch(p.id)}
                      className="rounded border-[#2a2e44] bg-[#1a1d2e] text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-cyan-400 font-bold">
                          0x{p.address.toString(16).toUpperCase()}
                        </span>
                        <span className="text-gray-400 font-semibold">
                          {p.mnemonic}
                        </span>
                      </div>
                      <div className="text-[11px] mt-0.5 space-x-2 flex items-center">
                        <span className="line-through text-rose-400">
                          {p.original_bytes}
                        </span>
                        <span className="text-gray-600">→</span>
                        <span className="text-emerald-400 font-bold">
                          {p.patched_bytes}
                        </span>
                        {p.comment && (
                          <span className="text-gray-500 italic pl-2">
                            ({p.comment})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemovePatch(p.id)}
                    className="p-1.5 rounded hover:bg-rose-950 text-gray-500 hover:text-rose-400 transition-colors"
                    title="Delete patch"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
