import Bun from "bun";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const { PDFParse } = require("pdf-parse");
import XLSX from "xlsx";

// Configuración
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "datos_locales");
const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

// ============================================================================
// UTILIDADES DE SISTEMA DE ARCHIVOS
// ============================================================================

/**
 * Asegura que el directorio para un DNI existe.
 * Crea: /datos_locales/{DNI_LIMPIO}/documentos_origen/
 */
async function ensureDniDirectory(dni) {
  const cleanDni = dni.replace(/\./g, "");
  const dniDir = path.join(DATA_DIR, cleanDni);
  const docsDir = path.join(dniDir, "documentos_origen");

  try {
    await fs.mkdir(docsDir, { recursive: true });
  } catch (error) {
    console.error(`Error al crear directorio para DNI ${dni}:`, error.message);
  }

  return { dniDir, docsDir, cleanDni };
}

/**
 * Lee el legajo histórico de un agente.
 * Retorna array vacío si no existe.
 */
async function readLegajo(dniDir) {
  const legajoPath = path.join(dniDir, "legajo_historico.json");
  try {
    const content = await fs.readFile(legajoPath, "utf-8");
    return JSON.parse(content) || [];
  } catch {
    return [];
  }
}

/**
 * Persiste el legajo actualizado al filesystem.
 */
async function writeLegajo(dniDir, legajo) {
  const legajoPath = path.join(dniDir, "legajo_historico.json");
  try {
    await fs.writeFile(legajoPath, JSON.stringify(legajo, null, 2));
    return true;
  } catch (error) {
    console.error("Error al escribir legajo:", error.message);
    return false;
  }
}

/**
 * Guarda una copia del archivo original en documentos_origen.
 */
async function saveSourceDocument(docsDir, buffer, filename) {
  const timestamp = Date.now();
  const safeName = `${timestamp}_${filename}`;
  const filePath = path.join(docsDir, safeName);

  try {
    await fs.writeFile(filePath, buffer);
    return safeName;
  } catch (error) {
    console.error("Error al guardar documento origen:", error.message);
    return null;
  }
}

// ============================================================================
// EXTRACCIÓN DE DATOS (PDF y EXCEL)
// ============================================================================

/**
 * Extrae el DNI de un texto (PDF o Excel).
 * Busca patrón: "DNI: 12.345.678" o variantes.
 */
function extractDni(text) {
  const patterns = [
    /DNI:\s*([\d\.]+)/i,
    /D\.N\.I\.:\s*([\d\.]+)/i,
    /DNI\s+([\d\.]+)/i,
    /([\d]{1,2}\.[\d]{3}\.[\d]{3})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].replace(/\./g, "");
    }
  }

  return null;
}

/**
 * Extrae períodos de trabajo de un texto PDF (GEDO/DIEGEP PBA).
 * Busca patrones como: "DEL 01/01/2020 AL 31/12/2020 ... COMO MAESTRO DE GRADO"
 */
function extractPeriodsFromPdf(text) {
  const periods = [];

  // Patrón: DEL dd/mm/yyyy AL dd/mm/yyyy ... COMO CARGO
  const regex =
    /DEL\s+(\d{2}\/\d{2}\/\d{4})\s+AL\s+(\d{2}\/\d{2}\/\d{4})([\s\S]{1,150}?)(?:COMO\s+([A-Z\s\-]+?))?(?=DEL|COMO|$)/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const [, fechaInicio, fechaFin, context, cargo] = match;

    // Convertir fechas de DD/MM/YYYY a YYYY-MM-DD
    const [d1, m1, y1] = fechaInicio.split("/");
    const [d2, m2, y2] = fechaFin.split("/");

    const inicio = `${y1}-${m1}-${d1}`;
    const fin = `${y2}-${m2}-${d2}`;

    // Limpiar cargo
    let cargoLimpio = (cargo || "SIN_ESPECIFICAR").trim();
    cargoLimpio = cargoLimpio.replace(/\s+/g, " ");

    if (isValidDate(inicio) && isValidDate(fin)) {
      periods.push({
        inicio,
        fin,
        cargo: cargoLimpio,
      });
    }
  }

  return periods;
}

