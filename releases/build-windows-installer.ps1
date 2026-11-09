Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Voider Desktop Installer & Binary Builder (Windows)   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$ScriptDir\.."

# Check prerequisites
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "[!] npm is not installed or not in PATH. Please install Node.js: https://nodejs.org/"
    exit 1
}

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Error "[!] cargo is not installed or not in PATH. Please install Rust: https://rustup.rs/"
    exit 1
}

Write-Host "`n[*] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "[!] npm install failed!"
    exit 1
}

Write-Host "`n[*] Compiling native Windows MSI and EXE via Tauri v2..." -ForegroundColor Yellow
npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Error "[!] Tauri build failed!"
    exit 1
}

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  Build Successful! Voider Windows Binaries Created:    " -ForegroundColor Green
Write-Host "  Installer (MSI): src-tauri\target\release\bundle\msi\" -ForegroundColor White
Write-Host "  Executable (EXE): src-tauri\target\release\voider.exe" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green
