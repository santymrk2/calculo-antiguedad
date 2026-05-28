#!/usr/bin/env bash
# =============================================================================
# Legajo Digital — Inicio rápido (Mac / Linux)
# =============================================================================
# Uso:  chmod +x run.sh && ./run.sh
# =============================================================================

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "╔══════════════════════════════════════════╗"
echo "║       Legajo Digital - Inicio Rápido     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ---- Detectar Docker ----
if command -v docker &> /dev/null; then
  echo "🐳 Docker detectado. Usando Docker..."
  echo ""

  # Build si hace falta
  if ! docker image inspect legajo-digital:latest &> /dev/null; then
    echo "Construyendo imagen Docker..."
    docker compose build
  fi

  echo "Iniciando contenedor..."
  docker compose up -d

  echo ""
  echo "✅ Legajo Digital corriendo en: http://localhost:3000"
  echo ""
  echo "   Para ver logs:  docker compose logs -f"
  echo "   Para detener:   docker compose down"
  exit 0
fi

# ---- Sin Docker, usar Bun ----
echo "📦 Docker no detectado. Usando Bun directamente..."
echo ""

# Verificar / instalar Bun
if ! command -v bun &> /dev/null; then
  echo "Bun no encontrado. Instalando..."
  curl -fsSL https://bun.sh/install | bash
  echo ""
  echo "Bun instalado. Reabrí la terminal o ejecutá: source ~/.bashrc"
  echo "Y volvé a ejecutar ./run.sh"
  exit 1
fi

# Instalar dependencias
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  bun install
fi

echo "Iniciando servidor..."
echo ""
echo "✅ Abrí http://localhost:3000 en tu navegador"
echo "   Para detener: Ctrl+C"
echo ""

bun server.js
