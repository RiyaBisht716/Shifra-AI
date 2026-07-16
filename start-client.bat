@echo off
REM Start client: installs dependencies if missing and runs Vite dev server
cd /d %~dp0Client
IF NOT EXIST node_modules (
  echo Installing client dependencies...
  npm install
)
echo Starting client (Vite)...
npm run dev
