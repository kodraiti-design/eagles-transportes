@echo off
taskkill /F /IM python.exe 2>nul
cd /d "c:\Users\Marcelo Kodrai\Documents\projetos_python\Eagles Transportes\backend"
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
del *.log
del eagles_v3.db
echo Cleaned.
python main.py
