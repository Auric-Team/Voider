import { Layers, ShieldCheck, Cpu, HardDrive } from "lucide-react";
import type { BinaryInfo, HeaderField } from "../../core/types/binary";

interface HeaderInspectorProps {
  info: BinaryInfo;
  headers: HeaderField[];
}

export const HeaderInspector = ({
  info,
  headers,
}: HeaderInspectorProps) => {
  // Group headers by category
  const categories = Array.from(new Set(headers.map((h) => h.category)));

  return (
    <div className="flex-1 bg-[#090a10] overflow-y-auto font-mono text-xs flex flex-col select-text p-6">
      {/* File Overview Card */}
      <div className="bg-[#11131e] rounded-xl border border-[#23273a] p-4 mb-6 shadow-xl">
        <h2 className="text-sm font-bold text-white flex items-center space-x-2 mb-3">
          <ShieldCheck size={16} className="text-cyan-400" />
          <span>Binary Identity & Security Hashes</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#171a29] p-3 rounded-lg border border-[#282c42]">
            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              File Format
            </div>
            <div className="text-cyan-300 font-bold text-sm mt-1">
              {info.format} ({info.is_64bit ? "64-bit" : "32-bit"})
            </div>
            <div className="text-gray-400 text-[11px] mt-0.5">{info.endianness}</div>
          </div>

          <div className="bg-[#171a29] p-3 rounded-lg border border-[#282c42]">
            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              Architecture
            </div>
            <div className="text-emerald-400 font-bold text-sm mt-1 flex items-center space-x-1">
              <Cpu size={14} />
              <span>{info.arch}</span>
            </div>
            <div className="text-gray-400 text-[11px] mt-0.5">
              Base: 0x{info.base_address.toString(16).toUpperCase()}
            </div>
          </div>

          <div className="bg-[#171a29] p-3 rounded-lg border border-[#282c42]">
            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              Entry Point
            </div>
            <div className="text-purple-400 font-bold text-sm mt-1">
              0x{info.entry_point.toString(16).toUpperCase()}
            </div>
            <div className="text-gray-400 text-[11px] mt-0.5">
              Entropy: {info.overall_entropy.toFixed(2)} / 8.0
            </div>
          </div>

          <div className="bg-[#171a29] p-3 rounded-lg border border-[#282c42]">
            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              File Size
            </div>
            <div className="text-amber-400 font-bold text-sm mt-1 flex items-center space-x-1">
              <HardDrive size={14} />
              <span>{(info.size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="text-gray-400 text-[11px] mt-0.5">{info.size} bytes</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#23273a] flex items-center space-x-3 text-[11px]">
          <span className="text-gray-500 font-bold">SHA-256:</span>
          <span className="text-gray-300 select-all font-mono bg-[#171a28] px-2 py-0.5 rounded border border-[#282c42]">
            {info.sha256}
          </span>
        </div>
      </div>

      {/* Header Breakdown Sections */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const fields = headers.filter((h) => h.category === cat);
          return (
            <div
              key={cat}
              className="bg-[#10121d] rounded-xl border border-[#202435] overflow-hidden shadow-lg"
            >
              <div className="bg-[#151826] px-4 py-2.5 border-b border-[#202435] flex items-center space-x-2">
                <Layers size={14} className="text-cyan-400" />
                <h3 className="font-bold text-gray-200 text-xs">{cat}</h3>
              </div>
              <div className="divide-y divide-[#171926]">
                {fields.map((field, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-2 hover:bg-[#131522] transition-colors"
                  >
                    <span className="text-gray-400 font-medium w-48">
                      {field.name}
                    </span>
                    <span className="text-cyan-300 font-bold font-mono flex-1 truncate">
                      {field.value}
                    </span>
                    <span className="text-[10px] text-gray-600 font-mono">
                      +0x{field.offset.toString(16).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
