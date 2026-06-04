import { state } from "./state.js";
import * as utils from "./utils.js";
import * as api from "./api.js";

// ============================================================
// RENDER RESULTS
// ============================================================

export function renderResults(data, mode) {
  state.lastData = data;
  const isView = mode === "view";
  const calc = data.natural;

  const infoEl = document.getElementById("searchResultText");
  const dniStr = data.dni.replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2.$3");
  infoEl.innerHTML = isView
    ? `DNI ${data.dni}<br>${data.nombre || ""} ${data.totalRecords} período${data.totalRecords !== 1 ? "s" : ""}`
    : `DNI ${data.dni}<br>${data.recordsProcessed} procesado${data.recordsProcessed !== 1 ? "s" : ""} / ${data.totalRecords} total`;

  document.getElementById("detalleDni").textContent = `DNI ${dniStr}`;
  document.getElementById("detalleMeta").textContent = `${data.totalRecords} período${data.totalRecords !== 1 ? "s" : ""} · ${data.licencias?.length || 0} licencia${data.licencias?.length !== 1 ? "s" : ""}`;

  document.getElementById("netoYears").textContent = calc.neto.years;
  document.getElementById("netoMonths").textContent = calc.neto.months;
  document.getElementById("netoDaysDetail").textContent = calc.neto.days;
  document.getElementById("netoTotalDias").textContent = calc.neto.total;
  document.getElementById("badgeSinLic").style.display =
    data.descontarLicencias === false ? "" : "none";

  const toggleEl = document.getElementById("toggleLicencias");
  if (toggleEl) {
    toggleEl.checked = data.descontarLicencias !== false;
    document.getElementById("toggleLicenciasState").textContent = toggleEl.checked ? "ON" : "OFF";
  }

  // Licencias table
  const licencias = data.licencias || [];
  const licenciasBody = document.getElementById("licenciasBody");
  licenciasBody.innerHTML = "";
  if (licencias.length > 0) {
    document.getElementById("licenciasCount").textContent = licencias.length + " licencia" + (licencias.length !== 1 ? "s" : "");
    for (const lic of licencias) {
      const dias = utils.daysBetween(lic.inicio, lic.fin);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${utils.formatDate(lic.inicio)}</td>
        <td>${utils.formatDate(lic.fin)}</td>
        <td>${dias}</td>
        <td style="color:var(--color-secondary)">${lic.motivo || "—"}</td>
      `;
      licenciasBody.appendChild(row);
    }
  }

  // Breakdown by role
  const breakdownBody = document.getElementById("breakdownBody");
  breakdownBody.innerHTML = "";
  const roles = Object.entries(calc.byRole);
  document.getElementById("breakdownCount").textContent = roles.length + " situación" + (roles.length !== 1 ? "es" : "");

  for (const [situacion, ant] of roles) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${situacion}</td>
      <td class="text-accent">${utils.formatAntiguedad(ant).toFixed(2)}</td>
      <td>${ant.years}</td>
      <td>${ant.months}</td>
      <td>${ant.days}</td>
    `;
    breakdownBody.appendChild(row);
  }

  if (roles.length === 0) {
    breakdownBody.innerHTML = `<tr><td colspan="5" style="color:var(--color-secondary);">Sin datos</td></tr>`;
    document.getElementById("breakdownFooter").innerHTML = "";
  } else {
    document.getElementById("breakdownFooter").innerHTML = `
      <tr class="table-footer">
        <td>TOTAL</td>
        <td class="text-accent">${utils.formatAntiguedad(calc.neto).toFixed(2)}</td>
        <td>${calc.neto.years}</td>
        <td>${calc.neto.months}</td>
        <td>${calc.neto.days}</td>
      </tr>
    `;
  }

  // Legajo
  const legajoBody = document.getElementById("legajoBody");
  legajoBody.innerHTML = "";
  document.getElementById("legajoCount").textContent = data.legajo.length + " registro" + (data.legajo.length !== 1 ? "s" : "");

  for (const period of data.legajo) {
    const dias = utils.daysBetween(period.inicio, period.fin);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><a href="#" class="date-link">${utils.formatDate(period.inicio)}</a></td>
      <td><a href="#" class="date-link">${utils.formatDate(period.fin)}</a></td>
      <td class="text-accent">${period.situacion_revista || "—"}</td>
      <td style="font-size:11px;color:var(--color-secondary);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${period.origen}">${period.origen}</td>
      <td style="text-align: right">${dias}</td>
    `;
    legajoBody.appendChild(row);
  }
}

// ============================================================
// AGENTES LIST
// ============================================================

export function renderAgentesPage(source) {
  const grid = document.getElementById("agentesGrid");
  const countEl = document.getElementById("agentesCount");
  const pagEl = document.getElementById("agentesPagination");
  const list = source || state.allAgentes;

  if (!list || list.length === 0) {
    grid.innerHTML = !state.allAgentes || state.allAgentes.length === 0
      ? `
      <div class="agentes-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <div>Todav\u00eda no hay docentes registrados.<br>Sub\u00ed un PDF o Excel para empezar.</div>
      </div>`
      : `<div class="agentes-empty"><div>Sin resultados para ese DNI</div></div>`;
    countEl.textContent = source ? "0 resultados" : "Sin registros";
    pagEl.innerHTML = "";
    return;
  }

  const total = list.length;
  const totalPages = Math.ceil(total / state.PAGE_SIZE);
  const start = (state.currentPage - 1) * state.PAGE_SIZE;
  const end = Math.min(start + state.PAGE_SIZE, total);
  const page = list.slice(start, end);

  countEl.textContent = `${total} docente${total !== 1 ? "s" : ""}`;

  grid.innerHTML = "";
  for (const agente of page) {
    const card = document.createElement("div");
    card.className = "agente-card";
    card.dataset.dni = agente.dni;

    const calc = agente.natural;
    const diasEnAnio = 365;
    const anios = ((calc?.neto?.total || 0) / diasEnAnio).toFixed(1);
    card.innerHTML = `
      <div class="agente-card-dni">${agente.dni}</div>
      <div class="agente-card-meta">
        ${agente.totalRecords} per\u00edodo${agente.totalRecords !== 1 ? "s" : ""} &middot; ${anios} a&ntilde;os netos<br>
        ${utils.formatDate(agente.primerPeriodo)} &rarr; ${utils.formatDate(agente.ultimoPeriodo)}
      </div>
      <span class="agente-card-stat">${agente.documentos} documento${agente.documentos !== 1 ? "s" : ""}</span>
    `;

    card.addEventListener("click", () => {
      window.loadAgente(agente.dni);
      document.getElementById("dniSearch").value = agente.dni;
    });

    if (agente.dni === state.currentDni) {
      card.classList.add("active");
    }

    grid.appendChild(card);
  }

  pagEl.innerHTML = `
    <span class="pagination-info">${start + 1}\u2013${end} de ${total}</span>
    <div class="pagination-btns">
      <button class="pagination-btn" onclick="window.goToPage(${state.currentPage - 1})" ${state.currentPage <= 1 ? "disabled" : ""}>Anterior</button>
      <button class="pagination-btn" onclick="window.goToPage(${state.currentPage + 1})" ${state.currentPage >= totalPages ? "disabled" : ""}>Siguiente</button>
    </div>
  `;
}

export function highlightCard(dni) {
  document.querySelectorAll(".agente-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.dni === dni);
  });
}

// ============================================================
// DOCUMENTOS
// ============================================================

export async function loadDocumentosInto(dni) {
  const panel = document.getElementById("docsPanel");
  const list = document.getElementById("docsListBody");
  const count = document.getElementById("docsCount");
  if (!panel) return;

  try {
    const data = await api.fetchDocumentos(dni);

    if (!data.documentos || data.documentos.length === 0) {
      panel.classList.remove("visible");
      return;
    }

    panel.classList.add("visible");
    count.textContent = `${data.documentos.length} doc${data.documentos.length !== 1 ? "s" : ""}`;

    const metaEl = document.getElementById("detalleMeta");
    const periods = state.lastData ? `${state.lastData.totalRecords} período${state.lastData.totalRecords !== 1 ? "s" : ""}` : "";
    const lic = state.lastData?.licencias ? `${state.lastData.licencias.length} licencia${state.lastData.licencias.length !== 1 ? "s" : ""}` : "";
    const docs = `${data.documentos.length} doc${data.documentos.length !== 1 ? "s" : ""}`;
    metaEl.textContent = [periods, lic, docs].filter(Boolean).join(" · ");

    list.innerHTML = "";
    for (const doc of data.documentos) {
      const item = document.createElement("div");
      const displayName = doc.displayName || doc.replace(/^\d+_/, "");
      const uploadedAt = doc.uploadedAt;

      const tsHtml = uploadedAt
        ? `<span class="docs-date" title="${new Date(uploadedAt).toLocaleString()}">${utils.formatDateFromEpoch(uploadedAt)}</span>`
        : `<span class="docs-date" style="color:var(--color-secondary)">—</span>`;

      item.className = "docs-item";
      item.innerHTML = `
        <span class="docs-item-info">
          <span class="docs-item-name">${displayName}</span>
          ${tsHtml}
        </span>
      `;

      const delBtn = document.createElement("button");
      delBtn.className = "text-toggle text-toggle-danger";
      delBtn.textContent = "Eliminar";
      delBtn.addEventListener("click", () => window.confirmDeleteDocumento(dni, doc.name));
      item.appendChild(delBtn);
      list.appendChild(item);
    }
  } catch {
    panel.classList.remove("visible");
  }
}

// ============================================================
// GRÁFICO
// ============================================================

const SIT_COLORS = {
  TITULAR: "#444",
  SUPLENTE: "#777",
  PROVISIONAL: "#999",
};

function getColor(sit) {
  return SIT_COLORS[sit] || "#aaa";
}

function normalizar(sit) {
  if (!sit) return "SIN ESPECIFICAR";
  const s = sit.toUpperCase().trim();
  return s;
}

export function renderGrafico(legajo) {
  const body = document.getElementById("graficoBody");
  if (!legajo || legajo.length === 0) {
    body.innerHTML = '<div class="grafico-vacio">Sin períodos para mostrar</div>';
    return;
  }

  const sorted = [...legajo].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const minDate = sorted[0].inicio;
  const maxDate = sorted.reduce((mx, p) => (p.fin > mx ? p.fin : mx), sorted[0].fin);
  const totalMs = new Date(maxDate) - new Date(minDate) || 1;

  // Agrupar por situación
  const groups = {};
  for (const p of sorted) {
    const sit = normalizar(p.situacion_revista);
    if (!groups[sit]) groups[sit] = [];
    groups[sit].push(p);
  }

  const order = ["TITULAR", "SUPLENTE", "PROVISIONAL"];
  const trackSits = Object.keys(groups).sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  // Escala anual
  const scaleMarks = [];
  const startYear = new Date(minDate).getFullYear();
  const endYear = new Date(maxDate).getFullYear();
  for (let y = startYear; y <= endYear; y++) {
    scaleMarks.push(`${y}-01-01`);
  }

  function pct(dateStr) {
    return ((new Date(dateStr) - new Date(minDate)) / totalMs) * 100;
  }

  let html = '<div class="grafico"><div class="grafico-wrap">';

  html += '<div class="grafico-escala">';
  for (const mark of scaleMarks) {
    const pos = pct(mark);
    const [y] = mark.split("-");
    html += `<span class="grafico-marca" style="left:${pos}%">${y}</span>`;
  }
  html += "</div>";

  for (const sit of trackSits) {
    const periods = groups[sit];
    const subTracks = [];
    for (const p of periods) {
      let placed = false;
      for (const track of subTracks) {
        const last = track[track.length - 1];
        if (p.inicio > last.fin) { track.push(p); placed = true; break; }
      }
      if (!placed) subTracks.push([p]);
    }
    for (const track of subTracks) {
      html += '<div class="grafico-track">';
      html += '<div class="grafico-track-bars">';
      for (const p of track) {
        const left = pct(p.inicio);
        const w = Math.max(((new Date(p.fin) - new Date(p.inicio)) / totalMs) * 100, 0.5);
        const color = getColor(sit);
        const label = `${utils.formatDate(p.inicio)}–${utils.formatDate(p.fin)}`;
        html += `<div class="grafico-bar" style="left:${left}%;width:${w}%;background:${color}" title="${sit} | ${label} | ${p.origen || "—"}">${w > 8 ? label : ""}</div>`;
      }
      html += "</div></div>";
    }
  }

  html += '<div class="grafico-leyenda">';
  for (const sit of trackSits) {
    html += `<div class="grafico-leyenda-item"><span class="grafico-leyenda-swatch" style="background:${getColor(sit)}"></span>${sit}</div>`;
  }
  html += "</div>";

  html += "</div></div>";
  body.innerHTML = html;
}
