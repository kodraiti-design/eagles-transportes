@echo off
color 0A
echo ===============================================
echo   ENVIANDO ATUALIZACOES PARA O GITHUB (NUVEM)
echo ===============================================
echo.

echo 1. Preparando arquivos...
git add .

echo.
set /p msg="2. Escreva o que voce mudou (Ex: correcao botao): "

if "%msg%"=="" set msg="Atualizacao geral"

git commit -m "%msg%"

echo.
echo 3. Enviando para a nuvem...
git push

echo.
echo ===============================================
echo   SUCESSO! SEUS CLIENTES JA PODEM ATUALIZAR.
echo ===============================================
pause
