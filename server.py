import os

from legajo.routes import app
from legajo.config import DATA_DIR, PORT, HOST

if __name__ == "__main__":
    import uvicorn

    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"✅ Servidor iniciado en http://localhost:{PORT}")
    print(f"📁 Datos almacenados en: {DATA_DIR}")
    uvicorn.run(app, host=HOST, port=PORT)
