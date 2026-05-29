import os
import asyncio
import json
import re
from datetime import datetime

from legajo.config import DATA_DIR


def ensure_dni_directory(dni):
    clean_dni = dni.replace(".", "")
    dni_dir = os.path.join(DATA_DIR, clean_dni)
    docs_dir = os.path.join(dni_dir, "documentos_origen")
    os.makedirs(docs_dir, exist_ok=True)
    return dni_dir, docs_dir, clean_dni


async def read_json(path):
    try:
        loop = asyncio.get_event_loop()
        with open(path, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


async def write_json(path, data):
    loop = asyncio.get_event_loop()

    def _write():
        with open(path, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    await loop.run_in_executor(None, _write)


async def read_legajo(dni_dir):
    return await read_json(os.path.join(dni_dir, "legajo_historico.json"))


async def write_legajo(dni_dir, legajo):
    return await write_json(os.path.join(dni_dir, "legajo_historico.json"), legajo)


async def read_licencias(dni_dir):
    return await read_json(os.path.join(dni_dir, "licencias.json"))


async def write_licencias(dni_dir, licencias):
    return await write_json(os.path.join(dni_dir, "licencias.json"), licencias)


async def read_config(dni_dir):
    path = os.path.join(dni_dir, "config.json")
    try:
        loop = asyncio.get_event_loop()
        with open(path, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


async def write_config(dni_dir, updates):
    current = await read_config(dni_dir)
    current.update(updates)
    path = os.path.join(dni_dir, "config.json")
    loop = asyncio.get_event_loop()

    def _write():
        with open(path, "w") as f:
            json.dump(current, f, indent=2, ensure_ascii=False)

    await loop.run_in_executor(None, _write)
    return current


async def save_source_document(docs_dir, content, filename):
    timestamp = int(datetime.now().timestamp() * 1000)
    clean_name = re.sub(r"^[^a-zA-Z0-9]+", "", filename)
    safe_name = f"{timestamp}_{clean_name}"
    file_path = os.path.join(docs_dir, safe_name)

    loop = asyncio.get_event_loop()

    def _write():
        with open(file_path, "wb") as f:
            f.write(content)

    await loop.run_in_executor(None, _write)
    return safe_name, clean_name
