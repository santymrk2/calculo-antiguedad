#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "╔══════════════════════════════════════════╗"
echo "║       Legajo Digital - Inicio Rápido     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

if command -v docker &> /dev/null; then
  echo "🐳 Docker detectado. Usando Docker..."
  echo ""
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

echo "📦 Docker no detectado. Usando Python directamente..."
echo ""

if ! command -v python3 &> /dev/null; then
  echo "Python3 no encontrado. Instalalo desde https://python.org"
  exit 1
fi

if [ ! -d "venv" ]; then
  echo "Creando entorno virtual..."
  python3 -m venv venv
fi

echo "Instalando dependencias..."
source venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "Iniciando servidor..."
echo ""
echo "✅ Abrí http://localhost:3000 en tu navegador"
echo "   Para detener: Ctrl+C"
echo ""

python3 server.py
