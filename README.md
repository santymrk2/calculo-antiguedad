# Legajo Digital

Cálculo de Antigüedad Docente — Provincia de Buenos Aires (Sistema GEDO/DIEGEP).

Procesamiento de PDFs y Excel para extraer y calcular automáticamente la antigüedad
de docentes, con soporte para año comercial (360 días) y año natural (365 días).

---

## Requisitos

Solo necesitás **una** de estas opciones:

| Opción | Requisito |
|--------|-----------|
| **A** — Docker | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **B** — Python directo | Python 3.12+ |

---

## Inicio rápido

### Opción A: Docker (recomendada)

```bash
docker compose up -d
open http://localhost:3000
```

Para actualizar:
```bash
git pull
docker compose up -d --build
```

### Opción B: Sin Docker

```bash
python3 -m venv venv
source venv/bin/activate      # Linux/macOS
# venv\Scripts\activate.bat    # Windows
pip install -r requirements.txt
python3 server.py
```

---

## Estructura del proyecto

```
legajo-digital/
├── server.py              # Backend (Python / FastAPI)
├── index.html             # Frontend (HTML + CSS + JS)
├── requirements.txt       # Dependencias Python
├── Dockerfile             # Para Docker
├── docker-compose.yml     # Orquestación Docker
├── run.sh                 # Inicio rápido Mac/Linux
├── run.bat                # Inicio rápido Windows
├── datos_locales/         # Datos persistentes (se crea al usar)
│   ├── {DNI}/
│   │   ├── legajo_historico.json
│   │   └── documentos_origen/
│   └── .gitkeep
├── ejemplos/              # Archivos de prueba
├── old/                   # Versión anterior (Node/Bun)
└── README.md
```

---

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Página web |
| `POST` | `/procesar` | Subir PDF o Excel para procesar |
| `GET` | `/agentes` | Listar todos los docentes registrados |
| `GET` | `/agente/{dni}` | Ver legajo completo de un docente |
| `GET` | `/agente/{dni}/documentos` | Listar documentos subidos |
| `POST` | `/reprocesar/{dni}` | Reprocesar documentos de un agente |
| `PUT` | `/agente/{dni}/config` | Actualizar configuración (licencias) |
| `DELETE` | `/agente/{dni}` | Eliminar agente y sus datos |
| `DELETE` | `/documento/{dni}/{filename}` | Eliminar un documento específico |

### Ejemplo: Subir un Excel

```bash
curl -X POST http://localhost:3000/procesar \
  -F "file=@ejemplos/docente_ejemplo.xlsx"
```

---

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto del servidor |
| `HOST` | `0.0.0.0` | Interfaz de red |

---

## Desarrollo

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 server.py
```
