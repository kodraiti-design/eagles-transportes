@echo off
setlocal EnableDelayedExpansion
title Instalador Eagles Transportes v3.2 (Force Mode)
color 0E

echo ===============================================
echo      INSTALADOR EAGLES TRANSPORTES
echo ===============================================
echo.
echo Verificando requisitos do sistema...
echo.

:: Tentar adicionar caminhos padrao do GIT ao PATH temporariamente
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin;C:\Program Files (x86)\Git\cmd"

:: ------------------------------------------------
:: 1. VERIFICAR GIT
:: ------------------------------------------------
git --version >nul 2>&1
if %errorlevel% equ 0 goto :GitOK

echo [X] Git nao encontrado (Error=%errorlevel%).
echo Tentando instalar automaticamente via Winget...
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements

:: Verifica se instalou corretamente
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] O Winget retornou um codigo de erro.
    echo Isso pode acontecer se o Git ja estiver instalado mas nao reconhecido.
    echo.
    set /p "CHOICE=Deseja tentar continuar mesmo assim? (S/N): "
    if /i "!CHOICE!"=="S" goto :GitIgnore
    
    echo.
    echo [ERRO] Cancelado pelo usuario.
    echo Por favor, instale o Git manualmente em git-scm.com
    pause
    exit /b
)

echo.
echo [OK] Git instalado/atualizado.
echo Reiniciando instalador para aplicar mudancas no PATH...
timeout /t 3 >nul
start "" "%~f0"
exit /b

:GitOK
echo [OK] Git detectado.
goto :CheckPython

:GitIgnore
echo [ALERTA] Ignorando verificacao do Git a pedido do usuario.

:CheckPython
:: ------------------------------------------------
:: 2. VERIFICAR PYTHON
:: ------------------------------------------------
python --version >nul 2>&1
if %errorlevel% equ 0 goto :PythonOK

echo [X] Python nao encontrado. Instalando automaticamente...
winget install --id Python.Python.3.11 -e --source winget --accept-package-agreements --accept-source-agreements

if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Erro ao instalar Python.
    set /p "CHOICE=Deseja tentar continuar mesmo assim? (S/N): "
    if /i "!CHOICE!"=="S" goto :PythonIgnore
    
    echo [ERRO] Cancelado. Instale Python em python.org
    pause
    exit /b
)

echo.
echo [OK] Python instalado. Reiniciando...
timeout /t 3 >nul
start "" "%~f0"
exit /b

:PythonOK
echo [OK] Python detectado.
goto :CheckNode

:PythonIgnore
echo [ALERTA] Ignorando verificacao do Python.

:CheckNode
:: ------------------------------------------------
:: 3. VERIFICAR NODE.JS
:: ------------------------------------------------
call npm --version >nul 2>&1
if %errorlevel% equ 0 goto :NodeOK

echo [X] Node.js nao encontrado. Instalando...
winget install --id OpenJS.NodeJS -e --source winget --accept-package-agreements --accept-source-agreements

if %errorlevel% neq 0 (
     echo [AVISO] Erro ao instalar Node.js.
     set /p "CHOICE=Ignorar erro? (S/N): "
     if /i "!CHOICE!"=="S" goto :NodeOK
     exit /b
)
echo [OK] Node instalado. Reiniciando...
timeout /t 3
start "" "%~f0"
exit /b

:NodeOK
echo [OK] Node.js detectado.

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
    if !errorlevel! neq 0 (
        echo [AVISO] Git pull falhou. Tentando continuar...
    )
) else (
    echo Baixando sistema da nuvem...
    git clone https://github.com/kodraiti-design/eagles-transportes.git
    if !errorlevel! neq 0 (
         echo [ERRO CRITICO] Falha ao clonar repositorio.
         echo Verifique sua internet ou se o Git esta funcionando.
         pause
         exit /b
    )
    cd eagles-transportes
)

echo.
echo [2/4] Instalando bibliotecas do sistema (Backend)...
:: Tenta instalar validate-docbr explicitamente primeiro
pip install validate-docbr
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
echo      INSTALACAO CONCLUIDA!
echo ===============================================
echo.
pause
