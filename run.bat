@echo off
REM ===========================================================================
REM Legajo Digital — Inicio rápido (Windows)
REM ===========================================================================
REM Uso:  Hace doble click en run.bat
REM ===========================================================================

echo +========================================+
echo ^|       Legajo Digital - Inicio Rápido    ^|
echo +========================================+
echo.

REM ---- Detectar Docker ----
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo 🐳 Docker detectado. Usando Docker...
    echo.
    
    REM Verificar si la imagen existe
    docker image inspect legajo-digital:latest >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo Construyendo imagen Docker...
        docker compose build
    )
    
    echo Iniciando contenedor...
    docker compose up -d
    
    echo.
    echo ✅ Legajo Digital corriendo en: http://localhost:3000
    echo.
    echo    Para ver logs:  docker compose logs -f
    echo    Para detener:   docker compose down
    pause
    exit /b 0
)

REM ---- Sin Docker, usar Bun ----
echo 📦 Docker no detectado. Usando Bun directamente...
echo.

REM Verificar Bun
where bun >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Bun no encontrado. Instalando...
    powershell -c "iwr bun.sh/install.ps1 -useb | iex"
    echo.
    echo Bun instalado. Cerra y reabrí la terminal, o ejecutá:
    echo   %USERPROFILE%\.bun\bin\bun.exe server.js
    pause
    exit /b 1
)

REM Instalar dependencias
if not exist "node_modules" (
    echo Instalando dependencias...
    bun install
)

echo Iniciando servidor...
echo.
echo ✅ Abrí http://localhost:3000 en tu navegador
echo    Para detener: Ctrl+C
echo.

bun server.js
pause
