@echo off
setlocal
cd /d "%~dp0.."
echo Stopping process on port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
if exist .next rmdir /s /q .next
echo Starting dev server on http://localhost:3001 ...
pnpm dev
