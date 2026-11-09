import { useState } from "react";
import { Boxes, Plus, ChevronRight } from "lucide-react";
import type { StructDefinition } from "../../core/types/binary";

interface StructsManagerProps {
  structs: StructDefinition[];
  onAddStruct: (def: StructDefinition) => void;
}

export const StructsManager: React.FC<StructsManagerProps> = ({
  structs,
  onAddStruct,
}) => {
  const [selectedStructId, setSelectedStructId] = useState(
    structs[0]?.id || ""
  );
  const [isAdding, setIsAdding] = useState(false);
  const [newStructName, setNewStructName] = useState("");

  const activeStruct =
    structs.find((s) => s.id === selectedStructId) || structs[0] || null;

  const handleCreateStruct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStructName.trim()) return;

    const newStruct: StructDefinition = {
      id: `struct_${Date.now()}`,
      name: newStructName.trim().toUpperCase(),
      total_size: 16,
      alignment: 8,
      members: [
        { name: "field_0", type_name: "uint64_t", offset: 0, size: 8 },
        { name: "field_8", type_name: "uint64_t", offset: 8, size: 8 },
      ],
    };

    onAddStruct(newStruct);
    setSelectedStructId(newStruct.id);
    setNewStructName("");
    setIsAdding(false);
  };

  return (
    <div className="flex-1 bg-[#090a10] overflow-hidden flex flex-col font-mono text-xs select-text">
      {/* Top Banner */}
      <div className="bg-[#11131c] border-b border-[#212435] px-6 py-3 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2">
          <Boxes size={16} className="text-cyan-400" />
          <span className="font-bold text-gray-200 text-sm">
            Data Types & Structs Manager (C Type System)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
            {structs.length} structures
          </span>
        </div>

        <button
          onClick={() => setIsAdding((prev: boolean) => !prev)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
        >
          <Plus size={13} />
          <span>New Struct</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Struct List */}
        <aside className="w-72 bg-[#0d0e17] border-r border-[#1f2233] flex flex-col overflow-y-auto">
          {isAdding && (
            <form onSubmit={handleCreateStruct} className="p-3 border-b border-[#212538]">
              <input
                type="text"
                value={newStructName}
                onChange={(e) => setNewStructName(e.target.value)}
                placeholder="STRUCT_NAME..."
                autoFocus
                className="w-full bg-[#171a28] text-gray-200 px-3 py-1.5 rounded border border-cyan-500 focus:outline-none text-xs"
              />
              <button
                type="submit"
                className="mt-2 w-full py-1 rounded bg-cyan-600 text-white text-[11px] font-bold"
              >
                Create Structure
              </button>
            </form>
          )}

          <div className="divide-y divide-[#171926]">
            {structs.map((s) => {
              const isSelected = selectedStructId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStructId(s.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-cyan-950/40 border-l-2 border-cyan-400 text-white font-bold"
                      : "hover:bg-[#131522] text-gray-300"
                  }`}
                >
                  <div>
                    <div className="text-gray-100">{s.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Size: {s.total_size} B • {s.members.length} members
                    </div>
                  </div>
                  <ChevronRight
                    size={13}
                    className={isSelected ? "text-cyan-400" : "text-gray-600"}
                  />
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Struct Layout Table */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeStruct ? (
            <div className="bg-[#11131e] rounded-xl border border-[#23273a] shadow-xl overflow-hidden">
              <div className="bg-[#151826] px-5 py-3 border-b border-[#23273a] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    struct {activeStruct.name}
                  </h3>
                  <div className="text-[11px] text-gray-400 mt-0.5 space-x-3">
                    <span>Total Size: {activeStruct.total_size} bytes</span>
                    <span>•</span>
                    <span>Alignment: {activeStruct.alignment} bytes</span>
                  </div>
                </div>
              </div>

              {/* Members Table */}
              <div className="divide-y divide-[#171926]">
                <div className="grid grid-cols-12 px-4 py-2 bg-[#131522] text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                  <span className="col-span-2">Offset</span>
                  <span className="col-span-3">Type</span>
                  <span className="col-span-4">Member Name</span>
                  <span className="col-span-3">Comment</span>
                </div>

                {activeStruct.members.map((m, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 px-4 py-2.5 hover:bg-[#161928] items-center transition-colors"
                  >
                    <span className="col-span-2 text-cyan-400 font-bold">
                      +0x{m.offset.toString(16).toUpperCase().padStart(2, "0")}
                    </span>
                    <span className="col-span-3 text-purple-400 font-semibold">
                      {m.type_name}
                    </span>
                    <span className="col-span-4 text-gray-200 font-bold">
                      {m.name}
                    </span>
                    <span className="col-span-3 text-gray-500 italic text-[11px]">
                      {m.comment || `/* ${m.size} B */`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              Select or create a struct to inspect its memory layout.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