/**
 * Extrae períodos de un archivo Excel.
 * Asume estructura: [DNI, Inicio, Fin, Cargo]
 */
function extractPeriodsFromExcel(buffer) {
  const periods = [];

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    for (const row of data) {
      // Buscar columnas (flexible: dni, DNI, inicio, Inicio, fin, Fin, cargo, Cargo)
      const dniCol = Object.keys(row).find((k) => k.toLowerCase() === "dni");
      const inicioCol = Object.keys(row).find(
        (k) => k.toLowerCase() === "inicio",
      );
      const finCol = Object.keys(row).find((k) => k.toLowerCase() === "fin");
      const cargoCol = Object.keys(row).find(
        (k) => k.toLowerCase() === "cargo",
      );

      if (dniCol && inicioCol && finCol) {
        const inicio = normalizeDate(row[inicioCol]);
        const fin = normalizeDate(row[finCol]);
        const cargo = (row[cargoCol] || "SIN_ESPECIFICAR").toString().trim();

        if (inicio && fin && isValidDate(inicio) && isValidDate(fin)) {
          periods.push({
            inicio,
            fin,
            cargo,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error al parsear Excel:", error.message);
  }

  return periods;
}

/**
 * Normaliza una fecha a YYYY-MM-DD.
 * Soporta: "01/01/2020", "1/1/2020", "2020-01-01", "2020/01/01", etc.
 */
function normalizeDate(dateStr) {
  if (!dateStr) return null;

  const str = dateStr.toString().trim();

  // Ya está en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Formato DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Formato DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split("-");
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  // Formato YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split("/");
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  return null;
}

/**
 * Valida que una fecha en formato YYYY-MM-DD sea válida.
 */
function isValidDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [y, m, d] = dateStr.split("-").map(Number);

  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }

  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

// ============================================================================
// MODELO UNIFICADO Y PROCESAMIENTO
// ============================================================================

/**
 * Crea un registro normalizado (Modelo Unificado).
 */
function createNormalizedRecord(dni, inicio, fin, cargo, origen) {
  return {
    dni: dni.replace(/\./g, ""),
    inicio,
    fin,
    cargo: cargo.trim(),
    origen,
  };
}

/**
 * Deduplica: retorna true si el registro ya existe en el legajo.
 */
function isDuplicate(record, legajo) {
  return legajo.some(
    (item) =>
      item.dni === record.dni &&
      item.inicio === record.inicio &&
      item.fin === record.fin &&
      item.cargo === record.cargo,
  );
}

// ============================================================================
// CÁLCULO DE ANTIGÜEDAD (AÑO COMERCIAL)
// ============================================================================

/**
 * Convierte una fecha YYYY-MM-DD a objeto Date.
 */
function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Calcula días entre dos fechas (inclusivo: +1).
 * Utilizando conteo natural (calendario estricto).
 */
function daysBetweenNatural(inicio, fin) {
  const start = parseDate(inicio);
  const end = parseDate(fin);

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Inclusivo: +1
  return diffDays + 1;
}

/**
 * Convierte días naturales a Conteo Comercial Provincial.
 * Año = 360 días, Mes = 30 días.
 */
function daysToCommercial(naturalDays) {
  const years = Math.floor(naturalDays / 360);
  const remainder = naturalDays % 360;
  const months = Math.floor(remainder / 30);
  const days = remainder % 30;

  return { years, months, days, total: naturalDays };
}

/**
 * Convierte días naturales a Año Natural.
 * Año = 365 días, Mes = 30 días.
 */
function daysToNatural(naturalDays) {
  const years = Math.floor(naturalDays / 365);
  const remainder = naturalDays % 365;
  const months = Math.floor(remainder / 30);
  const days = remainder % 30;

  return { years, months, days, total: naturalDays };
}

/**
 * Convierte objeto de años/meses/días a días totales (comercial).
 */
function commercialToDays(years, months, days) {
  return years * 360 + months * 30 + days;
}

/**
 * Fusiona intervalos superpuestos (Merge Intervals).
 * Retorna array de períodos sin solapamientos.
 */
function mergeIntervals(periods) {
  if (periods.length === 0) return [];

  // Ordenar por fecha de inicio
  const sorted = periods.sort((a, b) => {
    const dateA = parseDate(a.inicio);
    const dateB = parseDate(b.inicio);
    return dateA - dateB;
  });

  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    const lastEnd = parseDate(last.fin);
    const currentStart = parseDate(current.inicio);

    // Si se superponen o son adyacentes, fusionar
    if (currentStart <= lastEnd) {
      const currentEnd = parseDate(current.fin);
      if (currentEnd > lastEnd) {
        last.fin = current.fin;
      }
    } else {
      // No se solapan, agregar como nuevo período
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Calcula el total bruto (sin fusión) para un agente.
 * @param {function} converter - Función de conversión (daysToCommercial o daysToNatural)
 */
function calculateBruto(periods, converter = daysToCommercial) {
  let totalNaturalDays = 0;

  for (const period of periods) {
    const naturalDays = daysBetweenNatural(period.inicio, period.fin);
    totalNaturalDays += naturalDays;
  }

  return converter(totalNaturalDays);
}

/**
 * Calcula el total neto (con fusión de superposiciones).
 * @param {function} converter - Función de conversión (daysToCommercial o daysToNatural)
 */
function calculateNeto(periods, converter = daysToCommercial) {
  const merged = mergeIntervals(periods);
  return calculateBruto(merged, converter);
}

/**
 * Calcula desglose por cargo.
 * @param {function} converter - Función de conversión (daysToCommercial o daysToNatural)
 */
function calculateByRole(periods, converter = daysToCommercial) {
  const byRole = {};

  for (const period of periods) {
    if (!byRole[period.cargo]) {
      byRole[period.cargo] = [];
    }
    byRole[period.cargo].push(period);
  }

  const result = {};
  for (const [role, rolePeriods] of Object.entries(byRole)) {
    result[role] = calculateBruto(rolePeriods, converter);
  }

  return result;
}

// ============================================================================
// ENDPOINTS
// ============================================================================

async function handleProcessFile(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const buffer = await file.arrayBuffer();
    const filename = file.name.toLowerCase();

    // Determinar tipo de documento
    let dni = null;
    let periods = [];

    if (filename.endsWith(".pdf")) {
      // Parsear PDF
      const parser = new PDFParse({ data: Buffer.from(buffer) });
      const pdfData = await parser.getText(); // Retorna { text: "..." }
      const text = pdfData.text;

      dni = extractDni(text);
      periods = extractPeriodsFromPdf(text);
    } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      // Parsear Excel
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Buscar DNI en la primera fila o de la primera columna
      if (data.length > 0) {
        const firstRow = data[0];
        const dniCol = Object.keys(firstRow).find(
          (k) => k.toLowerCase() === "dni",
        );
        if (dniCol) {
          dni = firstRow[dniCol]?.toString().replace(/\./g, "");
        }
      }

      periods = extractPeriodsFromExcel(buffer);
    } else {
      return new Response(
        JSON.stringify({ error: "Format not supported (use PDF or Excel)" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!dni) {
      return new Response(
        JSON.stringify({ error: "Could not extract DNI from file" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (periods.length === 0) {
      return new Response(
        JSON.stringify({ error: "Could not extract periods from file" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Asegurar directorio del DNI
    const { dniDir, docsDir, cleanDni } = await ensureDniDirectory(dni);

    // Guardar copia del documento original
    const sourceName = await saveSourceDocument(
      docsDir,
      Buffer.from(buffer),
      filename,
    );

    // Leer legajo actual
    let legajo = await readLegajo(dniDir);

    // Procesar cada período
    let addedCount = 0;
    for (const period of periods) {
      const record = createNormalizedRecord(
        dni,
        period.inicio,
        period.fin,
        period.cargo,
        `${sourceName} (${filename.endsWith(".pdf") ? "PDF" : "EXCEL"})`,
      );

      // Deduplicación
      if (!isDuplicate(record, legajo)) {
        legajo.push(record);
        addedCount++;
      }
    }

    // Guardar legajo actualizado
    await writeLegajo(dniDir, legajo);

    // Calcular resultados en ambos modos
    const comercial = {
      bruto: calculateBruto(legajo, daysToCommercial),
      neto: calculateNeto(legajo, daysToCommercial),
      byRole: calculateByRole(legajo, daysToCommercial),
    };
    const natural = {
      bruto: calculateBruto(legajo, daysToNatural),
      neto: calculateNeto(legajo, daysToNatural),
      byRole: calculateByRole(legajo, daysToNatural),
    };

    return new Response(
      JSON.stringify({
        success: true,
        dni: cleanDni,
        recordsProcessed: periods.length,
        recordsAdded: addedCount,
        totalRecords: legajo.length,
        comercial,
        natural,
        legajo,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error processing file:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleGetAgente(dniPath) {
  try {
    const cleanDni = dniPath.replace(/\./g, "");
    const dniDir = path.join(DATA_DIR, cleanDni);

    const legajo = await readLegajo(dniDir);

    if (legajo.length === 0) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const comercial = {
      bruto: calculateBruto(legajo, daysToCommercial),
      neto: calculateNeto(legajo, daysToCommercial),
      byRole: calculateByRole(legajo, daysToCommercial),
    };
    const natural = {
      bruto: calculateBruto(legajo, daysToNatural),
      neto: calculateNeto(legajo, daysToNatural),
      byRole: calculateByRole(legajo, daysToNatural),
    };

    return new Response(
      JSON.stringify({
        dni: cleanDni,
        totalRecords: legajo.length,
        comercial,
        natural,
        legajo,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error retrieving agent:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * GET /agentes - Lista todos los docentes registrados en el sistema.
 */
async function handleListAgentes() {
  try {
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    const agentes = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dni = entry.name;
      const legajo = await readLegajo(path.join(DATA_DIR, dni));

      if (legajo.length === 0) continue;

      // Contar documentos origen
      const docsDir = path.join(DATA_DIR, dni, "documentos_origen");
      let docCount = 0;
      try {
        const docs = await fs.readdir(docsDir);
        docCount = docs.length;
      } catch {
        // No hay directorio de documentos
      }

      // Calcular antigüedad en ambos modos
      const comercial = {
        bruto: calculateBruto(legajo, daysToCommercial),
        neto: calculateNeto(legajo, daysToCommercial),
      };
      const natural = {
        bruto: calculateBruto(legajo, daysToNatural),
        neto: calculateNeto(legajo, daysToNatural),
      };

      // Rango de fechas
      const primerPeriodo = legajo.reduce(
        (min, r) => (r.inicio < min ? r.inicio : min),
        legajo[0].inicio,
      );
      const ultimoPeriodo = legajo.reduce(
        (max, r) => (r.fin > max ? r.fin : max),
        legajo[0].fin,
      );

      // Cargos únicos
      const cargos = [...new Set(legajo.map((r) => r.cargo))];

      agentes.push({
        dni,
        totalRecords: legajo.length,
        documentos: docCount,
        comercial,
        natural,
        primerPeriodo,
        ultimoPeriodo,
        cargos,
      });
    }

    // Ordenar por DNI
    agentes.sort((a, b) => a.dni.localeCompare(b.dni));

    return new Response(JSON.stringify({ agentes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error listing agents:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ============================================================================
// SERVIDOR BUN
// ============================================================================

const server = Bun.serve({
  port: PORT,
  hostname: HOST,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // GET /
    if (pathname === "/" && request.method === "GET") {
      try {
        const htmlPath = path.join(__dirname, "index.html");
        const html = await Bun.file(htmlPath).text();
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      } catch {
        return new Response("index.html not found", { status: 404 });
      }
    }

    // POST /procesar
    if (pathname === "/procesar" && request.method === "POST") {
      return handleProcessFile(request);
    }

    // GET /agentes - Listar todos los docentes
    if (pathname === "/agentes" && request.method === "GET") {
      return handleListAgentes();
    }

    // GET /agente/{dni} - Ver un docente específico
    if (pathname.startsWith("/agente/") && request.method === "GET") {
      const dniPath = pathname.replace("/agente/", "");
      return handleGetAgente(dniPath);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`✅ Servidor iniciado en http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
console.log(`📁 Datos almacenados en: ${DATA_DIR}`);
