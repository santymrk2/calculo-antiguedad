# 🏗️ Documentación Arquitectónica: Módulo de Antigüedad

Detalles técnicos profundos sobre los algoritmos, estructuras de datos y fórmulas implementadas.

## 📐 Algoritmos Clave

### 1. Extracción de Datos (Regex & Parsing)

#### DNI Extraction

```javascript
// Múltiples patrones soportados
const patterns = [
  /DNI:\s*([\d\.]+)/i,           // "DNI: 23.456.789"
  /D\.N\.I\.:\s*([\d\.]+)/i,     // "D.N.I.: 23.456.789"
  /DNI\s+([\d\.]+)/i,            // "DNI 23.456.789"
  /([\d]{1,2}\.[\d]{3}\.[\d]{3})/ // "23.456.789" (aislado)
];

// Limpieza: remove dots
const cleanDni = match.replace(/\./g, "");  // "23456789"
```

#### Período Extraction (PDF)

```regex
/DEL\s+(\d{2}\/\d{2}\/\d{4})\s+AL\s+(\d{2}\/\d{2}\/\d{4})([\s\S]{1,150}?)(?:COMO\s+([A-Z\s\-]+?))?(?=DEL|COMO|$)/g
```

**Partes:**
- `DEL\s+(\d{2}\/\d{2}\/\d{4})` → Fecha inicio (dd/mm/yyyy)
- `AL\s+(\d{2}\/\d{2}\/\d{4})` → Fecha fin (dd/mm/yyyy)
- `([\s\S]{1,150}?)` → Contexto (hasta 150 caracteres)
- `(?:COMO\s+([A-Z\s\-]+?))?` → Cargo (opcional, captura mayúsculas)
- `(?=DEL|COMO|$)` → Lookahead (no consume caracteres)

**Ejemplo de match:**
```
Texto: "DEL 01/03/2015 AL 31/12/2020 en la Escuela A COMO MAESTRO DE GRADO"

Captura 1: "01/03/2015" (inicio)
Captura 2: "31/12/2020" (fin)
Captura 3: " en la Escuela A " (contexto)
Captura 4: "MAESTRO DE GRADO" (cargo)
```

### 2. Normalización de Fechas

Soporta múltiples formatos de entrada y normaliza a ISO 8601 (YYYY-MM-DD):

```javascript
function normalizeDate(dateStr) {
  const str = dateStr.toString().trim();

  // Casos soportados:
  // Input: "01/03/2015" → Output: "2015-03-01"
  // Input: "2015-03-01" → Output: "2015-03-01" (ya normalizado)
  // Input: "2015/03/01" → Output: "2015-03-01"
  // Input: "01-03-2015" → Output: "2015-03-01"

  // Fórmula general:
  // [d, m, y] → `${y}-${pad(m)}-${pad(d)}`
}
```

### 3. Validación de Fechas

Verifica que la fecha sea real (no falsa como 31/02/2020):

```javascript
function isValidDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);

  // Rango válido
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;

  // Verificación real
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );

  // Ejemplo:
  // isValidDate("2020-02-31") → false (no existe 31/02)
  // isValidDate("2020-02-29") → true (2020 es bisiesto)
}
```

### 4. Deduplicación (Exact Match)

```javascript
function isDuplicate(record, legajo) {
  return legajo.some(item =>
    item.dni === record.dni &&
    item.inicio === record.inicio &&
    item.fin === record.fin &&
    item.cargo === record.cargo
  );
}

// Ejemplo:
// Record nuevo: { dni: "23456789", inicio: "2015-03-01", fin: "2020-12-31", cargo: "MAESTRO" }
// Legajo existente contiene: mismo record exacto
// Result: isDuplicate() → true → Se descarta

// Variación mínima NO es duplicado:
// Record nuevo tiene fin: "2020-12-30" (un día antes)
// Result: isDuplicate() → false → Se agrega
```

### 5. Algoritmo de Fusión (Merge Intervals)

Fusiona períodos superpuestos en bloques continuos.

