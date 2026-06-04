async function request(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error en la solicitud");
  return data;
}

export async function fetchAgente(dni) {
  return request(`/agente/${dni}`);
}

export async function fetchAgentesList() {
  return request("/agentes");
}

export async function fetchDocumentos(dni) {
  return request(`/agente/${dni}/documentos`);
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  return request("/procesar", { method: "POST", body: formData });
}

export async function deleteDocumento(dni, filename) {
  return request(`/documento/${dni}/${encodeURIComponent(filename)}`, { method: "DELETE" });
}

export async function reprocesarDocumentos(dni) {
  return request(`/reprocesar/${dni}`, { method: "POST" });
}

export async function clearAgente(dni) {
  return request(`/agente/${dni}`, { method: "DELETE" });
}

export async function updateConfig(dni, config) {
  return request(`/agente/${dni}/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}
