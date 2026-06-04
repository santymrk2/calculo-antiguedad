import { state } from "./state.js";
import * as utils from "./utils.js";
import * as api from "./api.js";
import * as ui from "./ui.js";
import * as modals from "./modals.js";

// ============================================================
// NAVIGATION
// ============================================================

function irAPagina(page) {
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.toggle("active", p.id === "page-" + page);
  });
  const backNav = document.getElementById("backNav");
  if (page === "detalle") {
    backNav.classList.remove("hidden");
  } else {
    backNav.classList.add("hidden");
    document.getElementById("detalleSubNav").classList.add("hidden");
  }
}
window.irAPagina = irAPagina;

function irADetalleTab(tab) {
  document.querySelectorAll("[data-detalle-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.detalleTab === tab);
  });
  document.querySelectorAll(".detalle-tab").forEach((el) => {
    el.style.display = el.id === "detalleTab" + tab.charAt(0).toUpperCase() + tab.slice(1) ? "" : "none";
  });
}
window.irADetalleTab = irADetalleTab;

// ============================================================
// SEARCH & TEACHERS
// ============================================================

function searchAgente() {
  const input = document.getElementById("dniSearch");
  const q = input.value.trim().replace(/\./g, "");
  state.currentPage = 1;
  if (!q || q.length < 2) {
    ui.renderAgentesPage();
    return;
  }
  const filtered = state.allAgentes.filter(a => {
    const dni = (a.dni || "").replace(/\./g, "");
    return dni.includes(q);
  });
  ui.renderAgentesPage(filtered);
}
window.searchAgente = searchAgente;

