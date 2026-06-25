@echo off
title QuickMock API Runner
echo ===================================================
echo   QuickMock API Launcher (Windows Dev Mode)
echo ===================================================

REM 1. Copy .env if it does not exist
if not exist .env (
    echo [INFO] Creating .env file from .env.example...
    copy .env.example .env
    echo [!] Remember to open the .env file and add your Supabase credentials!
)

echo.
echo [1/2] Spinning up Backend in a new window...
start "QuickMock API - FastAPI Backend" cmd /k "title QuickMock API - FastAPI Backend && echo [Back] Setting up virtual environment... && python -m venv venv && call venv\Scripts\activate && echo [Back] Installing requirements... && pip install -r requirements.txt && echo [Back] Starting dev server... && uvicorn api.index:app --reload --port 8000"

echo [2/2] Spinning up Frontend in a new window...
start "QuickMock API - Vite Frontend" cmd /k "title QuickMock API - Vite Frontend && echo [Front] Installing node modules... && npm install && echo [Front] Starting dev server... && npm run dev"

echo.
echo ===================================================
echo [SUCCESS] Both servers are starting up!
echo - Frontend Dev Server: http://localhost:5173
echo - Backend FastAPI Docs: http://127.0.0.1:8000/docs
echo ===================================================
pause
