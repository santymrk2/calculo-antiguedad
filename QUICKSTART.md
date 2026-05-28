# ⚡ Quick Start (5 minutos)

## Paso 1: Instalar Bun

Si no tienes Bun instalado:

```bash
curl -fsSL https://bun.sh/install | bash
```

Verificar instalación:
```bash
bun --version
```

## Paso 2: Instalar Dependencias

```bash
bun install
```

Output esperado:
```
$ bun install
  $ bun install --prefer-offline
  ✓ resolved 2 packages in 234ms
  $ bun install
  ✓ installed 2 packages in 145ms
```

## Paso 3: Generar Archivos de Prueba (Opcional)

```bash
bun test-examples.js
```

Esto crea una carpeta `ejemplos/` con archivos para testing:
- `docente_ejemplo.xlsx` ← Cargá este en la interfaz
- `datos_ejemplo.csv`
- `legajo_ejemplo.json`

## Paso 4: Iniciar el Servidor

```bash
bun server.js
```

Output esperado:
```
✅ Servidor iniciado en http://localhost:3000
📁 Datos almacenados en: /ruta/proyecto/datos_locales
```

## Paso 5: Abrir en el Navegador

Abre **http://localhost:3000** en tu navegador.

Deberías ver:
- Un dropzone morado
- Texto "Arrastrá o hacé clic para subir"
- Un botón "Seleccionar Archivo"

## Paso 6: Cargar un Archivo

1. Haz clic en el dropzone o en "Seleccionar Archivo"
2. Selecciona `ejemplos/docente_ejemplo.xlsx`
3. Espera a que procese (spinner girando)

## Paso 7: Ver Resultados

Deberías ver:
- ✅ Tarjetas de "Total Bruto" y "Total Neto"
- 📊 Tabla "Desglose por Cargo"
- 📑 Tabla "Historial Consolidado"

### Resultado Esperado para `docente_ejemplo.xlsx`:

```
Total Bruto: 5.9 años
  - 5 años, 10 meses, 29 días

Total Neto: 5.9 años (sin solapamientos)
  - 5 años, 10 meses, 29 días

Desglose:
  DOCENTE PRIMARIA:  2.41 años (2 años, 5 meses)
  VICE DIRECTOR:     3.50 años (3 años, 6 meses)
```

## 🎉 ¡Listo!

Ya estás probando el MVP. Ahora puedes:

- Cargar tus propios PDFs (GEDO/DIEGEP)
- Cargar tus propias planillas Excel
- Los datos se guardan en `datos_locales/{DNI}/`
- Ver el JSON actualizado en `datos_locales/{DNI}/legajo_historico.json`

---

## 🛑 Si algo falla:

### Puerto 3000 ocupado

```bash
# Cambiar puerto en server.js:
# const PORT = 3001; (por ejemplo)

bun server.js
# http://localhost:3001
```

### No se instalan las dependencias

```bash
# Limpiar e reinstalar
rm -rf node_modules bun.lockb
bun install
```

### El archivo Excel no se procesa

✅ Asegúrate de que tiene columnas: `DNI`, `Inicio`, `Fin`, `Cargo`  
✅ Las fechas deben estar en formato: `DD/MM/YYYY` o `YYYY-MM-DD`

### El PDF no se extrae

✅ El PDF debe ser **editable** (texto seleccionable), no una imagen escaneada  
✅ Debe contener: `DNI: XX.XXX.XXX`  
✅ Patrones de fechas: `DEL DD/MM/YYYY AL DD/MM/YYYY`

---

## 📚 Siguientes pasos

- Lee `README.md` para documentación completa
- Lee `ARCHITECTURE.md` para entender los algoritmos
- Explora `datos_locales/` para ver cómo se guardan los datos

¡Buen provecho! 🚀
