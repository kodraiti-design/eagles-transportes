@echo off
title Instalador Eagles Transportes v2.0
color 0E

echo ===============================================
echo      INSTALADOR EAGLES TRANSPORTES
echo ===============================================
echo.
echo Importante: Voce precisa ter GIT e PYTHON instalados.
echo.
echo Pressione qualquer tecla para iniciar...
pause >nul

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
echo Um atalho foi criado na sua Area de Trabalho: "Eagles Transportes"
echo.
echo Pressione qualquer tecla para sair.
pause >nul
