@echo off
title Eagles Transportes - Acesso Externo (Ngrok)
echo ========================================================
echo   INICIANDO ACESSO EXTERNO (PARA MOTORISTAS NA RUA)
echo ========================================================
echo.
echo Importante:
echo 1. O sistema principal deve estar rodando (start_eagles.bat).
echo 2. Voce precisa ter configurado seu Token do Ngrok uma vez.
echo    (Comando: ngrok config add-authtoken SEU_TOKEN)
echo.
echo Iniciando tunel na porta 8000...
echo.
ngrok http 8000
echo.
pause
