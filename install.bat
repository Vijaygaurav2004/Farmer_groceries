@echo off
REM Farmer Groceries - Installation Script for Windows
REM This script helps you get started quickly

echo 🌾 Farmer Groceries - Installation Script
echo ==========================================
echo.

REM Check Node.js
echo Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Check npm
echo Checking npm installation...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm version: %NPM_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
echo This may take a few minutes...
echo.
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to install dependencies
    echo Try running: npm install --legacy-peer-deps
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.

REM Check Expo CLI
echo Checking Expo CLI...
where expo >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Expo CLI not found globally. Installing...
    call npm install -g expo-cli
    echo ✅ Expo CLI installed
) else (
    for /f "tokens=*" %%i in ('expo --version') do set EXPO_VERSION=%%i
    echo ✅ Expo CLI version: %EXPO_VERSION%
)
echo.

REM Success message
echo 🎉 Installation Complete!
echo.
echo 📚 Next Steps:
echo 1. Run: npm start
echo 2. Scan QR code with Expo Go app
echo    (Runs in demo mode with sample data - no backend needed.)
echo    Optional: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env for a real backend.
echo.
echo 📖 Read README.md for detailed instructions
echo.
echo Happy coding! 🚀
echo.
pause

