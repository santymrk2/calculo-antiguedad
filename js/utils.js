export function formatAntiguedad(obj) {
  if (!obj) return "0";
  return ((obj.years + obj.months / 12 + obj.days / 360) * 100) / 100;
}

export function daysBetween(inicio, fin) {
  const [y1, m1, d1] = inicio.split("-").map(Number);
  const [y2, m2, d2] = fin.split("-").map(Number);
  const start = Date.UTC(y1, m1 - 1, d1);
  const end = Date.UTC(y2, m2 - 1, d2);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export function formatYearsMonthsDays(obj) {
  if (!obj) return "\u2014";
  return `${obj.years || 0}a ${obj.months || 0}m ${obj.days || 0}d`;
}

export function formatDate(iso) {
  if (!iso) return "\u2014";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDateFromEpoch(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function showAlert(message, type) {
  const id = type === "success" ? "alertSuccess" : "alertError";
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.remove("hidden");
  setTimeout(() => { el.classList.add("hidden"); }, 5000);
}
