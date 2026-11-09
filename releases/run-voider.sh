#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="${SCRIPT_DIR}/voider-linux-x86_64"
DIST="${SCRIPT_DIR}/voider-web"
PORT="${1:-8080}"

if [ ! -f "$BIN" ]; then
    echo "[!] Binary $BIN not found."
    exit 1
fi

chmod +x "$BIN"

echo "=========================================================="
echo "  Launching Voider Reverse Engineering Workbench (v0.1.0)"
echo "  Port: http://localhost:${PORT}"
echo "=========================================================="

"$BIN" serve "$PORT" "$DIST"
