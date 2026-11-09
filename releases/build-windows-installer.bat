@echo off
echo ========================================================
echo   Voider Desktop Installer & Binary Builder (Windows)
echo ========================================================
echo.
cd /d "%~dp0\.."

echo [*] Checking Node.js and Rust environment...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] npm is not found in PATH. Please install Node.js: https://nodejs.org/
    pause
    exit /b 1
)

where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] cargo is not found in PATH. Please install Rust: https://rustup.rs/
    pause
    exit /b 1
)

echo [*] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [!] npm install failed!
    pause
    exit /b 1
)

echo [*] Building native Windows executable and MSI installer...
call npm run tauri build
if %errorlevel% neq 0 (
    echo [!] Tauri build failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   Build Successful!
echo ========================================================
echo   Your compiled Windows installer and portable EXE are located at:
echo   Installer: src-tauri\target\release\bundle\msi\
echo   Executable: src-tauri\target\release\voider.exe
echo ========================================================
pause
