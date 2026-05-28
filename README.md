# Legajo Digital

Cálculo de Antigüedad Docente — Provincia de Buenos Aires (Sistema GEDO/DIEGEP).

Procesamiento de PDFs y Excel para extraer y calcular automáticamente la antigüedad
de docentes, con soporte para año comercial (360 días) y año natural (365 días).

---

## Requisitos

Solo necesitás **una** de estas opciones:

| Opción | Requisito | Descarga |
|--------|-----------|----------|
| **A** — Docker | [Docker Desktop](https://www.docker.com/products/docker-desktop/) | ~500 MB |
| **B** — Bun directo | [Bun](https://bun.sh) (se instala solo) | ~30 MB |

---

## Inicio rápido

### Opción A: Docker (recomendada)

```bash
# Clonar el repositorio
git clone https://github.com/TU_USUARIO/legajo-digital.git
cd legajo-digital

# Iniciar
docker compose up -d

# Abrir en el navegador
open http://localhost:3000
```

Para actualizar:
```bash
git pull
docker compose up -d --build
```

### Opción B: Sin Docker

```bash
# Clonar
git clone https://github.com/TU_USUARIO/legajo-digital.git
cd legajo-digital

# Mac / Linux
chmod +x run.sh && ./run.sh

# Windows
# Hacé doble click en run.bat
```

> El script `run.sh` / `run.bat` detecta si tenés Docker y si no, instala Bun automáticamente.

---

## Estructura del proyecto

```
legajo-digital/
├── server.js              # Backend (Bun)
├── index.html             # Frontend (HTML + CSS + JS)
├── package.json           # Dependencias
├── Dockerfile             # Para Docker
├── docker-compose.yml     # Orquestación Docker
├── run.sh                 # Inicio rápido Mac/Linux
├── run.bat                # Inicio rápido Windows
├── datos_locales/         # Datos persistentes (se crea al usar)
│   ├── {DNI}/
│   │   ├── legajo_historico.json
│   │   └── documentos_origen/
│   └── .gitkeep
├── ejemplos/              # Archivos de prueba (generados)
├── .github/
│   └── workflows/
│       ├── docker.yml     # CI: build + test Docker
│       └── build-exe.yml  # Build: EXE multiplataforma
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

### Ejemplo: Subir un Excel

```bash
curl -X POST http://localhost:3000/procesar \
  -F "file=@ejemplos/docente_ejemplo.xlsx"
```

### Ejemplo: Ver docente

```bash
curl http://localhost:3000/agente/34358301 | python3 -m json.tool
```

---

## Modos de cálculo

El sistema soporta dos modos de cálculo seleccionables desde la interfaz:

| Modo | Año | Mes | Uso típico |
|------|-----|-----|------------|
| **Comercial** | 360 días | 30 días | Administrativo provincial |
| **Natural** | 365 días | 30 días | Cómputo calendario |

El modo se guarda en el navegador (localStorage) y persiste entre sesiones.

---

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto del servidor |
| `HOST` | `0.0.0.0` | Interfaz de red |
| `DATA_DIR` | `./datos_locales` | Directorio de datos persistentes |

---

## Desarrollo

```bash
# Clonar
git clone https://github.com/TU_USUARIO/legajo-digital.git
cd legajo-digital

# Instalar dependencias
bun install

# Modo desarrollo (hot reload)
bun dev

# Generar archivos de prueba
bun test-examples.js
```

---

## Build EXE (standalone)

En cada release de GitHub se generan automáticamente ejecutables para:

- `legajo-digital-linux-x64` (Linux)
- `legajo-digital-macos-arm64` (macOS Apple Silicon)
- `legajo-digital-macos-x64` (macOS Intel)
- `legajo-digital-windows-x64.exe`

El EXE funciona **completo** para: servir la interfaz HTML, procesar archivos
Excel, listar docentes y calcular antigüedad. Los datos se guardan en
`datos_locales/` junto al ejecutable.

> **Limitación**: El EXE no puede procesar PDFs porque `pdf-parse` depende de
> `@napi-rs/canvas`, un módulo nativo que `bun build --compile` no puede
> embeber. Si intentás subir un PDF, el EXE devuelve un mensaje claro
> indicando que usés Docker.
>
> Para funcionalidad completa (con PDFs) usá la **Opción A — Docker**.

### Build manual (para testing)

```bash
bun build --compile --target bun-darwin-arm64 --outfile legajo-digital server.js
```

---

## Licencia

MIT