**Pseudocódigo:**

```
Entrada: Array de períodos (sin ordenar, posiblemente solapados)
Salida: Array de períodos fusionados (no solapados)

1. Ordenar por fecha_inicio
2. merged = [período[0]]
3. Para cada período_actual (desde índice 1):
   a. último_fusionado = merged[-1]
   b. Si período_actual.inicio <= último_fusionado.fin:
      - Solapan, fusionar: último_fusionado.fin = max(último_fusionado.fin, período_actual.fin)
   c. Sino:
      - No solapan, agregar como nuevo período
4. Retornar merged
```

**Ejemplo visual:**

```
Entrada:
[2015-03-01 ────────── 2020-06-30]  MAESTRO
           [2020-05-01 ────────── 2020-12-31]  DIRECTOR

Ordenada (ya estaba):
[2015-03-01 ────────── 2020-06-30]
           [2020-05-01 ────────── 2020-12-31]

Se solapan: 2020-05-01 <= 2020-06-30
Fusión:
[2015-03-01 ─────────────────────── 2020-12-31]

Salida (un solo período):
[2015-03-01 ─────────────────────── 2020-12-31]
```

**Implementación en JavaScript:**

```javascript
function mergeIntervals(periods) {
  if (periods.length === 0) return [];

  const sorted = periods.sort((a, b) => 
    parseDate(a.inicio) - parseDate(b.inicio)
  );

  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    const lastEnd = parseDate(last.fin);
    const currentStart = parseDate(current.inicio);

    if (currentStart <= lastEnd) {
      // Solapan: extender fin si es necesario
      const currentEnd = parseDate(current.fin);
      if (currentEnd > lastEnd) {
        last.fin = current.fin;
      }
    } else {
      // No solapan: agregar nuevo
      merged.push(current);
    }
  }

  return merged;
}
```

**Complejidad:**
- Tiempo: O(n log n) por ordenamiento
- Espacio: O(n) para array fusionado

---

## 📊 Cálculo de Antigüedad

### Conteo Natural (Calendario Estricto)

Cuenta literalmente los días entre dos fechas.

```javascript
function daysBetweenNatural(inicio, fin) {
  const start = parseDate(inicio);  // "2015-03-01" → Date(2015, 2, 1)
  const end = parseDate(fin);       // "2020-12-31" → Date(2020, 11, 31)

  const diffTime = Math.abs(end - start);  // En milisegundos
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1;  // +1 para criterio inclusivo
}

// Ejemplo:
// daysBetweenNatural("2020-01-01", "2020-01-01")
// Diferencia: 0 ms
// Ceil(0) = 0 días
// +1 (inclusivo) = 1 día ✓

// daysBetweenNatural("2015-03-01", "2020-12-31")
// Diferencia: 2,128,320,000 ms
// Ceil / miliseconds = 24.627 días
// ≈ 2163 días naturales (incluye 2020 bisiesto)
// +1 = 2164 días
```

### Conteo Comercial (Año Provincial)

Convierte días naturales a años/meses/días usando la norma provincial:
- **1 Año = 360 días** (no 365)
- **1 Mes = 30 días** (fijo, no variable)

```javascript
function daysToCommercial(naturalDays) {
  // Algoritmo simple:
  // 2163 días naturales → ?

  const years = Math.floor(naturalDays / 360);
  // 2163 / 360 = 6.008...
  // Math.floor = 6 años

  const remainder = naturalDays % 360;
  // 2163 - (6 * 360) = 2163 - 2160 = 3 días

  const months = Math.floor(remainder / 30);
  // 3 / 30 = 0.1
  // Math.floor = 0 meses

  const days = remainder % 30;
  // 3 - (0 * 30) = 3 días

  return { years: 6, months: 0, days: 3, total: 2163 };
}

// Resultado: 6 años, 0 meses, 3 días
```

**Conversión inversa (para validación):**

