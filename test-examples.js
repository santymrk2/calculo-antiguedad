/**
 * test-examples.js
 * 
 * Script para generar archivos de prueba en formato Excel y PDF.
 * Ejecución: bun test-examples.js
 * 
 * Genera:
 * - ejemplos/docente_ejemplo.xlsx (Excel con datos de prueba)
 * - ejemplos/certificado_ejemplo.pdf (PDF simulado para testing)
 */

import * as XLSX from "xlsx";
import fs from "fs/promises";
import path from "path";

const EXAMPLES_DIR = "./ejemplos";

// ============================================================================
// CREAR DIRECTORIO DE EJEMPLOS
// ============================================================================

async function ensureExamplesDir() {
  try {
    await fs.mkdir(EXAMPLES_DIR, { recursive: true });
    console.log(`✅ Directorio '${EXAMPLES_DIR}' creado.`);
  } catch (error) {
    console.error("Error al crear directorio:", error.message);
  }
}

// ============================================================================
// GENERAR ARCHIVO EXCEL DE PRUEBA
// ============================================================================

async function generateExcelExample() {
  const data = [
    {
      DNI: "35654321",
      Inicio: "01/02/2018",
      Fin: "30/06/2020",
      Cargo: "DOCENTE PRIMARIA",
    },
    {
      DNI: "35654321",
      Inicio: "01/07/2020",
      Fin: "31/12/2023",
      Cargo: "VICE DIRECTOR",
    },
    {
      DNI: "23456789",
      Inicio: "15/03/2019",
      Fin: "15/08/2019",
      Cargo: "SUPLENTE",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Ajustar ancho de columnas
  worksheet["!cols"] = [
    { wch: 12 }, // DNI
    { wch: 12 }, // Inicio
    { wch: 12 }, // Fin
    { wch: 20 }, // Cargo
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Personal");

  const filepath = path.join(EXAMPLES_DIR, "docente_ejemplo.xlsx");
  XLSX.writeFile(workbook, filepath);

  console.log(`✅ Archivo Excel generado: ${filepath}`);
  console.log(`   Datos:
   - DNI: 35654321 (2 períodos: 2018-2020, 2020-2023)
   - DNI: 23456789 (1 período: 2019)`);
}

// ============================================================================
// GENERAR ARCHIVO PDF DE PRUEBA (Simulado como texto)
// ============================================================================

async function generatePdfExample() {
  // Nota: Para un PDF real, necesitarías una librería como 'pdfkit'
  // Este ejemplo genera un archivo de texto simulado que contiene
  // patrones reconocibles por el parser PDF del servidor.

  const pdfContent = `MINISTERIO DE EDUCACIÓN - PROVINCIA DE BUENOS AIRES
CERTIFICADO DE ANTIGÜEDAD EN LA DOCENCIA

────────────────────────────────────────────────────────────────

DATOS DEL AGENTE:
Nombre y Apellido: JUAN PÉREZ GARCÍA
DNI: 35.654.321
CUIL: 27-35654321-7

────────────────────────────────────────────────────────────────

HISTORIAL DE SERVICIOS:

DEL 01/02/2018 AL 30/06/2020 COMO DOCENTE PRIMARIA

DEL 01/07/2020 AL 31/12/2023 COMO VICE DIRECTOR

────────────────────────────────────────────────────────────────

TOTALES:
Años de antigüedad: 5 años, 11 meses
Categoría actual: VICE DIRECTOR

Certifico que la información precedente es exacta y verificada
en los registros del Sistema GEDO.

Fecha de emisión: 27/05/2024
Autoridad: Sistema DIEGEP - Provincia de Buenos Aires
`;

  const filepath = path.join(EXAMPLES_DIR, "certificado_ejemplo.txt");
  await fs.writeFile(filepath, pdfContent, "utf-8");

  console.log(`✅ Archivo de prueba (simulado como TXT) generado: ${filepath}`);
  console.log(`   Contiene patrones reconocibles para testing del parser PDF.`);
  console.log(`   
   IMPORTANTE: Para testing real con PDFs, usa pdfs editables (no escaneados).
   Las herramientas de OCR pueden usar: Tesseract, Adobe API, etc.
  `);
}

// ============================================================================
// GENERAR EJEMPLOS EN CSV (Referencia)
// ============================================================================

async function generateCsvExample() {
  const csvContent = `DNI,Inicio,Fin,Cargo
35654321,01/02/2018,30/06/2020,DOCENTE PRIMARIA
35654321,01/07/2020,31/12/2023,VICE DIRECTOR
23456789,15/03/2019,15/08/2019,SUPLENTE
`;

  const filepath = path.join(EXAMPLES_DIR, "datos_ejemplo.csv");
  await fs.writeFile(filepath, csvContent, "utf-8");

  console.log(`✅ Archivo CSV generado: ${filepath}`);
  console.log(`   (Útil para convertir a Excel manualmente si es necesario)`);
}

// ============================================================================
// GENERAR JSON CON LEGAJO DE EJEMPLO
// ============================================================================

async function generateJsonLegajoExample() {
  const legajo = [
    {
      dni: "35654321",
      inicio: "2018-02-01",
      fin: "2020-06-30",
      cargo: "DOCENTE PRIMARIA",
      origen: "certificado_ejemplo.pdf (PDF)",
    },
    {
      dni: "35654321",
      inicio: "2020-07-01",
      fin: "2023-12-31",
      cargo: "VICE DIRECTOR",
      origen: "certificado_ejemplo.pdf (PDF)",
    },
  ];

  const filepath = path.join(EXAMPLES_DIR, "legajo_ejemplo.json");
  await fs.writeFile(filepath, JSON.stringify(legajo, null, 2), "utf-8");

  console.log(`✅ Legajo JSON de ejemplo generado: ${filepath}`);
  console.log(`   Simula el contenido de datos_locales/{DNI}/legajo_historico.json`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("🔧 Generador de Archivos de Prueba\n");
  console.log("Creando ejemplos para testing del MVP...\n");

  await ensureExamplesDir();
  await generateExcelExample();
  await generateCsvExample();
  await generatePdfExample();
  await generateJsonLegajoExample();

  console.log("\n✅ Todos los archivos de prueba han sido generados.");
  console.log(`\n📁 Ubicación: ./${EXAMPLES_DIR}/`);
  console.log("\n📋 Pasos para probar:");
  console.log("   1. Ejecuta: bun server.js");
  console.log("   2. Abre: http://localhost:3000");
  console.log("   3. Carga: ./ejemplos/docente_ejemplo.xlsx");
  console.log("   4. Verifica los cálculos en la interfaz");
}

main().catch(console.error);
