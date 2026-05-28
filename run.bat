@echo off
title Legajo Digital

echo ========================================
echo    Legajo Digital - Inicio Rapido
echo ========================================
echo.

where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo [Docker detectado. Usando Docker...]
    echo.
    docker compose up -d --build
    echo.
    echo [Abri http://localhost:3000]
    echo [Para detener: docker compose down]
    timeout /t 5 >nul
    start http://localhost:3000
    exit /b
)

echo [Docker no detectado. Usando Python directamente...]
echo.

where python3 >nul 2>nul || where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [Python no encontrado. Instalalo desde https://python.org]
    pause
    exit /b 1
)

if not exist "venv" (
    echo [Creando entorno virtual...]
    python3 -m venv venv 2>nul || python -m venv venv
)

echo [Instalando dependencias...]
call venv\Scripts\activate.bat
pip install -q -r requirements.txt

echo.
echo [Abri http://localhost:3000]
start http://localhost:3000
python3 server.py
