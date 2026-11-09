# Voider Releases & Distribution Center

This directory contains compiled binaries, portable web workbench packages, and build automation for Voider.

---

## 1. Compiled Binaries & Packages in this Directory

| File / Folder | Target / Platform | Description |
| :--- | :--- | :--- |
| **`voider-linux-x86_64`** | Linux (x86_64) | Standalone release executable of the Voider analysis engine & HTTP API/workbench server. |
| **`voider-web/`** | Any Platform / Browser | Production-compiled static workbench UI (Vite + React 19 + Tailwind CSS). |
| **`voider-web.zip`** | Portable Zip | Zipped bundle of the production web workbench. |
| **`run-voider.sh`** | Linux | Single-command launcher that starts the Voider engine and serves the workbench UI at `http://localhost:8080`. |
| **`build-windows-installer.bat`** | Windows | 1-click batch script to compile the native `.msi` installer and `voider.exe` on Windows. |
| **`build-windows-installer.ps1`** | Windows | PowerShell equivalent for automated Windows building. |

---

## 2. Quick Run on Linux (Headless or Desktop)

To run the Voider engine and open the workbench:
```bash
# Make runnable
chmod +x ./releases/voider-linux-x86_64 ./releases/run-voider.sh

# Start the workbench web server on port 8080
./releases/run-voider.sh

# Or run CLI commands directly:
./releases/voider-linux-x86_64 info /path/to/binary
./releases/voider-linux-x86_64 disasm /path/to/binary
./releases/voider-linux-x86_64 decompile /path/to/binary
./releases/voider-linux-x86_64 analyze /path/to/binary > report.json
```

---

## 3. Quick Install & Build on Windows (Native Desktop `.msi` / `.exe`)

On your Windows workstation (`C:\Users\Abhi\Coding\projects\Voider`):

1. **Option A (1-Click Script):**
   Double-click `releases\build-windows-installer.bat` or run:
   ```powershell
   .\releases\build-windows-installer.ps1
   ```

2. **Option B (Standard CLI):**
   ```cmd
   git pull origin main
   npm install
   npm run tauri build
   ```

Upon completion, your installer and executable will be ready at:
- **MSI Installer:** `src-tauri\target\release\bundle\msi\voider_0.1.0_x64_en-US.msi`
- **Portable Executable:** `src-tauri\target\release\voider.exe`

Double-click the `.msi` file to install Voider as a native Windows desktop app.

---

## 4. Automated Cloud CI/CD Releases (GitHub Actions)

A GitHub Actions workflow is preconfigured in `.github/workflows/release.yml`.
Whenever you create and push a git tag (e.g. `git tag v0.1.0 && git push origin v0.1.0`), GitHub's Windows runner automatically compiles and attaches the Windows installer directly to your GitHub repository Releases page.
