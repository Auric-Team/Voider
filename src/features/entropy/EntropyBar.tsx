interface EntropyBarProps {
  blocks: number[];
  overallEntropy: number;
}

export const EntropyBar = ({
  blocks,
  overallEntropy,
}: EntropyBarProps) => {
  const getEntropyColor = (entropy: number): string => {
    // 0.0 (blue/zeroes) -> 4.0 (cyan/data) -> 6.0 (green/code) -> 7.5+ (orange/red packed)
    if (entropy < 1.0) return "#3b82f6"; // blue
    if (entropy < 4.0) return "#06b6d4"; // cyan
    if (entropy < 6.5) return "#10b981"; // emerald green (normal executable code)
    if (entropy < 7.3) return "#f59e0b"; // amber
    return "#ef4444"; // red (encrypted / packed / compressed)
  };

  return (
    <div className="bg-[#12131a] border-b border-[#232635] px-4 py-2 flex items-center justify-between text-xs select-none">
      <div className="flex items-center space-x-3">
        <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">
          Entropy Map
        </span>
        <div className="flex h-3 w-72 rounded overflow-hidden bg-[#1a1c26] border border-[#2e3247]">
          {blocks.map((val, idx) => (
            <div
              key={idx}
              className="flex-1 transition-all hover:opacity-80 relative group"
              style={{ backgroundColor: getEntropyColor(val) }}
              title={`Block ${idx + 1}/${blocks.length}: Entropy ${val.toFixed(2)}`}
            />
          ))}
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-gray-400">
          <span>Overall:</span>
          <span
            className="font-mono px-1.5 py-0.5 rounded font-bold"
            style={{
              color: getEntropyColor(overallEntropy),
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          >
            {overallEntropy.toFixed(2)} / 8.0
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-[10px] text-gray-500">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          <span>Zeroes/Padding</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Code (.text)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          <span>Data (.rdata)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span>High Entropy/Packed</span>
        </div>
      </div>
    </div>
  );
};