```javascript
function commercialToDays(years, months, days) {
  return years * 360 + months * 30 + days;
}

// Ejemplo: 6 años + 0 meses + 3 días
// = (6 * 360) + (0 * 30) + 3
// = 2160 + 0 + 3
// = 2163 días ✓
```

### Total Bruto vs. Total Neto

**Total Bruto:** Suma directa de todos los períodos sin fusión.

```javascript
function calculateBruto(periods) {
  let totalNaturalDays = 0;

  for (const period of periods) {
    const naturalDays = daysBetweenNatural(period.inicio, period.fin);
    totalNaturalDays += naturalDays;
  }

  return daysToCommercial(totalNaturalDays);
}

// Ejemplo con solapamiento:
// Período 1: 2015-03-01 → 2020-06-30 = 1978 días naturales
// Período 2: 2020-05-01 → 2020-12-31 = 245 días naturales
// Total Bruto = 1978 + 245 = 2223 días = 6 años, 2 meses, 3 días
```

**Total Neto:** Suma después de fusionar períodos superpuestos.

```javascript
function calculateNeto(periods) {
  const merged = mergeIntervals(periods);
  return calculateBruto(merged);  // Usa calculateBruto pero con períodos fusionados
}

// Mismo ejemplo, después de fusión:
// Período fusionado: 2015-03-01 → 2020-12-31 = 2123 días naturales
// Total Neto = 2123 días = 5 años, 11 meses, 23 días
//
// Diferencia Bruto - Neto = 2223 - 2123 = 100 días (solapamiento)
```

---

## 🗂️ Estructura de Datos

### Modelo Unificado (JSON)

```json
{
  "dni": "23456789",
  "inicio": "2015-03-01",
  "fin": "2020-12-31",
  "cargo": "MAESTRO DE GRADO",
  "origen": "1715123456_certificado.pdf (PDF)"
}
```

**Notas:**
- `dni`: Sin puntos (limpiado)
- `inicio`/`fin`: ISO 8601 (YYYY-MM-DD)
- `cargo`: Cadena limpia (espacios múltiples contraídos)
- `origen`: Nombre archivo + tipo (para auditoría)

### Legajo Histórico (Archivo JSON)

```json
[
  {
    "dni": "23456789",
    "inicio": "2015-03-01",
    "fin": "2020-12-31",
    "cargo": "MAESTRO DE GRADO",
    "origen": "1715123456_cert1.pdf (PDF)"
  },
  {
    "dni": "23456789",
    "inicio": "2021-01-15",
    "fin": "2024-05-27",
    "cargo": "DIRECTOR",
    "origen": "1715123457_planilla.xlsx (EXCEL)"
  }
]
```

**Ubicación:** `datos_locales/{DNI_LIMPIO}/legajo_historico.json`

### Respuesta de API `/procesar` (JSON)

```json
{
  "success": true,
  "dni": "23456789",
  "recordsProcessed": 2,
  "recordsAdded": 2,
  "totalRecords": 2,
  "bruto": {
    "years": 6,
    "months": 1,
    "days": 3,
    "total": 2163
  },
  "neto": {
    "years": 5,
    "months": 11,
    "days": 23,
    "total": 2123
  },
  "byRole": {
    "MAESTRO DE GRADO": {
      "years": 5,
      "months": 10,
      "days": 0,
      "total": 2100
    },
    "DIRECTOR": {
      "years": 3,
      "months": 4,
      "days": 12,
      "total": 1200
    }
  },
  "legajo": [ /* Array de registros */ ]
}
```

---

