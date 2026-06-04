let modalCallback = null;

export function showModal(title, message, confirmLabel, callback) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalMessage").textContent = message;
  document.getElementById("modalConfirmBtn").textContent = confirmLabel || "Confirmar";
  document.getElementById("confirmModal").classList.add("visible");
  modalCallback = callback;
}

export function closeModal() {
  document.getElementById("confirmModal").classList.remove("visible");
  modalCallback = null;
}

export function showInfoModal() {
  document.getElementById("infoModal").classList.add("visible");
}

export function closeInfoModal() {
  document.getElementById("infoModal").classList.remove("visible");
}

export function abrirGraficoModal() {
  document.getElementById("graficoModal").classList.add("visible");
}

export function cerrarGrafico() {
  document.getElementById("graficoModal").classList.remove("visible");
}

document.getElementById("modalConfirmBtn").addEventListener("click", () => {
  if (modalCallback) modalCallback();
  closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeInfoModal(); cerrarGrafico(); }
});
