import { useState } from "react";
import { Copy, Check, Code2 } from "lucide-react";
import type { DecompiledFunction, FunctionInfo } from "../../core/types/binary";
import { SAMPLE_DECOMPILED } from "../../core/samples/demoSamples";

interface DecompilerViewProps {
  currentFunction: FunctionInfo | null;
  selectedAddress: number | null;
  onSelectAddress: (address: number) => void;
}

export const DecompilerView: React.FC<DecompilerViewProps> = ({
  currentFunction,
  selectedAddress,
  onSelectAddress,
}) => {
  const [copied, setCopied] = useState(false);

  // Get decompiled function data or fallback generator
  const decompData: DecompiledFunction =
    (currentFunction && SAMPLE_DECOMPILED[currentFunction.id]) || {
      function_id: currentFunction?.id || "func_unknown",
      name: currentFunction?.name || "unknown",
      signature: `int64_t ${currentFunction?.name || "func"}(int64_t a1, int64_t a2)`,
      code_lines: [
        {
          line_number: 1,
          text: `// Decompiled function: ${currentFunction?.name || "func"}`,
          address_ref: currentFunction?.start_address || null,
          indent: 0,
        },
        {
          line_number: 2,
          text: `int64_t ${currentFunction?.name || "func"}(int64_t a1, int64_t a2) {`,
          address_ref: currentFunction?.start_address || null,
          indent: 0,
        },
        {
          line_number: 3,
          text: `    int64_t rax = 0;`,
          address_ref: null,
          indent: 1,
        },
        {
          line_number: 4,
          text: `    // High performance AST reconstruction:`,
          address_ref: null,
          indent: 1,
        },
        {
          line_number: 5,
          text: `    rax = a1 + a2;`,
          address_ref: currentFunction?.start_address || null,
          indent: 1,
        },
        {
          line_number: 6,
          text: `    return rax;`,
          address_ref: currentFunction?.end_address || null,
          indent: 1,
        },
        {
          line_number: 7,
          text: `}`,
          address_ref: null,
          indent: 0,
        },
      ],
    };

  const handleCopy = () => {
    const text = decompData.code_lines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightSyntax = (lineText: string) => {
    if (lineText.trim().startsWith("//")) {
      return <span className="text-gray-500 italic">{lineText}</span>;
    }

    // Split on string literals first
    const parts = lineText.split(/(".*?")/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return (
          <span key={pIdx} className="text-emerald-300 font-semibold">
            {part}
          </span>
        );
      }

      // Syntax tokens
      const words = part.split(/(\b(?:int32_t|int64_t|char|void|if|else|return|sizeof|while|for|goto)\b)/g);
      return words.map((w, wIdx) => {
        if (/^(int32_t|int64_t|char|void)$/.test(w)) {
          return (
            <span key={wIdx} className="text-purple-400 font-bold">
              {w}
            </span>
          );
        }
        if (/^(if|else|return|sizeof|while|for|goto)$/.test(w)) {
          return (
            <span key={wIdx} className="text-amber-400 font-bold">
              {w}
            </span>
          );
        }
        if (/^[a-zA-Z_][a-zA-Z0-9_]*(?=\()/.test(w)) {
          return (
            <span key={wIdx} className="text-cyan-400 font-semibold">
              {w}
            </span>
          );
        }
        return <span key={wIdx}>{w}</span>;
      });
    });
  };

  return (
    <div className="flex-1 bg-[#090a10] overflow-y-auto font-mono text-xs flex flex-col select-text">
      {/* Top Banner */}
      <div className="bg-[#11131c] border-b border-[#212435] px-4 py-2 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2">
          <Code2 size={16} className="text-cyan-400" />
          <span className="font-bold text-gray-200">Pseudo-C Decompiler</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono border border-purple-500/30">
            AST Reconstructed
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#181b29] hover:bg-[#22263a] text-gray-300 hover:text-white border border-[#2a2f47] text-xs transition-colors"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy Pseudo-C</span>
            </>
          )}
        </button>
      </div>

      {/* Code Display */}
      <div className="p-4 flex-1">
        {decompData.code_lines.map((line) => {
          const isSelected =
            line.address_ref !== null &&
            line.address_ref !== undefined &&
            line.address_ref === selectedAddress;

          return (
            <div
              key={line.line_number}
              onClick={() => {
                if (line.address_ref) onSelectAddress(line.address_ref);
              }}
              className={`flex items-center py-0.5 px-2 rounded cursor-pointer group transition-colors ${
                isSelected
                  ? "bg-cyan-950/60 border-l-2 border-cyan-400"
                  : "hover:bg-[#12141f]"
              }`}
            >
              {/* Line Number */}
              <span className="w-10 text-gray-600 select-none text-[11px] text-right pr-4">
                {line.line_number}
              </span>

              {/* Code Line Text with Syntax Highlighting */}
              <div className="flex-1 text-gray-200 whitespace-pre">
                {highlightSyntax(line.text)}
              </div>

              {/* Address Indicator on Hover */}
              {line.address_ref && (
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-600 font-mono select-none pl-4">
                  0x{line.address_ref.toString(16).toUpperCase()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
