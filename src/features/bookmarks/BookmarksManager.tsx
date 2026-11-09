import { useState } from "react";
import { Bookmark, Plus, Trash2, ArrowRight } from "lucide-react";
import type { BookmarkItem } from "../../core/types/binary";

interface BookmarksManagerProps {
  bookmarks: BookmarkItem[];
  onAddBookmark: (bm: BookmarkItem) => void;
  onRemoveBookmark: (id: string) => void;
  onJumpToAddress: (address: number) => void;
  currentAddress: number | null;
}

export const BookmarksManager: React.FC<BookmarksManagerProps> = ({
  bookmarks,
  onAddBookmark,
  onRemoveBookmark,
  onJumpToAddress,
  currentAddress,
}) => {
  const [addrInput, setAddrInput] = useState(
    currentAddress ? "0x" + currentAddress.toString(16).toUpperCase() : "0x140001000"
  );
  const [labelInput, setLabelInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Important");
  const [colorInput, setColorInput] = useState("#00d4ff");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = parseInt(addrInput.replace("0x", ""), 16);
    if (isNaN(addr) || !labelInput.trim()) return;

    onAddBookmark({
      id: `bm_${Date.now()}`,
      address: addr,
      label: labelInput.trim(),
      category: categoryInput,
      color: colorInput,
      created_at: new Date().toISOString().substring(0, 16).replace("T", " "),
    });

    setLabelInput("");
  };

  return (
    <div className="flex-1 bg-[#090a10] overflow-y-auto font-mono text-xs flex flex-col p-6 select-text">
      {/* Banner */}
      <div className="bg-[#11131e] rounded-xl border border-[#23273a] p-5 mb-6 shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Bookmark size={16} className="text-cyan-400" />
            <span>Bookmarks & Address Annotations</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Pin critical functions, cryptographic routines, or patch locations for rapid navigation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="bg-[#10121d] rounded-xl border border-[#232637] p-5 shadow-lg">
          <h3 className="font-bold text-gray-200 text-xs flex items-center space-x-2 mb-4">
            <Plus size={14} className="text-cyan-400" />
            <span>Create New Bookmark</span>
          </h3>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                Virtual Address (VA)
              </label>
              <input
                type="text"
                value={addrInput}
                onChange={(e) => setAddrInput(e.target.value)}
                placeholder="0x140001000"
                className="w-full bg-[#171a28] text-cyan-300 font-bold px-3 py-1.5 rounded border border-[#282c40] focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                Label / Annotation
              </label>
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="e.g. Decryption Loop"
                className="w-full bg-[#171a28] text-white px-3 py-1.5 rounded border border-[#282c40] focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                  Category
                </label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full bg-[#171a28] text-gray-300 px-2 py-1.5 rounded border border-[#282c40] focus:outline-none"
                >
                  <option value="Important">Important</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Branch">Branch</option>
                  <option value="Vulnerability">Vulnerability</option>
                  <option value="Keygen">Keygen</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                  Color Tag
                </label>
                <div className="flex items-center space-x-2 pt-1">
                  {["#00d4ff", "#10b981", "#a855f7", "#ef4444", "#f59e0b"].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColorInput(col)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        colorInput === col ? "ring-2 ring-white scale-110" : ""
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2"
            >
              <Plus size={14} />
              <span>Save Bookmark</span>
            </button>
          </form>
        </div>

        {/* Right List */}
        <div className="lg:col-span-2 bg-[#10121d] rounded-xl border border-[#232637] p-5 shadow-lg flex flex-col">
          <h3 className="font-bold text-gray-200 text-xs mb-4">
            Saved Bookmarks ({bookmarks.length})
          </h3>

          <div className="flex-1 divide-y divide-[#181a28] overflow-y-auto">
            {bookmarks.length === 0 ? (
              <div className="p-8 text-center text-gray-500 italic">
                No bookmarks created yet. Pin key addresses to navigate quickly.
              </div>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => onJumpToAddress(bm.address)}
                  className="py-3 px-3 hover:bg-[#161828] rounded cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: bm.color }}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-cyan-400 font-bold">
                          0x{bm.address.toString(16).toUpperCase()}
                        </span>
                        <span className="text-white font-semibold">
                          {bm.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 space-x-2">
                        <span className="px-1.5 py-0.2 rounded bg-[#181a26] text-gray-400">
                          {bm.category}
                        </span>
                        <span>{bm.created_at}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBookmark(bm.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950 text-gray-500 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 size={13} />
                    </button>
                    <ArrowRight size={13} className="text-gray-600 group-hover:text-cyan-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
