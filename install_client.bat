@echo off
title Instalador Eagles Transportes v3.1 (Fix)
color 0E

echo ===============================================
echo      INSTALADOR EAGLES TRANSPORTES
echo ===============================================
echo.
echo Verificando requisitos do sistema...
echo.

:: ------------------------------------------------
:: 1. VERIFICAR GIT
:: ------------------------------------------------
git --version >nul 2>&1
if %errorlevel% equ 0 goto :GitOK

echo [X] Git nao encontrado (Error=%errorlevel%). Instalando automaticamente...
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements

:: Verifica se instalou corretamente
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O Winget falhou ao instalar o Git.
    echo Por favor, instale o Git manualmente em git-scm.com
    pause
    exit /b
)

echo.
echo [OK] Git instalado com sucesso!
echo O instalador precisa ser reiniciado para reconhecer o Git.
echo Reiniciando em 3 segundos...
timeout /t 3 >nul
start "" "%~f0"
exit /b

:GitOK
echo [OK] Git ja instalado.

:: ------------------------------------------------
:: 2. VERIFICAR PYTHON
:: ------------------------------------------------
python --version >nul 2>&1
if %errorlevel% equ 0 goto :PythonOK

echo [X] Python nao encontrado. Instalando automaticamente...
winget install --id Python.Python.3.11 -e --source winget --accept-package-agreements --accept-source-agreements

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O Winget falhou ao instalar o Python.
    echo Por favor, instale o Python manualmente em python.org
    pause
    exit /b
)

echo.
echo [OK] Python instalado com sucesso!
echo O instalador precisa ser reiniciado para reconhecer o Python.
echo Reiniciando em 3 segundos...
timeout /t 3 >nul
start "" "%~f0"
exit /b

:PythonOK
echo [OK] Python ja instalado.

:: ------------------------------------------------
:: 3. VERIFICAR NODE.JS
:: ------------------------------------------------
call npm --version >nul 2>&1
if %errorlevel% equ 0 goto :NodeOK

echo [X] Node.js / NPM nao encontrado. Instalando automaticamente...
winget install --id OpenJS.NodeJS -e --source winget --accept-package-agreements --accept-source-agreements

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O Winget falhou ao instalar o Node.js.
    echo Por favor, instale o Node manualmente em nodejs.org
    pause
    exit /b
)

echo.
echo [OK] Node.js instalado com sucesso!
echo O instalador precisa ser reiniciado para reconhecer o Node.
echo Reiniciando em 3 segundos...
timeout /t 3 >nul
start "" "%~f0"
exit /b

:NodeOK
echo [OK] Node.js ja instalado.

:: ------------------------------------------------
:: 4. INSTALAR O SISTEMA
:: ------------------------------------------------
echo.
echo ===============================================
echo      TODOS OS REQUISITOS ENCONTRADOS!
echo ===============================================
echo.

echo [1/4] Verificando pasta do sistema...
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

:: Powershell para criar atalho
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%SHORTCUT_PATH%');$s.TargetPath='%TARGET_SCRIPT%';$s.WorkingDirectory='%CD%';$s.IconLocation='%ICON_PATH%';$s.Save()"

echo.
echo ===============================================
echo      INSTALACAO CONCLUIDA COM SUCESSO!
echo ===============================================
echo.
echo Um atalho "Eagles Transportes" foi criado na sua Area de Trabalho.
echo Pode fechar esta janela.
pause