function goToPage(page) {
  const input = document.getElementById("dniSearch");
  const q = input.value.trim().replace(/\./g, "");
  const list = q.length >= 2
    ? state.allAgentes.filter(a => (a.dni || "").replace(/\./g, "").includes(q))
    : state.allAgentes;
  const totalPages = Math.ceil(list.length / state.PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  state.currentPage = page;
  ui.renderAgentesPage(list);
}
window.goToPage = goToPage;

async function loadAgente(dni) {
  document.getElementById("loading").style.display = "block";

  try {
    const data = await api.fetchAgente(dni);

    state.currentDni = dni;
    ui.renderResults(data, "view");
    ui.highlightCard(dni);
    document.getElementById("docsPanel").classList.remove("visible");
    document.getElementById("detalleSubNav").classList.remove("hidden");
    irADetalleTab("documentos");
    await ui.loadDocumentosInto(dni);
    irAPagina("detalle");
  } catch (error) {
    utils.showAlert(`Error: ${error.message}`, "error");
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}
window.loadAgente = loadAgente;

async function loadAgentesList() {
  try {
    const data = await api.fetchAgentesList();

    state.allAgentes = data.agentes || [];
    state.currentPage = 1;
    ui.renderAgentesPage();
  } catch (error) {
    console.error("Error al cargar docentes:", error);
    document.getElementById("agentesGrid").innerHTML = `
      <div class="agentes-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div>Error al cargar la lista de docentes</div>
      </div>
    `;
  }
}

// ============================================================
// UPLOAD
// ============================================================

async function uploadFile(file) {
  document.getElementById("loading").style.display = "block";
  const loadingInicio = document.getElementById("loadingInicio");
  if (loadingInicio) loadingInicio.style.display = "block";

  try {
    const data = await api.uploadFile(file);

    state.currentDni = data.dni;
    ui.renderResults(data, "upload");
    ui.highlightCard(data.dni);
    document.getElementById("dniSearch").value = data.dni;
    document.getElementById("detalleSubNav").classList.remove("hidden");
    irADetalleTab("documentos");
    utils.showAlert(
      `Documento procesado: ${data.recordsAdded} per\u00edodo(s) añadido(s)`,
      "success"
    );
    loadAgentesList();
    ui.loadDocumentosInto(data.dni);
    irAPagina("detalle");
  } catch (error) {
    utils.showAlert(`Error: ${error.message}`, "error");
  } finally {
    document.getElementById("loading").style.display = "none";
    if (loadingInicio) loadingInicio.style.display = "none";
  }
}

// ============================================================
// ACTIONS
// ============================================================

function confirmReprocesar() {
  if (!state.currentDni) return;
  modals.showModal(
    "Reprocesar documentos",
    "¿Re-procesar todos los documentos? Esto reemplazará el legajo actual con datos extraídos desde cero.",
    "Reprocesar",
    () => reprocesarDocumentos(state.currentDni)
  );
}
window.confirmReprocesar = confirmReprocesar;

function confirmClearAgente() {
  if (!state.currentDni) return;
  modals.showModal(
    "Limpiar datos",
    `¿Eliminar TODOS los datos del agente DNI ${state.currentDni}? Se borrarán documentos y legajo. No se puede deshacer.`,
    "Eliminar todo",
    () => clearAgente(state.currentDni)
  );
}
window.confirmClearAgente = confirmClearAgente;

function confirmDeleteDocumento(dni, filename) {
  modals.showModal(
    "Eliminar documento",
    `¿Eliminar "${filename}" y sus registros asociados del legajo? Esta acción no se puede deshacer.`,
    "Eliminar",
    () => deleteDocumento(dni, filename)
  );
}
window.confirmDeleteDocumento = confirmDeleteDocumento;

async function reprocesarDocumentos(dni) {
  document.getElementById("loading").style.display = "block";

  try {
    const data = await api.reprocesarDocumentos(dni);

    ui.renderResults(data, "upload");
    utils.showAlert(`Reprocesado: ${data.totalRecords} período(s) en total`, "success");
    ui.loadDocumentosInto(dni);
    loadAgentesList();
  } catch (error) {
    utils.showAlert(`Error: ${error.message}`, "error");
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

async function deleteDocumento(dni, filename) {
  try {
    const data = await api.deleteDocumento(dni, filename);

    utils.showAlert(`Documento eliminado: ${data.registrosRemovidos} registro(s) removido(s)`, "success");

    if (data.legajo) {
      ui.renderResults(data, "view");
    } else {
      irAPagina("inicio");
    }

    ui.loadDocumentosInto(dni);
    loadAgentesList();
  } catch (error) {
    utils.showAlert(`Error: ${error.message}`, "error");
  }
}

async function clearAgente(dni) {
  try {
    await api.clearAgente(dni);

    utils.showAlert(`Datos del agente ${dni} eliminados`, "success");
    irAPagina("inicio");
    document.getElementById("docsPanel").classList.remove("visible");
    state.currentDni = null;
    state.lastData = null;
    loadAgentesList();
  } catch (error) {
    utils.showAlert(`Error: ${error.message}`, "error");
  }
}

function abrirGrafico() {
  if (!state.lastData || !state.lastData.legajo || state.lastData.legajo.length === 0) return;
  modals.abrirGraficoModal();
  ui.renderGrafico(state.lastData.legajo);
}
window.abrirGrafico = abrirGrafico;

// ============================================================
// TOGGLE LICENCIAS
// ============================================================

function updateToggleText() {
  const toggleEl = document.getElementById("toggleLicencias");
  document.getElementById("toggleLicenciasState").textContent = toggleEl.checked ? "ON" : "OFF";
}
window.updateToggleText = updateToggleText;

async function toggleDescontarLicencias() {
  const toggleEl = document.getElementById("toggleLicencias");
  toggleEl.checked = !toggleEl.checked;
  updateToggleText();
  const enabled = toggleEl.checked;

  if (!state.lastData) return;
  const dni = state.lastData.dni;
  try {
    const data = await api.updateConfig(dni, { descontarLicencias: enabled });
    ui.renderResults(data, state.lastData.recordsProcessed !== undefined ? "upload" : "view");
  } catch (e) {
    utils.showAlert("Error al cambiar configuración: " + e.message, "error");
    toggleEl.checked = !enabled;
  }
}
window.toggleDescontarLicencias = toggleDescontarLicencias;

// ============================================================
// EVENT LISTENERS
// ============================================================

// Dropzone — inicio
const dropzoneInicio = document.getElementById("dropzoneInicio");
const fileInputInicio = document.getElementById("fileInputInicio");

dropzoneInicio.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzoneInicio.classList.add("dragover");
});

dropzoneInicio.addEventListener("dragleave", () => {
  dropzoneInicio.classList.remove("dragover");
});

dropzoneInicio.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzoneInicio.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    uploadFile(e.dataTransfer.files[0]);
  }
});

fileInputInicio.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    uploadFile(e.target.files[0]);
  }
});

// Search Enter
document.getElementById("dniSearch").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { searchAgente(); }
});

// Info modal / Grafico modal close
document.getElementById("infoModal").querySelector(".btn-cancel")?.addEventListener("click", () => {
  modals.closeInfoModal();
});

// ============================================================
// INIT
// ============================================================

// Expose modals to window for inline onclick
window.closeModal = modals.closeModal;
window.showInfoModal = modals.showInfoModal;
window.closeInfoModal = modals.closeInfoModal;
window.cerrarGrafico = modals.cerrarGrafico;

document.addEventListener("DOMContentLoaded", () => {
  loadAgentesList();
});
