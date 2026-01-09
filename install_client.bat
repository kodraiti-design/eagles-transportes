@echo off
title Instalador Eagles Transportes v3.0 (Auto-Install)
color 0E

echo ===============================================
echo      INSTALADOR EAGLES TRANSPORTES
echo ===============================================
echo.
echo Verificando requisitos do sistema...
echo.

:: 1. Verificar GIT
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Git nao encontrado. Instalando automaticamente...
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo Falha ao instalar Git via Winget. Por favor, instale manualmente.
        pause
        exit
    )
    echo [OK] Git instalado. REINICIANDO INSTALADOR PARA ATUALIZAR...
    timeout /t 3 >nul
    start "" "%~f0"
    exit
) else (
    echo [OK] Git ja instalado.
)

:: 2. Verificar PYTHON
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Python nao encontrado. Instalando automaticamente...
    winget install --id Python.Python.3.11 -e --source winget --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo Falha ao instalar Python.
        pause
        exit
    )
    echo [OK] Python instalado. REINICIANDO INSTALADOR PARA ATUALIZAR...
    timeout /t 3 >nul
    start "" "%~f0"
    exit
) else (
    echo [OK] Python ja instalado.
)

:: 3. Verificar NODE.JS (Necessario para o Frontend)
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js nao encontrado. Instalando automaticamente...
    winget install --id OpenJS.NodeJS -e --source winget --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo Falha ao instalar Node.js.
        pause
        exit
    )
    echo [OK] Node.js instalado. REINICIANDO INSTALADOR PARA ATUALIZAR...
    timeout /t 3 >nul
    start "" "%~f0"
    exit
) else (
    echo [OK] Node.js ja instalado.
)

echo.
echo ===============================================
echo      TODOS OS REQUISITOS ENCONTRADOS!
echo ===============================================
echo.

echo [1/4] Verificando sistema...
if exist "eagles-transportes" (
    echo A pasta ja existe. Atualizando...
    cd eagles-transportes
    git pull
) else (
    echo Baixando sistema da nuvem...
    git clone https://github.com/kodraiti-design/eagles-transportes.git
    cd eagles-transportes
)

echo.
echo [2/4] Instalando bibliotecas do sistema (Backend)...
pip install -r requirements.txt

echo.
echo [3/4] Instalando parte visual (Frontend)...
cd frontend
call npm install
cd ..

echo.
echo [4/4] Criando atalho na Area de Trabalho...
set "TARGET_SCRIPT=%CD%\start_system.bat"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\Eagles Transportes.lnk"
set "ICON_PATH=%CD%\frontend\public\favicon.ico"

powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT_PATH%');$s.TargetPath='%TARGET_SCRIPT%';$s.WorkingDirectory='%CD%';$s.IconLocation='%ICON_PATH%';$s.Save()"

echo.
echo ===============================================
echo      INSTALACAO CONCLUIDA COM SUCESSO!
echo ===============================================
echo.
echo Um atalho foi criado na sua Area de Trabalho.
pause
