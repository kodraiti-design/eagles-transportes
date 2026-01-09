@echo off
cd /d "c:\Users\Marcelo Kodrai\Documents\projetos_python\Eagles Transportes\backend"
del debug_log.txt 2>nul
call kill_8000.bat
echo Starting Server...
start /b python -m uvicorn main:app --reload --port 8000
echo Waiting for startup...
timeout 10
echo Running Repro...
python repro_crash.py
echo Done.
