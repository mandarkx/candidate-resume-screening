@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Resume Screener

echo ============================================
echo            Resume Screener
echo ============================================
echo.

REM --- Check Node.js is installed ---
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo.
  echo Please install the LTS version from https://nodejs.org
  echo then double-click this file again.
  echo.
  pause
  exit /b 1
)

REM --- Create .env configuration file on first run ---
if not exist .env (
  copy .env.example .env >nul
  echo Created .env configuration file.
  echo.
)

REM --- Make sure an API key is configured ---
:check_key
set "KEY_SET="
for /f "tokens=1* delims==" %%a in ('findstr /b /i "LLM_API_KEY=" .env') do (
  if not "%%b"=="" if /i not "%%b"=="sk-..." set "KEY_SET=1"
)
if defined KEY_SET goto key_ok
echo You need to enter your API key before continuing.
echo.
echo   1. A Notepad window will open showing the ".env" file.
echo   2. Set LLM_PROVIDER to openai or gemini.
echo   3. Paste your API key right after LLM_API_KEY=
echo   4. Save the file ^(Ctrl+S^), then come back to this window.
echo.
pause
start "" notepad .env
echo.
echo Press any key once you have saved your API key.
pause >nul
goto check_key
:key_ok

REM --- Install dependencies on first run ---
if not exist node_modules (
  echo Installing dependencies. This can take several minutes...
  echo.
  call npm install
  if errorlevel 1 goto fail
)

REM --- Build the app if needed ---
set "NEED_BUILD="
if not exist dist\server\index.js set "NEED_BUILD=1"
if not exist dist\client\index.html set "NEED_BUILD=1"
if defined NEED_BUILD (
  echo Building the app...
  echo.
  call npm run build
  if errorlevel 1 goto fail
)

set NODE_ENV=production
echo.
echo Starting Resume Screener - your browser will open automatically.
echo Keep this window open while you use the app. Close it to stop.
echo.
call npm start
goto end

:fail
echo.
echo Something went wrong. See the error messages above.

:end
echo.
pause
