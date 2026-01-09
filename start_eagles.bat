@echo off
title Eagles Transportes Launcher
echo ==========================================
echo   INICIANDO EAGLES TRANSPORTES
echo ==========================================
echo.

echo [1/2] Iniciando Servidor Backend (API)...
cd backend
start "Eagles Backend" cmd /k "python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
cd ..
timeout /t 5 >nul

echo [2/2] Iniciando Frontend (Interface)...
cd frontend
start "Eagles Frontend" cmd /k "npm run dev -- --host"
timeout /t 5 >nul

echo.
echo ==========================================
echo   SISTEMA INICIADO!
echo   Acesse pelo IP da sua mauina.
echo   Mantenha as janelas abertas.
echo ==========================================
pause
