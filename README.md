# VOIDER (v2.0 PRO)

> High-Performance, Next-Generation Binary Analysis & Reverse Engineering Workbench built with **Tauri v2**, **Rust (`voider-core`)**, **React 19**, **TypeScript**, and **Vite**.

Designed as a modern, ultra-fast alternative to traditional reverse engineering suites like IDA Pro and Ghidra, featuring synchronized disassembly listing, interactive Control Flow Graphs (CFG), AST-driven Pseudo-C decompilation, virtualized 16-byte hex editing, and Shannon entropy heatmap visualization.

---

## ⚡ Core Features

- **📜 Interactive Disassembly (Linear Listing)**:
  - Color-coded x86/x64 instruction mnemonics, registers, immediates, and memory operands.
  - In-line editable comments (press `;` or double click).
  - Cross-references (XREFs) and function boundary markers.
  - Interactive double-click to jump to branch/call target addresses.

- **🕸️ Control Flow Graph (CFG / Graph View)**:
  - Visual basic block layout with conditional branching.
  - Emerald green edges for Conditional True (jump taken), ruby red edges for Conditional False (fallthrough), and cyan edges for unconditional jumps.
  - Smooth pan, zoom (40% to 220%), and reset controls.

- **⚡ Pseudo-C Decompiler**:
  - High-level C pseudo-code reconstruction.
  - Line-by-line synchronized tracking with the disassembly listing.
  - Syntax highlighted keywords, types (`int32_t`, `int64_t`), function calls, and strings.
  - One-click "Copy Pseudo-C" to clipboard.

- **🔢 Raw Hex & ASCII Viewer**:
  - Fast 16-byte aligned virtual memory/file offset inspection.
  - Side-by-side synchronized ASCII representation.
  - Instant jump to offset or address.

- **📊 Shannon Entropy Heat Bar**:
  - Section-by-section and chunked entropy visualizer (0.0 to 8.0).
  - Instant visual detection of encrypted, packed, or compressed binary segments.

- **🧭 Multi-View Navigator Sidebar**:
  - **Functions**: Filterable function list with addresses, sizes, and basic block counts.
  - **Strings**: Instant search for ASCII and UTF-16 strings with virtual address and section tags.
  - **Imports & Exports**: DLL and SO function calls with IAT addresses.
  - **Sections**: Detailed breakdown of `.text`, `.rdata`, `.data` with permissions (`r-x`, `rw-`).

- **⌨️ Keyboard-First Workflow**:
  - `Space`: Toggle between Disassembly Listing and Control Flow Graph (IDA-style).
  - `F5`: Switch to Pseudo-C Decompiler (IDA/Ghidra shortcut).
  - `Ctrl + K` or `G`: Open Command Palette / Jump to Address.
  - `Alt + H`: Switch to Hex Editor.
  - `Alt + E`: Switch to Binary Headers Inspector.
  - `;`: Add or edit in-line instruction comment.

---

## 📁 Architecture Overview

```text
voider/
├── Cargo.toml                       # Root workspace configuration
├── crates/
│   └── voider-core/                 # High-performance Rust binary analysis engine
│       ├── Cargo.toml               # goblin (PE/ELF/Mach-O), iced-x86 (disassembler)
│       └── src/
│           ├── lib.rs               # Engine entry point & end-to-end integration tests
│           ├── types.rs             # Core data models (BinaryAnalysis, BasicBlock, etc.)
│           ├── parser.rs            # Multi-format binary parser (PE, ELF, Raw)
│           ├── disasm.rs            # Blazing fast x86/x64 instruction decoding
│           ├── entropy.rs           # Shannon entropy calculations
│           ├── strings.rs           # ASCII & UTF-16 string extractors
│           ├── analysis/cfg.rs      # Leader identification, basic blocks, & CFG edge linking
│           └── decompiler.rs        # Structured Pseudo-C code generator
├── src-tauri/                       # Native desktop runner
│   ├── Cargo.toml                   # Tauri v2 backend connecting to voider-core
│   └── src/lib.rs                   # Tauri IPC commands (analyze_binary_bytes, etc.)
└── src/                             # React 19 + TypeScript + Vite 8 frontend
    ├── types/binary.ts              # TypeScript interfaces mirroring voider-core models
    ├── components/
    │   ├── HeaderBar.tsx            # Global navigation, binary metadata, and file loader
    │   ├── EntropyBar.tsx           # Chunked entropy heatmap component
    │   ├── Sidebar.tsx              # Functions, Strings, Imports, and Sections navigator
    │   ├── DisassemblyView.tsx      # Color-coded linear listing with comments & XREFs
    │   ├── GraphView.tsx            # Interactive Control Flow Graph (CFG) canvas
    │   ├── DecompilerView.tsx       # Synchronized Pseudo-C decompiler
    │   ├── HexView.tsx              # Virtualized 16-byte hex editor + ASCII view
    │   ├── HeaderInspector.tsx      # Comprehensive PE/ELF header breakdown
    │   ├── StatusBar.tsx            # Cursor address, active section, and status indicators
    │   └── CommandPalette.tsx       # Quick jump modal (Ctrl+K / G)
    ├── engine/
    │   ├── clientAnalyzer.ts        # Client-side analysis fallback + Tauri IPC bridge
    │   └── demoSamples.ts           # Preloaded crackme demo executable dataset
    └── test/
        └── engine.test.ts           # Vitest test suite for frontend analysis routines
```

---

## 🧪 Automated Testing & Verification

Voider includes comprehensive test suites across both the native Rust engine and the TypeScript frontend:

### 1. Rust Engine Tests (`voider-core`)
```bash
cargo test -p voider-core
```
*Validates instruction disassembly, CFG branch linking, Shannon entropy math, string extractions, and Pseudo-C decompilation.*

### 2. Frontend Unit Tests (`vitest`)
```bash
npm test
```
*Validates client analysis routines, entropy block partitioning, and sample data integrity.*

### 3. Production Build
```bash
npm run build
```
*Compiles TypeScript with zero type errors and produces optimized Vite assets.*

---

## 🚀 Running Voider

### Browser Dev Mode (instant preview):
```bash
npm run dev
```

### Desktop Native Mode (Tauri):
```bash
npm run tauri dev
```
*(Requires local desktop prerequisites: Visual Studio C++ Build Tools on Windows, Xcode tools on macOS, or WebKitGTK on Linux)*
