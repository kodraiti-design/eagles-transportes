@echo off
echo ===================================================
echo   INICIANDO SISTEMA EAGLES TRANSPORTES
echo ===================================================

echo [1/3] Iniciando Backend (API)...
start "Eagles Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo [2/3] Iniciando Frontend (App)...
start "Eagles Frontend" cmd /k "cd frontend && npm run dev -- --host"

echo [3/3] Aguardando inicializacao...
timeout /t 5 >nul

echo Abrindo navegador...
start http://localhost:5173

echo ===================================================
echo   SISTEMA RODANDO!
echo   Backend: http://localhost:8000/docs
echo   Frontend: http://localhost:5173
echo ===================================================
pause
