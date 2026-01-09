@echo off
title Instalador Eagles Transportes
color 0E

echo ===============================================
echo      INSTALADOR EAGLES TRANSPORTES
echo ===============================================
echo.
echo Importante: Voce precisa ter GIT e PYTHON instalados.
echo.
pause

echo.
echo 1. Baixando o sistema da nuvem...
git clone https://github.com/kodraiti-design/eagles-transportes.git
cd eagles-transportes

echo.
echo 2. Instalando bibliotecas do sistema (Backend)...
pip install -r requirements.txt

echo.
echo 3. Instalando parte visual (Frontend)...
cd frontend
call npm install
cd ..

echo.
echo ===============================================
echo      INSTALACAO CONCLUIDA COM SUCESSO!
echo ===============================================
echo.
echo Agora voce pode entrar na pasta 'eagles-transportes' e rodar o sistema.
pause
