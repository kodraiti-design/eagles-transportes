@echo off
echo ===================================================
echo   FORCE RESTART EAGLES SYSTEM (DATABASE UNLOCK)
echo ===================================================
echo.
echo [1/3] Killing all Python processes (Releases Database Locks)...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul

echo.
echo [2/3] Killing Node.js processes...
taskkill /F /IM node.exe /T 2>nul

echo.
echo [3/3] System Cleaned!
echo.
echo Agora voce pode rodar o 'start_eagles.bat' novamente para subir o sistema do zero.
echo.
pause
