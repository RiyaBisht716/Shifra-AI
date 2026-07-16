@echo off
REM Opens two new cmd windows and runs server and client (installs deps if needed)
echo Launching server and client in separate terminals...
start "Server" cmd /k "cd /d %~dp0Server && IF NOT EXIST node_modules ( echo Installing server dependencies... && npm install ) && npm run dev"
start "Client" cmd /k "cd /d %~dp0Client && IF NOT EXIST node_modules ( echo Installing client dependencies... && npm install ) && npm run dev"
echo Done.