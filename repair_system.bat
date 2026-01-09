@echo off
echo ===================================================
echo     REPARADOR DE SISTEMA EAGLES TRANSPORTES
echo ===================================================
echo.
echo [1/4] Parando processos antigos (Python/Node)...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM uvicorn.exe /T 2>nul
echo Processos limpos.
echo.

echo [2/4] Configurando Firewall (Abrindo portas 8000 e 5173)...
powershell -Command "New-NetFirewallRule -DisplayName 'Eagles Backend' -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -Profile Any -Force" 2>nul
powershell -Command "New-NetFirewallRule -DisplayName 'Eagles Frontend' -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Any -Force" 2>nul
echo Firewall configurado.
echo.

echo [3/4] Iniciando Backend...
start "Eagles Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo [4/4] Iniciando Frontend...
start "Eagles Frontend" cmd /k "cd frontend && npm run dev -- --host"

echo.
echo ===================================================
echo   SISTEMA REINICIADO COM SUCESSO!
echo   Acesse: http://localhost:5173
echo   Ou pelo IP da rede (ex: 192.168.x.x:5173)
echo ===================================================
pause
