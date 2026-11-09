# VOIDER (v2.0 PRO) — Reverse Engineering Workbench

> Modern, Ultra-Fast, Scalable Binary Analysis & Reverse Engineering Workbench built with **Tauri v2**, **Rust (`voider-core`)**, **React 19**, **TypeScript**, and **Vite**.

Designed as a modern, ultra-fast alternative to traditional reverse engineering suites like IDA Pro and Ghidra, featuring synchronized disassembly listing, interactive Control Flow Graphs (CFG), AST-driven Pseudo-C decompilation, virtualized 16-byte hex editing, Cross-References (XREFs), Function Call Graph hierarchies, C Type/Struct layout calculations, live Byte Signature scanning, and an in-app Binary Patch Studio.

---

## ⚡ Complete Feature Matrix

| Feature | Description | Shortcut |
| :--- | :--- | :---: |
| **Disassembly Listing** | Fixed-width x86/x64 assembly view with color-coded operands, registers, XREFs, and inline comments | `Space` |
| **Control Flow Graph (CFG)** | Interactive basic block diagram with hierarchical layout, conditional branch coloring (green/red/cyan), pan & zoom | `Space` |
| **Pseudo-C Decompiler** | AST-based high-level C reconstruction with synchronized line-to-instruction cursor navigation | `F5` |
| **Hex & ASCII Editor** | 16-byte aligned virtual memory offset viewer with live ASCII translation and jump-to-offset search | `Alt + H` |
| **Cross References (XREFs)** | Inspect references TO and FROM any function, call, jump, or data symbol | `X` |
| **Call Graph Hierarchy** | Interactive caller/callee function invocation dependency tree | `C` |
| **Data Types & Structs** | Define C structs, calculate member alignments, byte offsets (`+0x08`), and total struct sizes | `T` |
| **Binary Patch Studio** | Modify instruction opcodes, assemble patches, toggle bypasses, and export modified executables | `P` |
| **Signature & Pattern Scanner** | Search executable memory for hex byte signatures with wildcard support (`??`) | `Alt + S` |
| **Bookmarks & Annotations** | Pin critical routines, color-code memory addresses, and jump with one click | `B` |
| **Binary Headers Inspector** | Comprehensive DOS, PE, COFF, Optional, and Section header tables | `Alt + E` |
| **Shannon Entropy Heat Bar** | Continuous entropy visualization (0.0 to 8.0) detecting packed or encrypted code | Automatic |
| **Multi-View Sidebar** | Filterable list of Functions, ASCII/UTF-16 Strings, Imports, Exports, and Sections | Sidebar |
| **Command Palette** | Quick jump modal to addresses, symbols, or functions | `Ctrl + K` / `G` |

---

## 📁 Scalable Directory Architecture

The codebase follows a scalable feature-first and domain-driven design:

```text
voider/
├── Cargo.toml                       # Root workspace configuration
├── crates/
│   └── voider-core/                 # High-performance pure Rust binary analysis engine
│       ├── Cargo.toml               # goblin (ELF/PE/Mach-O), iced-x86 (fast disasm)
│       └── src/
│           ├── lib.rs               # Engine entry point & end-to-end integration tests
│           ├── types.rs             # Core data models (BinaryAnalysis, BasicBlock, etc.)
│           ├── parser.rs            # Multi-format binary parser (PE, ELF, Raw)
│           ├── disasm.rs            # Blazing fast x86/x64 instruction decoding
│           ├── entropy.rs           # Shannon entropy calculations
│           ├── strings.rs           # ASCII & UTF-16 string extractors
│           ├── analysis/cfg.rs      # Leader identification & CFG edge linking
│           └── decompiler.rs        # Structured Pseudo-C code generator
├── src-tauri/                       # Native desktop runner
│   ├── Cargo.toml                   # Tauri v2 backend connecting to voider-core
│   └── src/lib.rs                   # Tauri IPC commands (analyze_binary_bytes, etc.)
└── src/                             # React 19 + TypeScript + Vite 8 frontend
    ├── core/                        # Core domain models, state, and engine
    │   ├── types/binary.ts          # TypeScript interfaces mirroring voider-core
    │   ├── analyzer/                # Binary parsing & analysis bridges
    │   └── samples/demoSamples.ts   # Preloaded crackme demo dataset
    ├── features/                    # Modular feature components
    │   ├── disassembly/             # Linear listing, color-coded opcodes, comments
    │   ├── cfg/                     # Control Flow Graph (CFG) block visualizer
    │   ├── decompiler/              # Synchronized Pseudo-C decompiler
    │   ├── hex/                     # Virtualized 16-byte hex editor + ASCII view
    │   ├── xrefs/                   # Cross-references modal & inspector
    │   ├── callgraph/               # Function call hierarchy tree
    │   ├── structs/                 # C data types & struct layout manager
    │   ├── patcher/                 # Binary Patch Studio (opcode assembler)
    │   ├── search/                  # Wildcard byte signature scanner
    │   ├── bookmarks/               # Pinned address annotations manager
    │   ├── headers/                 # PE/ELF binary header inspector
    │   ├── entropy/                 # Visual Shannon entropy heatmap
    │   ├── navigator/               # Sidebar (Functions, Strings, Imports, Sections)
    │   └── command-palette/         # Quick jump navigation modal (Ctrl+K)
    ├── shared/                      # Shared layouts and UI components
    │   └── layout/
    │       ├── HeaderBar.tsx        # Top navigation toolbar
    │       └── StatusBar.tsx        # Bottom cursor & status bar
    └── test/
        └── engine.test.ts           # Vitest automated test suite
```

---

## 🧪 Automated Testing & Verification

Voider is tested with 100% pass rates across all layers:

### 1. Rust Engine Tests (`voider-core`)
```bash
cargo test -p voider-core
```
*Validates instruction disassembly, CFG branch linking, Shannon entropy math, string extractions, and Pseudo-C decompilation in 0.00s.*

### 2. Frontend Automated Tests (`vitest`)
```bash
npm test
```
*Validates client analysis routines, entropy block partitioning, XREFs, structs, call graphs, and sample data integrity (11/11 tests pass in 6ms).*

### 3. Production Build
```bash
npm run build
```
*Compiles TypeScript with zero errors and produces optimized Vite distribution in ~350ms.*

---

## 📦 How to Build the Native Desktop Application

Because Tauri generates native OS binaries:

### On Your Windows PC:
In PowerShell (`C:\Users\Abhi\Coding\projects\Voider`):

```powershell
# 1. Install dependencies
npm install

# 2. Build the desktop installer (.msi and .exe):
npm run tauri build
```

Once completed, your Windows installer and executable will be located at:
```text
C:\Users\Abhi\Coding\projects\Voider\src-tauri\target\release\bundle\msi\voider_0.1.0_x64_en-US.msi
C:\Users\Abhi\Coding\projects\Voider\src-tauri\target\release\voider.exe
```

Double-click the `.msi` to install Voider as a native Windows desktop app!

### Run in Fast Browser Dev Mode:
```powershell
npm run dev
```
*(Open http://localhost:1420 in your browser to instantly use the entire workbench!)*
