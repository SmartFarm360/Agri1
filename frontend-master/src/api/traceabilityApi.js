const DEFAULT_API_URL = "http://localhost:5000";

const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

function getAuthToken() {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

async function request(path, { method = "GET", body, headers } = {}) {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && (data.error || data.message)) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function getApiUrl() {
  return API_URL;
}

export const traceabilityApi = {
  uploadTraceabilityImage: (payload) =>
    request(`/api/traceability/media/upload`, { method: "POST", body: payload }),

  listPlantations: () => request(`/api/traceability/plantations`),
  createPlantation: (payload) => request(`/api/traceability/plantations`, { method: "POST", body: payload }),
  deletePlantation: (id) => request(`/api/traceability/plantations/${id}`, { method: "DELETE" }),

  listCrops: () => request(`/api/traceability/crops`),
  createCrop: (payload) => request(`/api/traceability/crops`, { method: "POST", body: payload }),
  deleteCrop: (id) => request(`/api/traceability/crops/${id}`, { method: "DELETE" }),

  listMonitoringRecords: () => request(`/api/traceability/monitoring-records`),
  createMonitoringRecord: (payload) => request(`/api/traceability/monitoring-records`, { method: "POST", body: payload }),
  deleteMonitoringRecord: (id) => request(`/api/traceability/monitoring-records/${id}`, { method: "DELETE" }),

  listVerifications: () => request(`/api/traceability/verifications`),
  createVerification: (payload) => request(`/api/traceability/verifications`, { method: "POST", body: payload }),
  deleteVerification: (id) => request(`/api/traceability/verifications/${id}`, { method: "DELETE" }),

  listHarvests: () => request(`/api/traceability/harvests`),
  createHarvest: (payload) => request(`/api/traceability/harvests`, { method: "POST", body: payload }),
  deleteHarvest: (id) => request(`/api/traceability/harvests/${id}`, { method: "DELETE" }),

  listPackings: () => request(`/api/traceability/packings`),
  createPacking: (payload) => request(`/api/traceability/packings`, { method: "POST", body: payload }),
  deletePacking: (id) => request(`/api/traceability/packings/${id}`, { method: "DELETE" }),
  listSupplierFarmTraces: () => request(`/api/traceability/supplier-traces`),

  listPatches: () => request(`/api/traceability/patches`),
  createPatch: (payload) => request(`/api/traceability/patches`, { method: "POST", body: payload }),
  deletePatchByDbId: (dbId) => request(`/api/traceability/patches/${dbId}`, { method: "DELETE" }),

  listProcessImages: () => request(`/api/traceability/process-images`),
  createProcessImage: (payload) => request(`/api/traceability/process-images`, { method: "POST", body: payload }),
  deleteProcessImage: (id) => request(`/api/traceability/process-images/${id}`, { method: "DELETE" }),

  getTrace: (patchId) => request(`/api/traceability/trace/${encodeURIComponent(patchId)}?expand=full`),
};
