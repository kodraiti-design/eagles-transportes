@echo off
title Reparador de Sistema Eagles (v5.0 - Ultimate)
color 0E

echo ===============================================
echo      REPARADOR DE SISTEMA EAGLES (v5.0)
echo ===============================================
echo.
echo Identificado problema de ambiente Python.
echo Corrigindo instalacao de pacotes...
echo.

echo [INFO] Versao do Python em uso:
python --version
where python
echo.

echo [1/4] Instalando bibliotecas no Python CORRETO...
:: O segredo e usar 'python -m pip' em vez de apenas 'pip'
python -m pip install --upgrade pip
python -m pip install validate-docbr
python -m pip install uvicorn
python -m pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao instalar bibliotecas.
    echo Verifique se o Python esta instalado corretamente.
    pause
    exit /b
)

echo.
echo [2/4] Configurando Firewall...
powershell -Command "New-NetFirewallRule -DisplayName 'Eagles Backend' -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -Profile Any -Force" 2>nul
powershell -Command "New-NetFirewallRule -DisplayName 'Eagles Frontend' -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -Profile Any -Force" 2>nul

echo.
echo [3/4] Consertando Frontend...
cd frontend
if not exist "node_modules" (
    echo Instalando dependencias do Frontend...
    call npm install
)
cd ..

echo.
echo ===============================================
echo      REPARO CONCLUIDO!
echo ===============================================
echo.
echo Agora deve funcionar. Iniciando...
timeout /t 3 >nul

call start_system.bat