## 🔄 Flujo de Procesamiento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario sube archivo (PDF o Excel)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Server recibe FormData con file                          │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    [.pdf]                   [.xlsx/.xls]
        │                         │
        ▼                         ▼
 pdfParse()          XLSX.read() + sheet_to_json()
        │                         │
        ▼                         ▼
   Extract text               Extract rows
        │                         │
        ▼                         ▼
  extractDni()              extractDni()
 extractPeriodsFromPdf()    extractPeriodsFromExcel()
        │                         │
        └────────────┬────────────┘
                     │
                     ▼
    normalizeDate() + isValidDate()
    createNormalizedRecord()
                     │
                     ▼
    ensureDniDirectory()
    saveSourceDocument()
    readLegajo()
                     │
                     ▼
    isDuplicate() para cada registro
    (si es duplicado → skip)
    (si es nuevo → push)
                     │
                     ▼
    writeLegajo()  (guardar JSON actualizado)
                     │
                     ▼
    calculateBruto()
    calculateNeto()
    calculateByRole()
                     │
                     ▼
   JSON response con resultados
   (enviado al navegador)
                     │
                     ▼
    Renderizar en interfaz web
```

---

## 🛡️ Manejo de Errores

### Validación de Entrada

| Validación | Acción |
|-----------|--------|
| No hay archivo | 400 Bad Request |
| Formato no soportado (no .pdf/.xlsx) | 400 Bad Request |
| No se extrae DNI | 400 Bad Request |
| No se extraen períodos | 400 Bad Request |
| Fecha inválida (31/02/2020) | Skip registro, continuar |
| DNI vacío | 400 Bad Request |
| Períodos con fecha_inicio > fecha_fin | Skip registro |

### Errores de Filesystem

| Error | Handling |
|-------|----------|
| Directorio no se crea | Log error, continuar |
| No se puede guardar documento origen | Log error, continuar (pero procesa) |
| JSON corrupto en legajo_historico.json | Reinicia como array vacío |
| Permiso denegado | Error HTTP 500 |

---

## 📈 Ejemplos de Cálculo

### Caso 1: Un período simple

```
Entrada:
- Inicio: 2015-03-01
- Fin: 2020-12-31

Cálculo:
1. Días naturales = 2164 (inclusive)
2. Años comerciales: 2164 / 360 = 6.011...
   - Años: floor(2164 / 360) = 6
   - Resto: 2164 % 360 = 4
   - Meses: floor(4 / 30) = 0
   - Días: 4 % 30 = 4

Resultado:
Total Bruto: 6 años, 0 meses, 4 días (2164 días)
Total Neto: 6 años, 0 meses, 4 días (sin fusión aplicable)
```

### Caso 2: Dos períodos superpuestos

```
Entrada:
- Período 1: 2015-03-01 → 2020-06-30 (MAESTRO)
- Período 2: 2020-05-01 → 2020-12-31 (DIRECTOR)

Cálculo Total Bruto:
- Período 1: 1979 días
- Período 2: 245 días
- Total: 1979 + 245 = 2224 días = 6 años, 2 meses, 4 días

Cálculo Total Neto (después de fusionar):
- Período fusionado: 2015-03-01 → 2020-12-31 = 2144 días
- Total: 2144 días = 5 años, 11 meses, 24 días

Diferencia: 2224 - 2144 = 80 días de solapamiento
```

### Caso 3: Períodos adyacentes (sin solapamiento)

```
Entrada:
- Período 1: 2015-03-01 → 2020-06-30
- Período 2: 2020-07-01 → 2024-12-31

Se tocan pero no se solapan (fin período 1 es antes de inicio período 2)
→ NO se fusionan

Total Bruto ≈ Total Neto
```

---

## ⚡ Optimizaciones Implementadas

1. **Lectura lazily de Legajo:** Solo se lee del filesystem cuando es necesario
2. **Almacenamiento de Timestamps:** Nombres de archivo único con timestamp para evitar colisiones
3. **JSON minificado en lecturas:** Apenas se persiste, se reconstruye en memoria para cálculos
4. **Sin BD relacional:** Overhead mínimo, solo filesystem

---

## 🔮 Extensiones Futuras

1. **Almacenamiento de cambios:** Guardar historial de versiones de legajo_historico.json
2. **Reportes PDF:** Generar constancias de antigüedad
3. **Sincronización:** API para enviar datos a sistema central
4. **Notificaciones:** Alertas de hitos (jubilación, ascenso de categoría)
5. **Búsqueda rápida:** Índices por DNI para millones de registros

