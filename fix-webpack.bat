@echo off
echo.
echo ========================================
echo Fixing Webpack/Supabase Build Issue
echo ========================================
echo.

echo Step 1: Stopping any running processes...
taskkill /F /IM node.exe >nul 2>&1

echo Step 2: Cleaning node_modules...
if exist node_modules (
    rmdir /s /q node_modules
)

echo Step 3: Removing package-lock.json...
if exist package-lock.json (
    del /f package-lock.json
)

echo Step 4: Clearing npm cache...
call npm cache clean --force

echo Step 5: Reinstalling packages...
call npm install

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Now run: npm start
echo.
pause
