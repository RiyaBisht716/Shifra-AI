@echo off
REM Start server: installs dependencies if missing and runs dev script
cd /d %~dp0Server
IF NOT EXIST node_modules (
  echo Installing server dependencies...
  npm install
)
echo Starting server (nodemon)...
npm run dev