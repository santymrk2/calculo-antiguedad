import os

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from legajo.handlers import (
    handle_process_file,
    handle_get_agente,
    handle_list_agentes,
    handle_list_documentos,
    handle_reprocesar,
    handle_delete_documento,
    handle_clear_agente,
    handle_update_config,
)
from legajo.config import DATA_DIR, PORT, HOST

app = FastAPI(title="Legajo Digital")


@app.get("/")
async def root():
    html_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "index.html")
    try:
        with open(html_path, "r") as f:
            return HTMLResponse(f.read())
    except FileNotFoundError:
        return HTMLResponse("index.html not found", status_code=404)


@app.get("/style.css")
async def serve_css():
    return FileResponse(
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "style.css"),
        media_type="text/css",
    )


app.mount("/js", StaticFiles(directory="js"), name="js")


@app.post("/procesar")
async def procesar(request: Request):
    return await handle_process_file(request)


@app.get("/agentes")
async def list_agentes():
    return await handle_list_agentes()


@app.get("/agente/{dni}/documentos")
async def list_documentos(dni: str):
    return await handle_list_documentos(dni)


@app.get("/agente/{dni}")
async def get_agente(dni: str):
    return await handle_get_agente(dni)


@app.delete("/agente/{dni}")
async def clear_agente(dni: str):
    return await handle_clear_agente(dni)


@app.post("/reprocesar/{dni}")
async def reprocesar(dni: str):
    return await handle_reprocesar(dni)


@app.put("/agente/{dni}/config")
async def update_config(dni: str, request: Request):
    return await handle_update_config(dni, request)


@app.delete("/documento/{dni:path}")
async def delete_documento(dni: str, request: Request):
    path_parts = dni.split("/")
    if len(path_parts) >= 2:
        dni_val = path_parts[0]
        filename = "/".join(path_parts[1:])
        from urllib.parse import unquote
        filename = unquote(filename)
        return await handle_delete_documento(dni_val, filename)
    return JSONResponse({"error": "Invalid path"}, status_code=400)
