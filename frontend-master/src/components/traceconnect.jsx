import { useState, useEffect, useContext, createContext, useRef } from "react";
import {
  FiLock, FiCheckCircle, FiUser, FiLogOut,
  FiHome, FiList, FiBarChart2, FiPackage, FiAlertTriangle,
  FiTrash2, FiEdit2, FiPlus, FiArrowRight, FiMapPin,
  FiCalendar, FiDroplet, FiVideo, FiCamera, FiCheck,
  FiX, FiMail, FiShield, FiStar, FiTrendingUp, FiGrid
} from "react-icons/fi";
import "../styles/traceconnect.css";
import { getApiUrl, traceabilityApi } from "../api/traceabilityApi";

const AuthContext = createContext(null);
const DataContext = createContext(null);
const TODAY = new Date().toISOString().split("T")[0];

const INITIAL_DATA = {
  plantations: [
    { id: "p1", userId: "u1", name: "Green Valley Farm", location: "Pune, Maharashtra", type: "crop", status: "Active", createdAt: "2026-01-10" },
    { id: "p2", userId: "u1", name: "Coastal Shrimp Farm", location: "Vizag, Andhra Pradesh", type: "shrimp", status: "Active", createdAt: "2026-01-12" },
  ],
  crops: [
    { id: "c1", plantationId: "p1", name: "Tomato", variety: "Hybrid-5", sowingDate: "2026-01-15", expectedHarvest: "2026-04-15" },
    { id: "c2", plantationId: "p1", name: "Spinach", variety: "Baby Leaf", sowingDate: "2026-02-01", expectedHarvest: "2026-03-20" },
  ],
  monitoring: [
    { id: "m1", plantationId: "p1", date: "2026-02-05", inputType: "Fertilizer", cropId: "c1", remarks: "Applied NPK 12-12-17" },
    { id: "m2", plantationId: "p1", date: "2026-02-20", inputType: "Irrigation", cropId: "c2", remarks: "Drip irrigation 30min" },
  ],
  verification: [
    { id: "v1", plantationId: "p1", inspectionDate: "2026-03-01", cropId: "c1", health: "Excellent", approved: true },
  ],
  harvests: [
    { id: "h1", plantationId: "p1", harvestDate: "2026-04-01", cropId: "c1", total: 500, unit: "kg", rejected: 20, accepted: 480 },
  ],
  packings: [
    {
      id: "pk1",
      plantationId: "p1",
      harvestId: "h1",
      packingDate: "2026-04-02",
      packingSize: "50kg bag",
      numPackages: 10,
      netWeight: 480,
      warehouse: "Green Warehouse",
      street: "MG Road",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      country: "India",
    },
  ],
  batches: [
    {
      id: "PATCH-ABC123",
      supplierId: "u2",
      packingIds: ["pk1"],
      description: "Premium Tomato Batch",
      totalWeight: 480,
      createdAt: "2026-04-03",
    },
  ],
  processImages: [],
};

const API_URL = getApiUrl();

function toISODate(value) {
  if (!value) return "";
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function safeJson(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getTraceabilityErrorMessage(err) {
  const raw = (err?.message || "").toLowerCase();
  const status = err?.status;

  if (status === 413 || raw.includes("entity too large") || raw.includes("payload too large")) {
    return "Image is too large to upload. Please try again (or reduce image size).";
  }

  if (status === 401 || raw.includes("no token") || raw.includes("token")) {
    return "Your session expired. Please login again.";
  }

  if (raw.includes("no farm found") || raw.includes("create a farm first")) {
    return "No farm found for your account. Please add a Farm first (Dashboard -> Add Farm), then retry.";
  }

  if (raw.includes("failed to fetch") || raw.includes("networkerror")) {
    return "Cannot reach the backend. Ensure it is running on http://localhost:5000.";
  }

  if (raw.includes("not logged in")) {
    return "Please login to MaatiAI to use Traceability.";
  }

  return err?.message || "Something went wrong. Please try again.";
}

function stabilizeTraceabilityViewport(update) {
  if (typeof window === "undefined") {
    update();
    return;
  }

  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const active = document.activeElement;

  if (active instanceof HTMLElement && typeof active.blur === "function") {
    active.blur();
  }

  update();

  requestAnimationFrame(() => {
    window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
    requestAnimationFrame(() => {
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "auto" });
    });
  });
}

function fromDbPlantation(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    name: row.name || "",
    location: row.location_description || "",
    type: "crop",
    status: (row.status || "active").toLowerCase() === "active" ? "Active" : String(row.status),
    createdAt: toISODate(row.created_at),
  };
}

function fromDbCrop(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    name: row.crop_name || "",
    variety: row.crop_variety || "",
    sowingDate: toISODate(row.sowing_date),
    expectedHarvest: toISODate(row.expected_harvest_date),
  };
}

function fromDbMonitoring(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    date: toISODate(row.date),
    inputType: row.input_type || "",
    cropId: row.crop_id === null || row.crop_id === undefined ? "" : Number(row.crop_id),
    remarks: row.remarks || "",
    photoUrl: row.photo_url || "",
  };
}

function fromDbVerification(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    inspectionDate: toISODate(row.inspection_date),
    cropId: row.crop_id === null || row.crop_id === undefined ? "" : Number(row.crop_id),
    health: row.crop_health || "",
    approved: Boolean(row.approved_for_harvest),
  };
}

function fromDbHarvest(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    harvestDate: toISODate(row.harvest_date),
    cropId: row.crop_id === null || row.crop_id === undefined ? "" : Number(row.crop_id),
    total: Number(row.total_quantity) || 0,
    accepted: Number(row.accepted_quantity) || 0,
    rejected: Number(row.rejected_quantity) || 0,
    unit: row.unit || "kg",
  };
}

function fromDbPacking(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    harvestId: row.harvest_id === null || row.harvest_id === undefined ? "" : Number(row.harvest_id),
    packingDate: toISODate(row.packing_date),
    packingSize: row.packing_size || "",
    numPackages: Number(row.number_of_packages) || 0,
    netWeight: Number(row.net_weight) || 0,
    warehouse: row.warehouse_name || "",
    street: row.street || "",
    city: row.city || "",
    state: row.state || "",
    pincode: row.pincode || "",
    country: row.country || "",
  };
}

function fromDbProcessImage(row) {
  return {
    id: Number(row.id),
    plantationId: Number(row.plantation_id),
    stage: row.stage || "",
    name: row.process_name || "",
    date: toISODate(row.created_at),
    imageUrl: row.image_url || "",
  };
}

function fromDbPatch(row) {
  const items = safeJson(row.items, []);
  const packingIds = Array.isArray(items)
    ? items
        .map((it) => it?.packing_id ?? it?.packingId)
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n))
    : [];

  return {
    id: row.patch_id,
    dbId: Number(row.id),
    supplierId: Number(row.user_id),
    packingIds,
    description: row.description || "",
    totalWeight: Number(row.total_weight) || 0,
    unit: row.unit || "kg",
    createdAt: toISODate(row.created_at),
  };
}

async function requestBackCameraStream() {
  const base = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  };

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { ...base, facingMode: { exact: "environment" } },
      audio: false,
    });
  } catch {
    return await navigator.mediaDevices.getUserMedia({
      video: { ...base, facingMode: { ideal: "environment" } },
      audio: false,
    });
  }
}

async function applyCameraTuning(track) {
  if (!track?.getCapabilities || !track?.applyConstraints) return;
  const caps = track.getCapabilities();
  const advanced = [];

  if (caps.focusMode?.includes("continuous")) advanced.push({ focusMode: "continuous" });
  if (caps.exposureMode?.includes("continuous")) advanced.push({ exposureMode: "continuous" });
  if (caps.whiteBalanceMode?.includes("continuous")) advanced.push({ whiteBalanceMode: "continuous" });

  if (!advanced.length) return;
  try {
    await track.applyConstraints({ advanced });
  } catch {
    // ignore
  }
}

function stopMediaStream(stream) {
  if (!stream) return;
  try {
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    // ignore
  }
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

function formatCoords(value) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "-";
}

function formatDateTime(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const weekday = lookup.weekday || "";
  const day = lookup.day || "";
  const month = lookup.month || "";
  const year = lookup.year || "";
  const hour = lookup.hour || "";
  const minute = lookup.minute || "";
  const second = lookup.second || "";
  const dayPeriod = lookup.dayPeriod || "";
  return `${weekday}, ${day}/${month}/${year}, ${hour}:${minute}:${second} ${dayPeriod}`;
}

function getFarmLocationLabel(farm) {
  if (!farm) return "";

  const namedLocation = String(farm.farm_location || farm.location || "").trim();
  if (namedLocation) return namedLocation;
  return "";
}

function formatReverseLocationName(payload) {
  const address = payload?.raw?.address || {};
  const primary =
    address.village ||
    address.town ||
    address.city ||
    address.hamlet ||
    address.suburb ||
    address.county ||
    "";
  const secondary = address.state_district || address.district || "";
  const state = address.state || "";

  const parts = [primary, secondary, state]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (parts.length) {
    return Array.from(new Set(parts)).join(", ");
  }

  return String(payload?.display_name || "").trim();
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxHeight, maxLines) {
  const words = String(text || "").split(" ");
  let line = "";
  const lines = [];

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(line.trim());
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  if (line.trim()) lines.push(line.trim());

  let clipped = lines;
  if (maxLines && lines.length > maxLines) {
    clipped = lines.slice(0, maxLines);
    let last = clipped[maxLines - 1];
    while (ctx.measureText(last + "...").width > maxWidth && last.length > 0) {
      last = last.slice(0, -1).trim();
    }
    clipped[maxLines - 1] = last ? `${last}...` : "...";
  }

  let cursorY = y;
  for (let i = 0; i < clipped.length; i++) {
    if (maxHeight && cursorY + lineHeight > y + maxHeight) break;
    ctx.fillText(clipped[i], x, cursorY);
    cursorY += lineHeight;
  }
}

function drawMapPlaceholder(ctx, x, y, size, radius) {
  ctx.save();
  drawRoundedRect(ctx, x, y, size, size, radius);
  ctx.fillStyle = "rgba(15, 22, 30, 0.85)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = `${Math.max(10, size * 0.12)}px Manrope, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Map unavailable", x + size / 2, y + size / 2);
  ctx.restore();
}

function drawGeoOverlay(ctx, width, topY, panelHeight, details) {
  const padding = Math.round(width * 0.04);
  const boxHeight = panelHeight;
  const boxY = topY;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, boxY, width, boxHeight);
  ctx.restore();

  const gradient = ctx.createLinearGradient(0, boxY, 0, boxY + boxHeight);
  gradient.addColorStop(0, "rgba(0,0,0,0.0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, boxY, width, boxHeight);

  const mapSize = Math.max(80, Math.min(Math.round(boxHeight * 0.72), boxHeight - padding * 2));
  const mapRadius = Math.round(mapSize * 0.12);
  const mapX = padding;
  const mapY = boxY + Math.round((boxHeight - mapSize) / 2);
  drawMapPlaceholder(ctx, mapX, mapY, mapSize, mapRadius);

  const lineX = mapX + mapSize + Math.round(padding * 0.6);
  const lineY = mapY + 8;
  const lineHeight = mapSize - 16;
  ctx.save();
  ctx.strokeStyle = "rgba(178, 255, 70, 0.95)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(178, 255, 70, 0.45)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(lineX, lineY);
  ctx.lineTo(lineX, lineY + lineHeight);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const nameFont = Math.max(16, Math.round(width * 0.026));
  const textFont = Math.max(14, Math.round(width * 0.022));
  const smallFont = Math.max(13, Math.round(width * 0.02));

  let cursorY = mapY;
  const textX = lineX + Math.round(padding * 0.7);

  ctx.font = `600 ${nameFont}px Manrope, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(details.name, textX, cursorY);

  cursorY += nameFont + 10;
  ctx.font = `500 ${textFont}px Manrope, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(details.dateTime, textX, cursorY);

  cursorY += textFont + 10;
  const addressMaxHeight = mapY + mapSize - cursorY - (smallFont + 8);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  wrapText(ctx, details.address, textX, cursorY, width - textX - padding, textFont + 6, addressMaxHeight, 4);

  const coordsLine = `Lat: ${formatCoords(details.lat)}, Long: ${formatCoords(details.lon)}`;
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = `500 ${smallFont}px Manrope, sans-serif`;
  ctx.fillText(coordsLine, textX, mapY + mapSize - smallFont - 2);
}

function DataProvider({ children }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  const [plantations, setPlantations] = useState([]);
  const [crops, setCrops] = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [verification, setVerification] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [packings, setPackings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [processImages, setProcessImages] = useState([]);

  const run = async (fn, fallbackMessage) => {
    try {
      setBackendError("");
      return await fn();
    } catch (err) {
      const msg = getTraceabilityErrorMessage(err) || fallbackMessage || "Request failed";
      setBackendError(msg);
      throw err;
    }
  };

  const fetchMyFarms = async () => {
    const token = (() => {
      try {
        return localStorage.getItem("token") || "";
      } catch {
        return "";
      }
    })();

    if (!token) throw new Error("Missing auth token. Please login again.");

    const res = await fetch(`${API_URL}/api/farm/my`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || `Failed to load farms (${res.status})`);
    }
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    if (!user?.id) {
      setFarms([]);
      setSelectedFarmId(null);
      setPlantations([]);
      setCrops([]);
      setMonitoring([]);
      setVerification([]);
      setHarvests([]);
      setPackings([]);
      setBatches([]);
      setProcessImages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setBackendError("");

    (async () => {
      const [
        myFarms,
        pl,
        cr,
        mon,
        ver,
        har,
        pk,
        pt,
        imgs,
      ] = await Promise.all([
        fetchMyFarms(),
        traceabilityApi.listPlantations(),
        traceabilityApi.listCrops(),
        traceabilityApi.listMonitoringRecords(),
        traceabilityApi.listVerifications(),
        traceabilityApi.listHarvests(),
        traceabilityApi.listPackings(),
        traceabilityApi.listPatches(),
        traceabilityApi.listProcessImages(),
      ]);

      if (cancelled) return;
      setFarms(myFarms || []);
      const defaultFarmId = Number(myFarms?.[0]?.farm_id) || null;
      setSelectedFarmId((prev) => {
        const prevId = Number(prev);
        const hasPrev = (myFarms || []).some(
          (farm) => Number(farm?.farm_id) === prevId,
        );

        if (hasPrev) return prevId;
        return defaultFarmId;
      });
      setPlantations((pl || []).map(fromDbPlantation));
      setCrops((cr || []).map(fromDbCrop));
      setMonitoring((mon || []).map(fromDbMonitoring));
      setVerification((ver || []).map(fromDbVerification));
      setHarvests((har || []).map(fromDbHarvest));
      setPackings((pk || []).map(fromDbPacking));
      setBatches((pt || []).map(fromDbPatch));
      setProcessImages((imgs || []).map(fromDbProcessImage));
    })()
      .catch((err) => {
        if (cancelled) return;
        setBackendError(err?.message || "Failed to load traceability data");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const addPlantation = (p) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const farmIdNum = Number(selectedFarmId);
      if (!Number.isInteger(farmIdNum)) {
        throw new Error("No farm found for this user. Create a Farm first, then retry.");
      }
      const farm = farms.find((f) => Number(f?.farm_id) === farmIdNum) || null;
      const created = await traceabilityApi.createPlantation({
        farm_id: farmIdNum,
        name: p.name,
        location_description: p.location,
        polygon_coordinates: farm?.polygon_coordinates,
        status: "active",
      });
      stabilizeTraceabilityViewport(() => {
        setPlantations((prev) => [...prev, fromDbPlantation(created)]);
      });
      return created;
    }, "Failed to create plantation");
  };

  const delPlantation = (pid) => {
    return run(async () => {
      await traceabilityApi.deletePlantation(pid);
      stabilizeTraceabilityViewport(() => {
        setPlantations((prev) => prev.filter((x) => x.id !== pid));
        setCrops((prev) => prev.filter((x) => x.plantationId !== pid));
        setMonitoring((prev) => prev.filter((x) => x.plantationId !== pid));
        setVerification((prev) => prev.filter((x) => x.plantationId !== pid));
        setHarvests((prev) => prev.filter((x) => x.plantationId !== pid));
        setPackings((prev) => prev.filter((x) => x.plantationId !== pid));
        setProcessImages((prev) => prev.filter((x) => x.plantationId !== pid));
      });
      return true;
    }, "Failed to delete plantation");
  };

  const addCrop = (c) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createCrop({
        plantation_id: Number(c.plantationId),
        crop_name: c.name,
        crop_variety: c.variety || null,
        sowing_date: c.sowingDate || null,
        expected_harvest_date: c.expectedHarvest || null,
      });
      stabilizeTraceabilityViewport(() => {
        setCrops((prev) => [...prev, fromDbCrop(created)]);
      });
      return created;
    }, "Failed to create crop");
  };

  const delCrop = (cid) => {
    return run(async () => {
      await traceabilityApi.deleteCrop(cid);
      stabilizeTraceabilityViewport(() => {
        setCrops((prev) => prev.filter((x) => x.id !== cid));
      });
      return true;
    }, "Failed to delete crop");
  };

  const addMonitoring = (m) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createMonitoringRecord({
        plantation_id: Number(m.plantationId),
        crop_id: m.cropId ? Number(m.cropId) : null,
        date: m.date,
        input_type: m.inputType,
        remarks: m.remarks || null,
        photo_url: m.photoUrl || null,
      });
      stabilizeTraceabilityViewport(() => {
        setMonitoring((prev) => [...prev, fromDbMonitoring(created)]);
      });
      return created;
    }, "Failed to create monitoring record");
  };

  const delMonitoring = (mid) => {
    return run(async () => {
      await traceabilityApi.deleteMonitoringRecord(mid);
      stabilizeTraceabilityViewport(() => {
        setMonitoring((prev) => prev.filter((x) => x.id !== mid));
      });
      return true;
    }, "Failed to delete monitoring record");
  };

  const addVerification = (v) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createVerification({
        plantation_id: Number(v.plantationId),
        crop_id: v.cropId ? Number(v.cropId) : null,
        inspection_date: v.inspectionDate,
        crop_health: v.health,
        approved_for_harvest: Boolean(v.approved),
      });
      stabilizeTraceabilityViewport(() => {
        setVerification((prev) => [...prev, fromDbVerification(created)]);
      });
      return created;
    }, "Failed to create verification");
  };

  const delVerification = (vid) => {
    return run(async () => {
      await traceabilityApi.deleteVerification(vid);
      stabilizeTraceabilityViewport(() => {
        setVerification((prev) => prev.filter((x) => x.id !== vid));
      });
      return true;
    }, "Failed to delete verification");
  };

  const addHarvest = (h) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createHarvest({
        plantation_id: Number(h.plantationId),
        crop_id: h.cropId ? Number(h.cropId) : null,
        harvest_date: h.harvestDate,
        total_quantity: Number(h.total) || 0,
        accepted_quantity: Number(h.accepted) || 0,
        rejected_quantity: Number(h.rejected) || 0,
        unit: h.unit || "kg",
      });
      stabilizeTraceabilityViewport(() => {
        setHarvests((prev) => [...prev, fromDbHarvest(created)]);
      });
      return created;
    }, "Failed to create harvest");
  };

  const delHarvest = (hid) => {
    return run(async () => {
      await traceabilityApi.deleteHarvest(hid);
      stabilizeTraceabilityViewport(() => {
        setHarvests((prev) => prev.filter((x) => x.id !== hid));
      });
      return true;
    }, "Failed to delete harvest");
  };

  const addPacking = (pk) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createPacking({
        plantation_id: Number(pk.plantationId),
        harvest_id: pk.harvestId ? Number(pk.harvestId) : null,
        packing_date: pk.packingDate,
        number_of_packages: Number(pk.numPackages) || 0,
        net_weight: Number(pk.netWeight) || 0,
        packing_size: pk.packingSize || null,
        warehouse_name: pk.warehouse || null,
        street: pk.street || null,
        city: pk.city || null,
        state: pk.state || null,
        pincode: pk.pincode || null,
        country: pk.country || null,
      });
      stabilizeTraceabilityViewport(() => {
        setPackings((prev) => [...prev, fromDbPacking(created)]);
      });
      return created;
    }, "Failed to create packing");
  };

  const delPacking = (pkid) => {
    return run(async () => {
      await traceabilityApi.deletePacking(pkid);
      stabilizeTraceabilityViewport(() => {
        setPackings((prev) => prev.filter((x) => x.id !== pkid));
      });
      return true;
    }, "Failed to delete packing");
  };

  const addBatch = (b) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const items = Array.isArray(b.items) && b.items.length > 0
        ? b.items
        : (b.packingIds || []).map((pid) => {
            const packing = packings.find((p) => p.id === pid);
            const harvest = harvests.find((h) => h.id === packing?.harvestId);
            return {
              packing_id: pid,
              harvest_id: packing?.harvestId,
              crop_id: harvest?.cropId,
              plantation_id: packing?.plantationId,
            };
          });

      const created = await traceabilityApi.createPatch({
        patch_id: b.id,
        description: b.description || null,
        total_weight: Number(b.totalWeight) || 0,
        unit: b.unit || "kg",
        items,
      });
      stabilizeTraceabilityViewport(() => {
        setBatches((prev) => [...prev, fromDbPatch(created)]);
      });
      return created;
    }, "Failed to create patch");
  };

  const delBatch = (patchId) => {
    return run(async () => {
      const patch = batches.find((x) => x.id === patchId);
      if (!patch?.dbId) throw new Error("Patch record not found for delete.");
      await traceabilityApi.deletePatchByDbId(patch.dbId);
      stabilizeTraceabilityViewport(() => {
        setBatches((prev) => prev.filter((x) => x.id !== patchId));
      });
      return true;
    }, "Failed to delete patch");
  };

  const addProcessImage = (img) => {
    return run(async () => {
      if (!user?.id) throw new Error("Not logged in");
      const created = await traceabilityApi.createProcessImage({
        plantation_id: Number(img.plantationId),
        stage: img.stage,
        process_name: img.name,
        image_url: img.imageUrl,
      });
      stabilizeTraceabilityViewport(() => {
        setProcessImages((prev) => [...prev, fromDbProcessImage(created)]);
      });
      return created;
    }, "Failed to create process image");
  };

  const delProcessImage = (iid) => {
    return run(async () => {
      await traceabilityApi.deleteProcessImage(iid);
      stabilizeTraceabilityViewport(() => {
        setProcessImages((prev) => prev.filter((x) => x.id !== iid));
      });
      return true;
    }, "Failed to delete process image");
  };

  return (
    <DataContext.Provider
      value={{
        loading,
        backendError,
        farms,
        selectedFarmId,
        setSelectedFarmId,
        plantations,
        crops,
        monitoring,
        verification,
        harvests,
        packings,
        batches,
        processImages,
        addPlantation,
        delPlantation,
        addCrop,
        delCrop,
        addMonitoring,
        delMonitoring,
        addVerification,
        delVerification,
        addHarvest,
        delHarvest,
        addPacking,
        delPacking,
        addBatch,
        delBatch,
        addProcessImage,
        delProcessImage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = (() => {
        try {
          return localStorage.getItem("token") || "";
        } catch {
          return "";
        }
      })();

      if (!token) {
        if (!cancelled) setUser(null);
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || `Failed to load profile (${res.status})`);

      // Traceability uses grower/supplier while auth stores farmer/supplier roles.
      const role = data?.role === "supplier" ? "supplier" : "grower";
      const u = {
        id: data?.user_id,
        name: data?.name || "User",
        email: data?.email || "",
        role,
        rawRole: data?.role,
      };
      if (!cancelled) setUser(u);
    })()
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userRole");
    } catch {
      // ignore
    }
  };

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}

function useAuth() {
  return useContext(AuthContext);
}

function useData() {
  return useContext(DataContext);
}

function useRouter() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");
  useEffect(() => {
    const fn = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  const navigate = (path) => { window.location.hash = path; };
  return { route, navigate };
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (message, type = "success") => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  return { toasts, toast };
}

function Toasts({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span className="toast-icon">{t.type === "success" ? <FiCheck /> : <FiAlertTriangle />}</span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

const CROP_OPTIONS = [
  "Wheat",
  "Rice",
  "Lettuce",
  "Corn",
  "Tomato",
  "Brinjal",
  "Spinach",
  "Green Gram",
  "Cabbage",
  "Cauliflower",
  "Carrot",
  "Beetroot",
  "Okra",
  "French Beans",
  "Coriander",
  "Fenugreek",
  "Capsicum",
  "Other",
];
const SHRIMP_OPTIONS = ["Vannamei Shrimp", "Tiger Prawn", "Scampi", "Giant Freshwater Prawn", "Other"];
const MONITORING_TYPES = ["Fertilizer", "Pesticide", "Irrigation", "Organic Compost", "Biofertilizer", "Soil Treatment", "Other"];
const SHRIMP_MONITORING = ["Water Quality", "Feed", "Disease Check", "Aeration", "Salinity Check", "Oxygen Level", "Other"];
const HEALTH_OPTIONS = ["Excellent", "Good", "Moderate", "Poor"];
const UNIT_OPTIONS = ["kg", "ton", "count"];

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-box">
        <button className="modal-close" onClick={onCancel} type="button"><FiX /></button>
        <div className="confirm-icon"><FiAlertTriangle /></div>
        <h3>Confirm Delete</h3>
        <p className="muted">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = (message) => new Promise((resolve) => setState({ message, resolve }));
  const dialog = state ? (
    <ConfirmDialog
      message={state.message}
      onConfirm={() => { state.resolve(true); setState(null); }}
      onCancel={() => { state.resolve(false); setState(null); }}
    />
  ) : null;
  return { confirm, dialog };
}

function LoginRequired() {
  return (
    <div className="page-container">
      <div className="card" style={{ textAlign: "center" }}>
        <h2>Login Required</h2>
        <p className="muted">Please login to MaatiAI to use Traceability.</p>
        <a className="btn btn-primary" href="/login">Go to Login</a>
      </div>
    </div>
  );
}

function Header({ route, navigate }) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!user) return null;
  const links = user.role === "grower"
    ? [{ label: "Dashboard", path: "/grower", icon: <FiHome /> }, { label: "Plantations", path: "/plantations", icon: <FiList /> }, { label: "Reports", path: "/reports", icon: <FiBarChart2 /> }]
    : [{ label: "Dashboard", path: "/supplier", icon: <FiHome /> }, { label: "Reports", path: "/reports", icon: <FiBarChart2 /> }];
  return (
    <header className="app-header">
      <button className="brand" onClick={() => navigate(user.role === "grower" ? "/grower" : "/supplier")}>
        <span className="brand-icon"><FiGrid /></span>
        <span>Seed-to-Batch</span>
      </button>
      <nav className="header-nav">
        {links.map((l) => (
          <button key={l.path} className={`nav-pill ${route === l.path ? "active" : ""}`} onClick={() => navigate(l.path)}>
            {l.icon} {l.label}
          </button>
        ))}
        <div className="profile-menu-wrap" ref={menuRef}>
          <button className={`profile-trigger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen((x) => !x)}>
            <span className="profile-avatar"><FiUser /></span>
          </button>
          {menuOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user-info">
                <span className="dropdown-name">{user.name}</span>
                <span className="dropdown-role badge-chip">{user.role}</span>
              </div>
              <div className="dropdown-divider" />
              <button className="profile-item" onClick={() => { setMenuOpen(false); navigate("/profile"); }}>
                <FiUser /> Profile
              </button>
              <button className="profile-item danger" onClick={() => { setMenuOpen(false); signOut(); navigate("/"); }}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrap ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function GrowerDashboard({ navigate, toast }) {
  const { user } = useAuth();
  const {
    plantations,
    crops,
    harvests,
    packings,
    addPlantation,
    delPlantation,
    backendError,
    farms,
    selectedFarmId,
    setSelectedFarmId,
  } = useData();
  const { confirm, dialog } = useConfirm();
  const [form, setForm] = useState({ type: "crop", name: "", location: "" });
  const [resolvedFarmLocation, setResolvedFarmLocation] = useState("");
  const mine = plantations;
  const mineIds = mine.map((p) => p.id);
  const totalHarvested = harvests.filter((h) => mineIds.includes(h.plantationId)).reduce((s, h) => s + (h.accepted || 0), 0);
  const selectedFarm =
    farms.find((farm) => Number(farm?.farm_id) === Number(selectedFarmId)) ||
    farms[0] ||
    null;
  const activeFarmName = selectedFarm?.farm_name || "Farm";
  const baseFarmLocation = getFarmLocationLabel(selectedFarm);
  const activeFarmLocation = baseFarmLocation || resolvedFarmLocation;
  const activeFarmIndex = selectedFarm
    ? farms.findIndex((farm) => Number(farm?.farm_id) === Number(selectedFarm?.farm_id)) + 1
    : 0;
  const registeredFarmLabel = `${farms.length} registered farm${farms.length === 1 ? "" : "s"}`;

  useEffect(() => {
    let cancelled = false;

    if (baseFarmLocation) {
      setResolvedFarmLocation("");
      return undefined;
    }

    const latitude = Number(selectedFarm?.latitude);
    const longitude = Number(selectedFarm?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setResolvedFarmLocation("");
      return undefined;
    }

    fetch(
      `${API_URL}/api/location/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
      { credentials: "include" }
    )
      .then((res) => res.json().catch(() => null))
      .then((payload) => {
        if (cancelled) return;
        const locationName = formatReverseLocationName(payload);
        setResolvedFarmLocation(locationName);
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedFarmLocation("");
      });

    return () => {
      cancelled = true;
    };
  }, [baseFarmLocation, selectedFarm?.farm_id, selectedFarm?.latitude, selectedFarm?.longitude]);

  useEffect(() => {
    setForm((prev) => {
      const nextLocation = activeFarmLocation || "";
      if (prev.location === nextLocation) return prev;
      return { ...prev, location: nextLocation };
    });
  }, [activeFarmLocation]);

  const create = async () => {
    if (!form.name || !form.location) {
      toast("Please fill in plantation name and location", "error");
      return;
    }
    try {
      await addPlantation({ ...form, status: "Active" });
      stabilizeTraceabilityViewport(() => {
        setForm({ type: "crop", name: "", location: activeFarmLocation || "" });
        toast("Plantation created successfully!", "success");
      });
    } catch (e) {
      toast(getTraceabilityErrorMessage(e) || "Failed to create plantation", "error");
    }
  };

  const remove = async (id) => {
    const ok = await confirm("Delete this plantation and all its associated data?");
    if (!ok) return;
    try {
      await delPlantation(id);
      toast("Plantation deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e) || "Failed to delete plantation", "error");
    }
  };

  return (
      <div className="page-container">
        {dialog}
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">Grower Workspace</div>
          <h1>Grower Dashboard</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user?.name}. Keep track of plantations, crop flow,
            harvest numbers, and packing readiness from one clean view.
          </p>
        </div>
        {farms.length > 0 && (
          <div className="dashboard-active-farm">
            <div className="dashboard-active-label">Active Farm</div>
            {farms.length > 1 ? (
              <div className="dashboard-active-select-wrap">
                <FiMapPin />
                <select
                  className="dashboard-active-select"
                  value={selectedFarm ? Number(selectedFarm.farm_id) : ""}
                  onChange={(e) => setSelectedFarmId(Number(e.target.value) || null)}
                >
                  {farms.map((farm, index) => (
                    <option key={farm.farm_id} value={farm.farm_id}>
                      {`Farm ${index + 1} (${farm.farm_name || "Unnamed Farm"})`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="dashboard-active-name">
                <FiMapPin />
                <span>{`Farm ${activeFarmIndex || 1} (${activeFarmName})`}</span>
              </div>
            )}
            <div className="dashboard-active-meta">{registeredFarmLabel}</div>
            {activeFarmLocation && (
              <div className="dashboard-active-meta">{activeFarmLocation}</div>
            )}
          </div>
        )}
      </div>

      <div className="stats-row">
        <StatCard icon={<FiGrid />} label="Plantations" value={mine.length} color="green" />
        <StatCard icon={<FiStar />} label="Crops" value={crops.filter((c) => mineIds.includes(c.plantationId)).length} color="amber" />
        <StatCard icon={<FiTrendingUp />} label="Harvested (kg)" value={totalHarvested} color="blue" />
        <StatCard icon={<FiPackage />} label="Packings" value={packings.filter((p) => mineIds.includes(p.plantationId)).length} color="purple" />
      </div>

      <div className="card">
        <div className="card-title"><FiPlus /> Add New Plantation</div>
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Production Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="crop">Crop Farming</option>
              <option value="shrimp">Shrimp / Prawn Aquaculture</option>
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Plantation Name</label>
            <input className="input" placeholder={form.type === "shrimp" ? "e.g. Coastal Prawn Farm" : "e.g. Green Valley Farm"} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Location</label>
            <input
              className="input"
              placeholder="Auto-filled from selected farm"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={create}><FiPlus /> Create</button>
          </div>
        </div>
      </div>

      {mine.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FiGrid /></div>
          <p>No plantations yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="card-grid">
          {mine.map((p) => (
            <div key={p.id} className="plantation-card">
              <div className="plantation-card-top">
                <span className={`type-badge ${p.type === "shrimp" ? "shrimp" : "crop"}`}>
                  {p.type === "shrimp" ? "Aquaculture" : "Crop Farming"}
                </span>
                <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); remove(p.id); }} title="Delete"><FiTrash2 /></button>
              </div>
              <h4>{p.name}</h4>
              <p className="plantation-location"><FiMapPin /> {p.location}</p>
              <p className="plantation-date"><FiCalendar /> Created {p.createdAt}</p>
              <button className="btn btn-outline full-width mt" onClick={() => navigate(`/plantation/${p.id}`)}>
                Open Plantation <FiArrowRight />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlantationsPage({ navigate, toast }) {
  const { user } = useAuth();
  const { plantations, delPlantation } = useData();
  const { confirm, dialog } = useConfirm();
  const mine = plantations;

  const remove = async (id) => {
    const ok = await confirm("Delete this plantation?");
    if (!ok) return;
    try {
      await delPlantation(id);
      toast("Deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };

  return (
    <div className="page-container">
      {dialog}
      <div className="page-header">
        <div><h1>All Plantations</h1><p className="page-subtitle">Manage all your registered plantations</p></div>
        <button className="btn btn-primary" onClick={() => navigate("/grower")}><FiPlus /> New Plantation</button>
      </div>
      {mine.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><FiGrid /></div><p>No plantations yet.</p></div>
      ) : (
        <div className="card-grid">
          {mine.map((p) => (
            <div key={p.id} className="plantation-card">
              <div className="plantation-card-top">
                <span className={`type-badge ${p.type === "shrimp" ? "shrimp" : "crop"}`}>{p.type === "shrimp" ? "Aquaculture" : "Crop Farming"}</span>
                <button className="icon-btn danger" onClick={() => remove(p.id)} title="Delete"><FiTrash2 /></button>
              </div>
              <h4>{p.name}</h4>
              <p className="plantation-location"><FiMapPin /> {p.location}</p>
              <p className="plantation-date"><FiCalendar /> {p.createdAt}</p>
              <button className="btn btn-outline full-width mt" onClick={() => navigate(`/plantation/${p.id}`)}>Open <FiArrowRight /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkflowSection({ title, children }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {children}
    </div>
  );
}

function PlantationDetail({ plantationId, toast }) {
  const { plantations, crops, monitoring, verification, harvests, packings, processImages, addCrop, delCrop, addMonitoring, delMonitoring, addVerification, delVerification, addHarvest, delHarvest, addPacking, delPacking, addProcessImage, delProcessImage } = useData();
  const { confirm, dialog } = useConfirm();
  const [step, setStep] = useState(0);
  const plantationIdNum = Number(plantationId);
  const plantation = plantations.find((p) => p.id === plantationIdNum);
  const pCrops = crops.filter((c) => c.plantationId === plantationIdNum);
  const pMon = monitoring.filter((m) => m.plantationId === plantationIdNum);
  const pVer = verification.filter((v) => v.plantationId === plantationIdNum);
  const pHar = harvests.filter((h) => h.plantationId === plantationIdNum);
  const pPack = packings.filter((pk) => pk.plantationId === plantationIdNum);
  const pImgs = processImages.filter((img) => img.plantationId === plantationIdNum);
  if (!plantation) return <div className="page-container"><div className="empty-state">Plantation not found.</div></div>;
  const isShrimp = plantation.type === "shrimp";
  const L = { crop: isShrimp ? "Pond" : "Crop", crops: isShrimp ? "Ponds" : "Crops", variety: isShrimp ? "Hatchery / Seed Batch" : "Variety", options: isShrimp ? SHRIMP_OPTIONS : CROP_OPTIONS, monitoring: isShrimp ? SHRIMP_MONITORING : MONITORING_TYPES };
  const unlocked = [true, pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0];
  const done = [pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0, pPack.length > 0];
  const names = [L.crops, "Monitoring", "Verification", "Harvest", "Packing"];
  const completedStages = done.filter(Boolean).length;
  const totalStages = names.length;
  const progressPercent = Math.round((completedStages / totalStages) * 100);
  const allStagesComplete = completedStages === totalStages;
  const stageImages = pImgs.filter((x) => x.imageUrl);
  const stageGroups = stageImages.reduce((acc, img) => {
    const key = img.stage || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(img);
    return acc;
  }, {});

  const openStep = (i) => {
    if (!unlocked[i]) {
      toast(`Complete ${names[i - 1]} first`, "error");
      return;
    }
    setStep(i);
  };

  return (
    <div className="page-container">
      {dialog}
      <div className="plantation-hero">
        <div className="plantation-hero-copy">
          <div className="plantation-kicker">Plantation Lifecycle</div>
          <h1>{plantation.name}</h1>
          <div className="plantation-meta">
            <span className="plantation-meta-item"><FiMapPin /> {plantation.location}</span>
            <span className="status-chip active"><FiCheckCircle /> Active</span>
          </div>
        </div>
      </div>

      {stageImages.length > 0 && (
        <div className="card">
          <h3>Stage-wise Photos</h3>
          {Object.keys(stageGroups).map((stageKey) => (
            <div key={stageKey} className="gallery-group">
              <h4>{stageKey}</h4>
              <div className="tc-photo-grid">
                {stageGroups[stageKey].map((img) => (
                  <a key={img.id} className="tc-photo" href={img.imageUrl} target="_blank" rel="noreferrer">
                    <img src={img.imageUrl} alt={`${stageKey} ${img.name}`} />
                    <div className="tc-photo-meta">
                      <div className="tc-photo-title">{img.name}</div>
                      <div className="tc-photo-sub">{img.date}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className={`stage-progress-card ${allStagesComplete ? "complete" : ""}`}>
        <div className="stage-progress-head">
          <div>
            <div className="stage-progress-kicker">Workflow Progress</div>
            <div className="stage-progress-title">
              {allStagesComplete
                ? "All stages completed"
                : `${completedStages} of ${totalStages} stages completed`}
            </div>
          </div>
          <div className={`stage-progress-badge ${allStagesComplete ? "complete" : ""}`}>
            {allStagesComplete ? <FiCheckCircle /> : <span>{progressPercent}%</span>}
          </div>
        </div>
        <div className="stage-progress-meter">
          <div className="stage-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="stage-progress-caption">
          {allStagesComplete
            ? "Great work. This plantation has completed every stage successfully."
            : `Complete ${names[Math.min(completedStages, totalStages - 1)]} to move forward.`}
        </div>
      </div>
      <div className="step-bar">
        {names.map((n, i) => (
          <button key={n} className={`step-btn ${step === i ? "active" : ""} ${done[i] ? "done" : ""} ${!unlocked[i] ? "locked" : ""}`} onClick={() => openStep(i)}>
            <span className="step-indicator">
              {done[i] ? <FiCheckCircle /> : !unlocked[i] ? <FiLock /> : <span className="step-num">{i + 1}</span>}
            </span>
            <span>{n}</span>
          </button>
        ))}
      </div>

      {step === 0 && (
        <CropsStep
          L={L}
          pCrops={pCrops}
          addCrop={addCrop}
          delCrop={delCrop}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
        />
      )}
      {step === 1 && (
        <MonitoringStep
          L={L}
          pMon={pMon}
          pCrops={pCrops}
          addMonitoring={addMonitoring}
          delMonitoring={delMonitoring}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
        />
      )}
      {step === 2 && (
        <VerificationStep
          pVer={pVer}
          pCrops={pCrops}
          addVerification={addVerification}
          delVerification={delVerification}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
          L={L}
        />
      )}
      {step === 3 && (
        <HarvestStep
          pHar={pHar}
          pCrops={pCrops}
          addHarvest={addHarvest}
          delHarvest={delHarvest}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
          L={L}
        />
      )}
      {step === 4 && (
        <PackingStep
          pPack={pPack}
          pHar={pHar}
          addPacking={addPacking}
          delPacking={delPacking}
          confirm={confirm}
          plantationId={plantationIdNum}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
        />
      )}

      {step < 4 && done[step] && (
        <div className="next-btn-wrap">
          <button className="btn btn-primary" onClick={() => openStep(step + 1)}>Next: {names[step + 1]} <FiArrowRight /></button>
        </div>
      )}

      {done[4] && (
        <div className="card video-card">
          <div className="video-card-left">
            <div className="video-icon"><FiVideo /></div>
            <div>
              <div className="card-title" style={{ margin: 0 }}>Generate Traceability Video</div>
              <p className="muted">Create a lifecycle video for this farm to share with customers.</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={async () => {
            try {
              await fetch("https://maatiaivideogenerator.onrender.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo: "", intro_logo: "", farmer_img: "", farm_img: "", process_images: pImgs.map((x) => x.imageUrl).filter(Boolean), certificate_img: "", end_img: "" }) });
              toast("Video generation initiated!", "success");
            } catch { toast("Video service unavailable right now.", "error"); }
          }}>Generate</button>
        </div>
      )}
    </div>
  );
}

function ProcessEntries({ stage, plantationId, pImgs, addProcessImage, delProcessImage, confirm, toast }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const list = pImgs.filter((x) => x.stage === stage);
  const add = () => {
    if (!name.trim()) {
      toast("Enter a process name", "error");
      return;
    }
    setPendingName(name.trim());
    setCameraOpen(true);
  };
  const remove = async (id) => {
    const ok = await confirm("Delete this process entry?");
    if (!ok) return;
    try {
      await delProcessImage(id);
      toast("Process entry deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <div className="card process-card">
      <GeoCameraModal
        open={cameraOpen}
        name={pendingName}
        onClose={() => {
          if (isSaving) return;
          setCameraOpen(false);
          setPendingName("");
        }}
        saving={isSaving}
        onUse={async (imageUrl) => {
          if (isSaving || !imageUrl) return;
          setIsSaving(true);
          try {
            const uploaded = await traceabilityApi
            .uploadTraceabilityImage({
              data_url: imageUrl,
              plantation_id: plantationId,
              stage,
            });
            const url = uploaded?.url;
            if (!url) throw new Error("Upload failed");
            await addProcessImage({ plantationId, stage, name: pendingName, date: TODAY, imageUrl: url });
            stabilizeTraceabilityViewport(() => {
              setCameraOpen(false);
              setPendingName("");
              setName("");
              toast("Image uploaded", "success");
            });
          } catch (e) {
            toast(getTraceabilityErrorMessage(e), "error");
          } finally {
            setIsSaving(false);
          }
        }}
        toast={toast}
      />
      <h4>Process Entries - {stage}</h4>
      <div className="form-row">
        <input className="input" placeholder="Enter process / field name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-outline" onClick={add}>Capture</button>
      </div>
      {list.length > 0 && (
        <div className="record-list mt process-entry-list">
          {list.map((it) => (
            <div key={it.id} className="process-entry-card">
              <div className="process-entry-main">
                {it.imageUrl && <img className="tc-thumb process-entry-thumb" src={it.imageUrl} alt={`${it.name} capture`} />}
                <div className="process-entry-copy">
                  <div className="process-entry-title">{it.name}</div>
                  <div className="process-entry-date">{it.date}</div>
                </div>
              </div>
              <div className="process-entry-actions">
                {it.imageUrl && (
                  <a className="process-entry-link" href={it.imageUrl} target="_blank" rel="noreferrer">
                    View
                  </a>
                )}
                <button className="process-entry-delete" onClick={() => remove(it.id)} type="button">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GeoCameraModal({ open, onClose, name, onUse, toast, saving = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setError("");
    setPreviewUrl("");
    setStatus("Requesting camera...");

    (async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported in this browser.");
      }
      const s = await requestBackCameraStream();
      const track = s.getVideoTracks?.()[0];
      if (track) await applyCameraTuning(track);
      if (cancelled) {
        stopMediaStream(s);
        return;
      }
      streamRef.current = s;
      const video = videoRef.current;
      if (video) {
        video.srcObject = s;
        await video.play();
      }
      setStatus("Camera ready");
    })().catch(() => {
      if (cancelled) return;
      setError("Camera permission denied or unavailable.");
      setStatus("Camera blocked");
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    return () => {
      const s = streamRef.current;
      streamRef.current = null;
      stopMediaStream(s);
      const video = videoRef.current;
      if (video) {
        try {
          video.srcObject = null;
        } catch {
          // ignore
        }
      }
    };
  }, [open]);

  const capture = async () => {
    try {
      setBusy(true);
      setError("");
      setStatus("Fetching location...");
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) throw new Error("Camera not ready");
      const s = streamRef.current;
      if (!s) throw new Error("Camera stream unavailable");
      if (video.readyState < 2) throw new Error("Camera not ready yet");

      const coords = await getCurrentLocation();

      let address = "Address unavailable";
      try {
        const res = await fetch(
          `${API_URL}/api/location/reverse?lat=${encodeURIComponent(coords.latitude)}&lon=${encodeURIComponent(coords.longitude)}`,
          { method: "GET", credentials: "include" },
        );
        const json = await res.json().catch(() => null);
        address = json?.display_name || address;
      } catch {
        // ignore
      }

      const outputWidth = 1280;
      const photoHeight = 720;
      const geoHeight = 280;
      canvas.width = outputWidth;
      canvas.height = photoHeight + geoHeight;
      const ctx = canvas.getContext("2d");

      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const srcAspect = srcW / srcH;
      const dstAspect = outputWidth / photoHeight;
      let sx = 0; let sy = 0; let sWidth = srcW; let sHeight = srcH;
      if (srcAspect > dstAspect) {
        sWidth = srcH * dstAspect;
        sx = (srcW - sWidth) / 2;
      } else {
        sHeight = srcW / dstAspect;
        sy = (srcH - sHeight) / 2;
      }
      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, outputWidth, photoHeight);

      drawGeoOverlay(ctx, outputWidth, photoHeight, geoHeight, {
        name: name || "Process Capture",
        dateTime: formatDateTime(new Date()),
        address,
        lat: coords.latitude,
        lon: coords.longitude,
      });

      const dataUrl = canvas.toDataURL("image/png");
      setPreviewUrl(dataUrl);
      setStatus("Capture complete");
    } catch (err) {
      setError(err?.message || "Capture failed");
      setStatus("Capture failed");
      toast?.(err?.message || "Capture failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal-box camera-modal">
        <button className="modal-close" onClick={onClose} type="button" disabled={saving}><FiX /></button>
        <h3>GPS Camera Capture</h3>
        <div className="muted" style={{ fontSize: 13 }}>Overlay includes time + GPS + address. (Geofencing removed.)</div>
        <div className="camera-stage">
          <video ref={videoRef} autoPlay muted playsInline />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div className="camera-status">{saving ? "Saving photo..." : status}</div>
        </div>
        {error && <div className="inline-alert error">{error}</div>}
        {previewUrl && (
          <div className="camera-preview">
            <img src={previewUrl} alt="Captured preview" />
          </div>
        )}
        <div className="actions right">
          <button className="btn btn-outline" onClick={capture} disabled={busy || saving}>Capture</button>
          <button className="btn btn-primary" onClick={() => { void onUse(previewUrl); }} disabled={!previewUrl || busy || saving}>Use Photo</button>
        </div>
      </div>
    </div>
  );
}

function CropsStep({ L, pCrops, addCrop, delCrop, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({ name: "", customName: "", variety: "", sowingDate: TODAY, expectedHarvest: "" });
  const add = async () => {
    const name = f.name === "Other" ? f.customName : f.name;
    if (!name || !f.variety || !f.sowingDate) return;
    void addCrop({ plantationId, name, variety: f.variety, sowingDate: f.sowingDate, expectedHarvest: f.expectedHarvest })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          setF({ name: "", customName: "", variety: "", sowingDate: TODAY, expectedHarvest: "" });
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm(`Delete this ${L.crop.toLowerCase()}?`);
    if (!ok) return;
    try {
      await delCrop(id);
      toast(`${L.crop} deleted`, "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title={`Add ${L.crop}`}>
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">{L.crop} Type *</label>
            <select className="input" value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))}>
              <option value="">Select {L.crop}...</option>
              {L.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          {f.name === "Other" && (
            <div className="field-wrap">
              <label className="field-label">Custom Name *</label>
              <input className="input" placeholder="Enter custom crop name" value={f.customName} onChange={(e) => setF((x) => ({ ...x, customName: e.target.value }))} />
            </div>
          )}
          <div className="field-wrap">
            <label className="field-label">{L.variety} *</label>
            <input className="input" placeholder={L.variety === "Variety" ? "e.g. Hybrid-5, Baby Leaf" : "e.g. SIS Hatchery Batch-22"} value={f.variety} onChange={(e) => setF((x) => ({ ...x, variety: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Sowing / Stocking Date *</label>
            <input className="input" type="date" value={f.sowingDate} onChange={(e) => setF((x) => ({ ...x, sowingDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Expected Harvest Date</label>
            <input className="input" type="date" value={f.expectedHarvest} onChange={(e) => setF((x) => ({ ...x, expectedHarvest: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Add {L.crop}</button>
          </div>
        </div>
        {pCrops.length > 0 && (
          <div className="record-list mt">
            {pCrops.map((c) => (
              <div key={c.id} className="record-row">
                <span className="record-text"><FiStar style={{ color: "#f59e0b" }} /> <strong>{c.name}</strong> - {c.variety} - <span className="muted">Sown {c.sowingDate}</span></span>
                <button className="icon-btn danger" onClick={() => remove(c.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Crops" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function MonitoringStep({ L, pMon, addMonitoring, delMonitoring, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({ date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" });
  const add = async () => {
    const inputType = f.inputType === "Other" ? f.customType : f.inputType;
    if (!inputType || !f.cropId) return;
    void addMonitoring({ plantationId, date: f.date, inputType, cropId: f.cropId, remarks: f.remarks })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          setF({ date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" });
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm("Delete this record?");
    if (!ok) return;
    try {
      await addMonitoring({ plantationId, date: f.date, inputType, cropId: f.cropId, remarks: f.remarks });
      setF({ date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" });
      toast("Monitoring record added!", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title="Add Monitoring Record">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Date *</label>
            <input className="input" type="date" value={f.date} onChange={(e) => setF((x) => ({ ...x, date: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Input Type *</label>
            <select className="input" value={f.inputType} onChange={(e) => setF((x) => ({ ...x, inputType: e.target.value }))}>
              <option value="">Select input type...</option>
              {L.monitoring.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          {f.inputType === "Other" && (
            <div className="field-wrap">
              <label className="field-label">Custom Type *</label>
              <input className="input" placeholder="Describe the input type" value={f.customType} onChange={(e) => setF((x) => ({ ...x, customType: e.target.value }))} />
            </div>
          )}
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}...</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.variety})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Remarks / Notes</label>
            <input className="input" placeholder="e.g. Applied NPK 12-12-17 at 50kg/acre" value={f.remarks} onChange={(e) => setF((x) => ({ ...x, remarks: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Add Record</button>
          </div>
        </div>
        {pMon.length > 0 && (
          <div className="record-list mt">
            {pMon.map((m) => (
              <div key={m.id} className="record-row">
                <span className="record-text"><FiDroplet style={{ color: "#2563eb" }} /> <strong>{m.inputType}</strong> - <span className="muted">{m.date}</span>{m.remarks && <> - {m.remarks}</>}</span>
                <button className="icon-btn danger" onClick={() => remove(m.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Monitoring" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function VerificationStep({ pVer, addVerification, delVerification, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, L }) {
  const [f, setF] = useState({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
  const add = () => {
    if (!f.cropId) return;
    void addVerification({ plantationId, ...f })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          setF({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm("Delete verification?");
    if (!ok) return;
    try {
      await addVerification({ plantationId, ...f });
      setF({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
      toast("Verification added!", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title="Add Verification">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Inspection Date *</label>
            <input className="input" type="date" value={f.inspectionDate} onChange={(e) => setF((x) => ({ ...x, inspectionDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}...</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.variety})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Crop Health *</label>
            <select className="input" value={f.health} onChange={(e) => setF((x) => ({ ...x, health: e.target.value }))}>
              {HEALTH_OPTIONS.map((h) => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Harvest Approval *</label>
            <select className="input" value={f.approved ? "yes" : "no"} onChange={(e) => setF((x) => ({ ...x, approved: e.target.value === "yes" }))}>
              <option value="yes">Approved for Harvest</option>
              <option value="no">âŒ Not Approved</option>
            </select>
          </div>
          <div className="field-wrap field-btn-wrap btn-row">
            <button className="btn btn-outline"><FiCamera /> Capture Certificate</button>
            <button className="btn btn-primary" onClick={add}><FiPlus /> Add</button>
          </div>
        </div>
        {pVer.length > 0 && (
          <div className="record-list mt">
            {pVer.map((v) => (
              <div key={v.id} className="record-row">
                <span className="record-text">
                  <FiCheckCircle style={{ color: v.approved ? "#1f8a43" : "#c0392b" }} />
                  <strong>{v.health}</strong> - {v.approved ? "Approved" : "Not Approved"} - <span className="muted">{v.inspectionDate}</span>
                </span>
                <button className="icon-btn danger" onClick={() => remove(v.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Verification" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function HarvestStep({ pHar, addHarvest, delHarvest, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, L }) {
  const [f, setF] = useState({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
  const accepted = Math.max(0, (Number(f.total) || 0) - (Number(f.rejected) || 0));
  const add = () => {
    if (!f.cropId || !f.total) return;
    void addHarvest({ plantationId, ...f, total: Number(f.total), rejected: Number(f.rejected) || 0, accepted })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          setF({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm("Delete harvest?");
    if (!ok) return;
    try {
      await addHarvest({ plantationId, ...f, total: Number(f.total), rejected: Number(f.rejected) || 0, accepted });
      setF({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
      toast("Harvest recorded!", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title="Record Harvest">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Harvest Date *</label>
            <input className="input" type="date" value={f.harvestDate} onChange={(e) => setF((x) => ({ ...x, harvestDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}...</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.variety})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Total Quantity *</label>
            <input className="input" type="number" placeholder="e.g. 500" value={f.total} onChange={(e) => setF((x) => ({ ...x, total: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Unit *</label>
            <select className="input" value={f.unit} onChange={(e) => setF((x) => ({ ...x, unit: e.target.value }))}>
              {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Rejected Quantity</label>
            <input className="input" type="number" placeholder="e.g. 20 (damaged / substandard)" value={f.rejected} onChange={(e) => setF((x) => ({ ...x, rejected: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Accepted (auto-calculated)</label>
            <div className="accepted-box">{accepted} {f.unit} accepted</div>
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Record Harvest</button>
          </div>
        </div>
        {pHar.length > 0 && (
          <div className="record-list mt">
            {pHar.map((h) => (
              <div key={h.id} className="record-row">
                <span className="record-text">
                  <FiTrendingUp style={{ color: "#1f8a43" }} />
                  <strong>{h.harvestDate}</strong> - Accepted: <strong style={{ color: "#1f8a43" }}>{h.accepted} {h.unit}</strong>
                  {h.rejected > 0 && <> - Rejected: <strong style={{ color: "#c0392b" }}>{h.rejected} {h.unit}</strong></>}
                </span>
                <button className="icon-btn danger" onClick={() => remove(h.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Harvest" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function PackingStep({ pPack, pHar, addPacking, delPacking, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({
    packingDate: TODAY,
    harvestId: "",
    packingSize: "",
    numPackages: "",
    netWeight: "",
    warehouse: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const add = () => {
    if (!f.harvestId || !f.packingSize || !f.netWeight) return;
    void addPacking({ plantationId, ...f, numPackages: Number(f.numPackages) || 0, netWeight: Number(f.netWeight) })
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          setF({ packingDate: TODAY, harvestId: "", packingSize: "", numPackages: "", netWeight: "", warehouse: "", street: "", city: "", state: "", pincode: "", country: "India" });
          toast("Saved", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };
  const remove = async (id) => {
    const ok = await confirm("Delete packing?");
    if (!ok) return;
    try {
      await addPacking({ plantationId, ...f, numPackages: Number(f.numPackages) || 0, netWeight: Number(f.netWeight) });
      setF({ packingDate: TODAY, harvestId: "", packingSize: "", numPackages: "", netWeight: "", warehouse: "", street: "", city: "", state: "", pincode: "", country: "India" });
      toast("Packing recorded!", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };
  return (
    <>
      <WorkflowSection title="Record Packing">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Packing Date *</label>
            <input className="input" type="date" value={f.packingDate} onChange={(e) => setF((x) => ({ ...x, packingDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Link to Harvest *</label>
            <select className="input" value={f.harvestId} onChange={(e) => setF((x) => ({ ...x, harvestId: e.target.value }))}>
              <option value="">Select harvest batch...</option>
              {pHar.map((h) => <option key={h.id} value={h.id}>{h.harvestDate} - {h.accepted} {h.unit} accepted</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Package Size *</label>
            <input className="input" placeholder="e.g. 50kg bag, 25kg sack" value={f.packingSize} onChange={(e) => setF((x) => ({ ...x, packingSize: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Number of Packages</label>
            <input className="input" type="number" placeholder="e.g. 10" value={f.numPackages} onChange={(e) => setF((x) => ({ ...x, numPackages: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Net Weight (kg) *</label>
            <input className="input" type="number" placeholder="Total net weight in kg" value={f.netWeight} onChange={(e) => setF((x) => ({ ...x, netWeight: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Warehouse Name</label>
            <input className="input" placeholder="e.g. Green Cold Storage" value={f.warehouse} onChange={(e) => setF((x) => ({ ...x, warehouse: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Street Address</label>
            <input className="input" placeholder="e.g. MG Road, Sector 5" value={f.street} onChange={(e) => setF((x) => ({ ...x, street: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">City</label>
            <input className="input" placeholder="e.g. Pune" value={f.city} onChange={(e) => setF((x) => ({ ...x, city: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">State</label>
            <input className="input" placeholder="e.g. Maharashtra" value={f.state} onChange={(e) => setF((x) => ({ ...x, state: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Pincode</label>
            <input className="input" placeholder="6-digit PIN" value={f.pincode} onChange={(e) => setF((x) => ({ ...x, pincode: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Country</label>
            <input className="input" placeholder="Country name" value={f.country} onChange={(e) => setF((x) => ({ ...x, country: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Record Packing</button>
          </div>
        </div>
        {pPack.length > 0 && (
          <div className="record-list mt">
            {pPack.map((pk) => (
              <div key={pk.id} className="record-row">
                <span className="record-text">
                  <FiPackage style={{ color: "#7c3aed" }} />
                  <strong>{pk.packingDate}</strong> - {pk.numPackages} x {pk.packingSize} - <strong>{pk.netWeight} kg</strong> - <span className="muted">{pk.city}, {pk.state}</span>
                </span>
                <button className="icon-btn danger" onClick={() => remove(pk.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Packing" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function SupplierDashboard({ navigate, toast }) {
  const { user } = useAuth();
  const { batches, addBatch, delBatch } = useData();
  const { confirm, dialog } = useConfirm();
  const [selected, setSelected] = useState([]);
  const [desc, setDesc] = useState("");
  const [batchModal, setBatchModal] = useState(null);
  const [supplierTraceState, setSupplierTraceState] = useState({
    loading: true,
    error: "",
    traces: [],
    operatingAreas: [],
  });

  const mine = batches.filter((b) => b.supplierId === user?.id);
  const minePackingIds = mine.flatMap((b) => b.packingIds || []);
  const traces = supplierTraceState.traces;
  const available = traces.filter(
    (trace) =>
      trace.hasPacking &&
      !trace.assignedPatchId &&
      !minePackingIds.includes(trace.packingId),
  );
  const selectedTraces = available.filter((trace) =>
    selected.includes(trace.packingId),
  );
  const total = selectedTraces.reduce(
    (sum, trace) => sum + (Number(trace.netWeight) || 0),
    0,
  );
  const toggle = (id) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );

  useEffect(() => {
    let cancelled = false;

    setSupplierTraceState((prev) => ({
      ...prev,
      loading: true,
      error: "",
    }));

    traceabilityApi
      .listSupplierFarmTraces()
      .then((response) => {
        if (cancelled) return;

        setSupplierTraceState({
          loading: false,
          error: "",
          traces: Array.isArray(response?.traces) ? response.traces : [],
          operatingAreas: Array.isArray(response?.operatingAreas)
            ? response.operatingAreas
            : [],
        });
      })
      .catch((error) => {
        if (cancelled) return;

        setSupplierTraceState({
          loading: false,
          error:
            getTraceabilityErrorMessage(error) ||
            "Failed to load supplier farm traces.",
          traces: [],
          operatingAreas: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const regionLabels = supplierTraceState.operatingAreas
    .map((area) =>
      [area?.village, area?.district, area?.state, area?.pincode]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(", "),
    )
    .filter(Boolean);

  const create = () => {
    if (!selectedTraces.length) {
      toast("Select at least one farm trace", "error");
      return;
    }

    const id = `PATCH-${Date.now().toString(36).toUpperCase()}`;
    const batch = {
      id,
      supplierId: user.id,
      packingIds: selectedTraces.map((trace) => trace.packingId),
      description: desc,
      totalWeight: total,
      createdAt: TODAY,
      items: selectedTraces.map((trace) => ({
        packing_id: trace.packingId,
        harvest_id: trace.harvestId,
        crop_id: trace.cropId,
        plantation_id: trace.plantationId,
      })),
    };

    void addBatch(batch)
      .then(() => {
        stabilizeTraceabilityViewport(() => {
          setSupplierTraceState((prev) => ({
            ...prev,
            traces: prev.traces.map((trace) =>
              batch.packingIds.includes(trace.packingId)
                ? { ...trace, assignedPatchId: id }
                : trace,
            ),
          }));
          setBatchModal(batch);
          setSelected([]);
          setDesc("");
          toast("Batch created!", "success");
        });
      })
      .catch((e) => toast(getTraceabilityErrorMessage(e), "error"));
  };

  const removeBatch = async (id) => {
    const ok = await confirm("Delete this batch?");
    if (!ok) return;

    const targetBatch = mine.find((batch) => batch.id === id);

    try {
      await delBatch(id);
      setSupplierTraceState((prev) => ({
        ...prev,
        traces: prev.traces.map((trace) =>
          targetBatch?.packingIds?.includes(trace.packingId) &&
          trace.assignedPatchId === id
            ? { ...trace, assignedPatchId: "" }
            : trace,
        ),
      }));
      toast("Deleted", "success");
    } catch (e) {
      toast(getTraceabilityErrorMessage(e), "error");
    }
  };

  return (
    <div className="page-container">
      {dialog}
      <div className="dashboard-hero supplier-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">Supplier Workspace</div>
          <h1>All Farm Traces</h1>
          <p className="dashboard-subtitle">
            Welcome back, {user?.name}. Review grower traces from your
            operating locations, shortlist packings, and turn them into
            supplier-side traceable batches.
          </p>
          {regionLabels.length > 0 && (
            <div className="supplier-region-row">
              {regionLabels.map((label) => (
                <span key={label} className="supplier-region-chip">
                  <FiMapPin />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="supplier-hero-panel">
          <div className="supplier-hero-label">Matched Coverage</div>
          <div className="supplier-hero-value">{traces.length}</div>
          <div className="supplier-hero-foot">
            farm trace{traces.length === 1 ? "" : "s"} aligned with your
            supplier profile
          </div>
        </div>
      </div>

      <div className="stats-row">
        <StatCard
          icon={<FiGrid />}
          label="Farm Traces"
          value={traces.length}
          color="blue"
        />
        <StatCard
          icon={<FiPackage />}
          label="Available Packings"
          value={available.length}
          color="green"
        />
        <StatCard
          icon={<FiBarChart2 />}
          label="Batches Created"
          value={mine.length}
          color="purple"
        />
      </div>

      {supplierTraceState.error && (
        <div className="inline-alert error">{supplierTraceState.error}</div>
      )}

      <div className="supplier-dashboard-grid">
        <div className="supplier-feed-column">
          <div className="card supplier-feed-card">
            <div className="card-title">
              <FiMapPin /> Farm Trace Feed
            </div>

            {supplierTraceState.loading ? (
              <div className="empty-state small">
                <p>Loading farm traces from your supplier coverage...</p>
              </div>
            ) : traces.length === 0 ? (
              <div className="empty-state small">
                <p>
                  No grower traces are available for your registered operating
                  areas yet.
                </p>
              </div>
            ) : (
              <div className="supplier-trace-grid">
                {traces.map((trace) => {
                  const isSelected = selected.includes(trace.packingId);
                  const isPackingReady = Boolean(trace.hasPacking && trace.packingId);
                  const myBatch = mine.find((batch) =>
                    batch.packingIds?.includes(trace.packingId),
                  );
                  const locationLine =
                    [
                      trace.packingCity,
                      trace.packingState,
                      trace.packingPincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || trace.originLocation;
                  const statusLabel = myBatch
                    ? "In Your Batch"
                    : trace.assignedPatchId
                      ? "Already Batched"
                      : "Ready for Batch";

                  return (
                    <div
                      key={trace.traceId || trace.packingId || trace.plantationId}
                      className={`supplier-trace-card ${isSelected ? "selected" : ""}`}
                    >
                      <div className="supplier-trace-top">
                        <div>
                          <div className="supplier-trace-kicker">
                            {trace.cropName || "Farm Trace"}
                          </div>
                          <h3>{trace.plantationName}</h3>
                        </div>
                        <span
                          className={`supplier-trace-status ${
                            myBatch
                              ? "mine"
                              : trace.assignedPatchId
                                ? "batched"
                                : "ready"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="supplier-trace-meta">
                        <div className="supplier-trace-meta-item">
                          <FiUser />
                          <div>
                            <span>Grower</span>
                            <strong>{trace.growerName}</strong>
                          </div>
                        </div>
                        <div className="supplier-trace-meta-item">
                          <FiMapPin />
                          <div>
                            <span>Origin</span>
                            <strong>{trace.originLocation || "Location not available"}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="supplier-trace-metrics">
                        <div>
                          <span>Variety</span>
                          <strong>{trace.cropVariety || "Standard"}</strong>
                        </div>
                        <div>
                          <span>Weight</span>
                          <strong>{trace.netWeight} kg</strong>
                        </div>
                        <div>
                          <span>Packages</span>
                          <strong>
                            {isPackingReady ? `${trace.numPackages} x ${trace.packingSize || "-"}` : "Packing pending"}
                          </strong>
                        </div>
                        <div>
                          <span>Harvest</span>
                          <strong>{trace.harvestDate || "Pending"}</strong>
                        </div>
                      </div>

                      <div className="supplier-trace-timeline">
                        <span>
                          <FiCalendar />
                          Sown {trace.sowingDate || "N/A"}
                        </span>
                        <span>
                          <FiCalendar />
                          Packed {trace.packingDate || "Pending"}
                        </span>
                      </div>

                      <div className="supplier-trace-footer">
                        <div className="supplier-trace-location">
                          <FiMapPin />
                          <span>{locationLine || "Location not available"}</span>
                        </div>
                        {trace.matchedArea && (
                          <span className="supplier-match-chip">
                            Match: {trace.matchedArea}
                          </span>
                        )}
                      </div>

                      <div className="supplier-trace-actions">
                        {myBatch ? (
                          <button
                            className="btn btn-outline"
                            onClick={() => navigate(`/patch/${myBatch.id}`)}
                          >
                            View Trace Page <FiArrowRight />
                          </button>
                        ) : trace.assignedPatchId ? (
                          <button className="btn btn-ghost" disabled>
                            Already assigned
                          </button>
                        ) : !isPackingReady ? (
                          <button className="btn btn-ghost" disabled>
                            Packing pending
                          </button>
                        ) : (
                          <button
                            className={`btn ${isSelected ? "btn-outline" : "btn-primary"}`}
                            onClick={() => toggle(trace.packingId)}
                          >
                            {isSelected ? "Selected for Batch" : "Select Trace"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {mine.length > 0 && (
            <div className="card">
              <div className="card-title">
                <FiGrid /> Your Batches
              </div>
              <div className="card-grid">
                {mine.map((batch) => (
                  <div
                    key={batch.id}
                    className="batch-card"
                    onClick={() => setBatchModal(batch)}
                  >
                    <div className="batch-card-top">
                      <code className="batch-id">{batch.id}</code>
                      <button
                        className="icon-btn danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBatch(batch.id);
                        }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className="batch-weight">{batch.totalWeight} kg total</div>
                    <p className="muted">
                      {batch.description || "No description"} - {batch.createdAt}
                    </p>
                    <button
                      className="btn btn-outline full-width mt"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patch/${batch.id}`);
                      }}
                    >
                      View Trace Page <FiArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="supplier-batch-column">
          <div className="card supplier-workbench">
            <div className="card-title">
              <FiPackage /> Create Supplier Batch
            </div>
            <div className="supplier-workbench-summary">
              <div>
                <span>Selected traces</span>
                <strong>{selectedTraces.length}</strong>
              </div>
              <div>
                <span>Total weight</span>
                <strong>{total} kg</strong>
              </div>
            </div>

            <div className="field-wrap">
              <label className="field-label">Batch Description</label>
              <textarea
                className="input supplier-notes"
                placeholder="e.g. Premium tomato route for North 24 Parganas stores"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
              />
            </div>

            {selectedTraces.length === 0 ? (
              <div className="empty-state small">
                <p>
                  Select trace cards from the feed to prepare a supplier batch.
                </p>
              </div>
            ) : (
              <div className="supplier-selection-list">
                {selectedTraces.map((trace) => (
                  <div key={trace.packingId} className="supplier-selection-item">
                    <div>
                      <strong>{trace.plantationName}</strong>
                      <p>
                        {trace.cropName} • {trace.netWeight} kg •{" "}
                        {trace.packingDate || "Packing date pending"}
                      </p>
                    </div>
                    <button
                      className="icon-btn"
                      onClick={() => toggle(trace.packingId)}
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              className="btn btn-primary full-width"
              onClick={create}
              disabled={!selectedTraces.length}
            >
              <FiPlus /> Create Batch ({selectedTraces.length})
            </button>
          </div>
        </div>
      </div>

      {batchModal && <BatchModal batch={batchModal} onClose={() => setBatchModal(null)} navigate={navigate} />}
    </div>
  );
}

function BatchModal({ batch, onClose, navigate }) {
  const qrValue = `${window.location.origin}/patch/${batch.id}`;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box batch-modal">
        <button className="modal-close" onClick={onClose}><FiX /></button>
        <div className="batch-modal-header">
          <div className="batch-modal-icon"><FiCheck /></div>
          <h3>Batch Created!</h3>
        </div>
        <div className="qr-box"><QRCode value={qrValue} size={180} /></div>
        <div className="batch-modal-info">
          <div className="kv-pair"><span>Batch ID</span><code>{batch.id}</code></div>
          <div className="kv-pair"><span>Total Weight</span><strong>{batch.totalWeight} kg</strong></div>
          <div className="kv-pair"><span>Description</span><strong>{batch.description || "-"}</strong></div>
          <div className="kv-pair"><span>Created</span><strong>{batch.createdAt}</strong></div>
          <div className="kv-pair"><span>Items</span><strong>{batch.packingIds.length} packings</strong></div>
        </div>
        <button className="btn btn-primary full-width" onClick={() => { onClose(); navigate(`/patch/${batch.id}`); }}>
          View Public Trace Page <FiArrowRight />
        </button>
      </div>
    </div>
  );
}

function QRCode({ value, size = 160 }) {
  const cells = 21;
  const cell = Math.floor(size / cells);
  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
    return h >>> 0;
  };
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      if ((r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)) return true;
      return ((hash(value + r * 100 + c) >> (c % 30)) & 1) === 1;
    }),
  );
  return (
    <svg width={cells * cell} height={cells * cell}>
      {grid.map((row, r) => row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#111" /> : null)))}
    </svg>
  );
}

function ReportsPage() {
  const { plantations, crops, harvests } = useData();
  return (
    <div className="page-container reports-page">
      <div className="page-header">
        <div><h1>Reports</h1><p className="page-subtitle">Overview of all plantations, crops, and harvest data</p></div>
      </div>
      <div className="card">
        <div className="card-title"><FiGrid /> Plantations</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Location</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {plantations.length === 0 ? <tr><td colSpan={4} className="table-empty">No data</td></tr>
                : plantations.map((p) => <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.location}</td><td><span className="status-chip active"><FiCheckCircle /> {p.status}</span></td><td>{p.createdAt}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FiStar /> Crops</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Crop</th><th>Variety</th><th>Sowing Date</th><th>Expected Harvest</th></tr></thead>
            <tbody>
              {crops.length === 0 ? <tr><td colSpan={4} className="table-empty">No data</td></tr>
                : crops.map((c) => <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.variety || "â€”"}</td><td>{c.sowingDate}</td><td>{c.expectedHarvest || "â€”"}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FiTrendingUp /> Harvests</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Total</th><th>Rejected</th><th>Accepted</th><th>Unit</th></tr></thead>
            <tbody>
              {harvests.length === 0 ? <tr><td colSpan={5} className="table-empty">No data</td></tr>
                : harvests.map((h) => <tr key={h.id}><td>{h.harvestDate}</td><td>{h.total}</td><td><span style={{ color: "#c0392b" }}>{h.rejected || 0}</span></td><td><span style={{ color: "#1f8a43" }}><strong>{h.accepted}</strong></span></td><td>{h.unit}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  const { plantations, crops, harvests, packings, batches, processImages, delProcessImage } = useData();
  const { confirm, dialog } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const mine = plantations.filter((p) => p.userId === user?.id);
  const mineIds = mine.map((p) => p.id);
  const mineCrops = crops.filter((c) => mineIds.includes(c.plantationId));
  const mineHarvests = harvests.filter((h) => mineIds.includes(h.plantationId));
  const minePackings = packings.filter((p) => mineIds.includes(p.plantationId));
  const mineBatches = batches.filter((b) => b.supplierId === user?.id);
  const mineImages = processImages.filter((i) => mineIds.includes(i.plantationId));
  const stages = ["Crops", "Monitoring", "Verification", "Harvest", "Packing", "Certificate"];

  const removeImage = async (id) => { const ok = await confirm("Delete this entry?"); if (!ok) return; delProcessImage(id); };

  return (
    <div className="page-container">
      {dialog}
      <div className="profile-banner">
        <div className="profile-avatar-lg"><FiUser /></div>
        <div className="profile-banner-info">
          <h1>{name}</h1>
          <span className="badge-chip capitalize">{user?.role}</span>
        </div>
        {!editing ? (
          <button className="btn btn-ghost profile-edit-btn" onClick={() => setEditing(true)}><FiEdit2 /> Edit Profile</button>
        ) : (
          <div className="profile-edit-row">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            <button className="btn btn-primary" onClick={() => setEditing(false)}><FiCheck /> Save</button>
            <button className="btn btn-ghost" onClick={() => { setName(user?.name || ""); setEditing(false); }}><FiX /></button>
          </div>
        )}
      </div>

      <div className="info-grid">
        <div className="info-item"><FiMail className="info-icon" /><span>Email</span><strong>{user?.email}</strong></div>
        <div className="info-item"><FiShield className="info-icon" /><span>Role</span><strong className="capitalize">{user?.role}</strong></div>
        <div className="info-item"><FiCalendar className="info-icon" /><span>Platform</span><strong>Seed-to-Batch</strong></div>
        <div className="info-item"><FiCheck className="info-icon" /><span>Status</span><strong style={{ color: "#1f8a43" }}>Active</strong></div>
      </div>

      <div className="stats-row">
        {user?.role === "grower" ? (
          <>
            <StatCard icon={<FiGrid />} label="Plantations" value={mine.length} color="green" />
            <StatCard icon={<FiStar />} label="Crops" value={mineCrops.length} color="amber" />
            <StatCard icon={<FiTrendingUp />} label="Harvests" value={mineHarvests.length} color="blue" />
            <StatCard icon={<FiPackage />} label="Packings" value={minePackings.length} color="purple" />
          </>
        ) : (
          <>
            <StatCard icon={<FiGrid />} label="Batches Created" value={mineBatches.length} color="blue" />
            <StatCard icon={<FiPackage />} label="Packings Managed" value={minePackings.length} color="green" />
          </>
        )}
      </div>

      {mineImages.length > 0 && (
        <div className="card">
          <div className="card-title"><FiCamera /> Process Image Gallery</div>
          {stages.map((stage) => {
            const list = mineImages.filter((img) => img.stage === stage);
            if (!list.length) return null;
            return (
              <div key={stage} className="gallery-group">
                <div className="gallery-stage-label">{stage}</div>
                <div className="record-list">
                  {list.map((img) => (
                    <div key={img.id} className="record-row">
                      <span className="record-text"><FiCamera /> {img.name} <span className="muted">({img.date})</span></span>
                      <button className="icon-btn danger" onClick={() => removeImage(img.id)}><FiTrash2 /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TracePage({ patchId }) {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, error: "", data: null });
    traceabilityApi
      .getTrace(patchId)
      .then((data) => {
        if (cancelled) return;
        setState({ loading: false, error: "", data });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ loading: false, error: err?.message || "Failed to load trace", data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [patchId]);

  if (state.loading) {
    return (
      <div className="trace-page trace-public">
        <div className="trace-card" style={{ textAlign: "center", padding: 36 }}>
          <h2>Loading trace...</h2>
          <p className="muted">Batch ID: <code>{patchId}</code></p>
        </div>
      </div>
    );
  }

  const patch = state.data?.patch ?? null;
  const items = patch ? safeJson(patch.items, []) : [];
  const packingIdsFromItems = Array.isArray(items)
    ? items
        .map((it) => it?.packing_id ?? it?.packingId)
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n))
    : [];

  const packings = patch ? (state.data?.packings || []).map(fromDbPacking) : [];
  const harvests = patch ? (state.data?.harvests || []).map(fromDbHarvest) : [];
  const crops = patch ? (state.data?.crops || []).map(fromDbCrop) : [];
  const plantations = patch ? (state.data?.plantations || []).map(fromDbPlantation) : [];

  const batch = patch
    ? {
        id: patch.patch_id,
        description: patch.description || "",
        totalWeight: Number(patch.total_weight) || 0,
        createdAt: toISODate(patch.created_at),
        packingIds: packingIdsFromItems.length ? packingIdsFromItems : packings.map((p) => p.id),
      }
    : null;

  if (!batch) {
    return (
      <div className="trace-page trace-public">
        <div className="trace-card" style={{ textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 40 }}><FiAlertTriangle /></div>
          <h2>Batch Not Found</h2>
          <p className="muted">Batch ID: <code>{patchId}</code> does not exist.</p>
        </div>
      </div>
    );
  }

  const firstPacking = packings.find((p) => p.id === batch.packingIds[0]);
  const harvestRecord = firstPacking ? harvests.find((h) => h.id === firstPacking.harvestId) : null;
  const cropRecord = harvestRecord ? crops.find((c) => c.id === harvestRecord.cropId) : null;
  const plantation = firstPacking ? plantations.find((p) => p.id === firstPacking.plantationId) : null;
  const isShrimp = false;

  const cropKey = (cropRecord?.name || "").toLowerCase();
  const xfactorMap = {
    tomato: [{ label: "Fruit Firmness", val: "7.2 N" }, { label: "Brix Sweetness", val: "4.8 deg Bx" }, { label: "Lycopene", val: "85 mg/kg" }, { label: "Pest Resistance", val: "0.89" }],
    brinjal: [{ label: "Glossiness", val: "92%" }, { label: "Anthocyanin", val: "120 mg/kg" }, { label: "Pest Resistance", val: "0.82" }],
    spinach: [{ label: "Iron", val: "27 mg/kg" }, { label: "Nitrate", val: "1800 mg/kg" }, { label: "Chlorophyll", val: "48 SPAD" }],
    palak: [{ label: "Iron", val: "27 mg/kg" }, { label: "Nitrate", val: "1800 mg/kg" }, { label: "Chlorophyll", val: "48 SPAD" }],
    "green gram": [{ label: "Protein", val: "24.5%" }, { label: "Germination", val: "95%" }, { label: "Moisture", val: "10.2%" }],
    moong: [{ label: "Protein", val: "24.5%" }, { label: "Germination", val: "95%" }, { label: "Moisture", val: "10.2%" }],
    lettuce: [{ label: "Crispness", val: "8.4 N" }, { label: "Nutrient Efficiency", val: "92%" }, { label: "Chlorophyll", val: "42 SPAD" }],
    cabbage: [{ label: "Head Density", val: "1.05 g/cm3" }, { label: "Compactness", val: "88%" }, { label: "Vitamin C", val: "36 mg/100g" }],
    cauliflower: [{ label: "Curd Compactness", val: "91%" }, { label: "Whiteness", val: "85" }, { label: "Vitamin C", val: "48 mg/100g" }],
    carrot: [{ label: "Beta Carotene", val: "8.3 mg/100g" }, { label: "Root Length", val: "18 cm" }, { label: "Sugar", val: "6.2 deg Bx" }],
    beetroot: [{ label: "Betanin", val: "95 mg/100g" }, { label: "Diameter", val: "7.5 cm" }, { label: "Sugar", val: "8.1 deg Bx" }],
    okra: [{ label: "Tenderness", val: "6.8 N" }, { label: "Fiber", val: "3.2 g/100g" }, { label: "Mucilage", val: "18 mL/100g" }],
    bhindi: [{ label: "Tenderness", val: "6.8 N" }, { label: "Fiber", val: "3.2 g/100g" }, { label: "Mucilage", val: "18 mL/100g" }],
    "french beans": [{ label: "Pod Length", val: "14 cm" }, { label: "Protein", val: "7.1 g/100g" }, { label: "Fiber", val: "3.4 g/100g" }],
    coriander: [{ label: "Essential Oil", val: "0.8%" }, { label: "Aroma", val: "8.5/10" }, { label: "Chlorophyll", val: "45 SPAD" }],
    fenugreek: [{ label: "Trigonelline", val: "0.36%" }, { label: "Bitterness", val: "4.2/10" }, { label: "Protein", val: "23 g/100g" }],
    methi: [{ label: "Trigonelline", val: "0.36%" }, { label: "Bitterness", val: "4.2/10" }, { label: "Protein", val: "23 g/100g" }],
    capsicum: [{ label: "Capsanthin", val: "125 mg/kg" }, { label: "Thickness", val: "6.5 mm" }, { label: "Vitamin C", val: "128 mg/100g" }],
    default: [{ label: "Quality Score", val: "A+" }, { label: "Pest Resistance", val: "0.85" }],
  };
  const xfactor = isShrimp ? [{ label: "Avg Size", val: "30-40 count/kg" }, { label: "FCR", val: "1.4:1" }, { label: "Culture Period", val: "90-120 days" }, { label: "Survival Rate", val: "80-85%" }] : (xfactorMap[cropKey] || xfactorMap.default);

  const retailSizes = {
    tomato: 1, spinach: 0.5, palak: 0.5, coriander: 0.25, lettuce: 0.3, cabbage: 1, cauliflower: 1,
    carrot: 0.5, beetroot: 0.5, capsicum: 0.5, okra: 0.5, bhindi: 0.5, brinjal: 0.5, "french beans": 0.5,
    "green gram": 1, moong: 1, shrimp: 1,
  };
  const retailSize = isShrimp ? 1 : (retailSizes[cropKey] || 1);
  const totalRetail = Math.floor((batch.totalWeight || 0) / retailSize);

  const timeline = [
    { label: "Crop Planted", date: cropRecord?.sowingDate, done: !!cropRecord },
    { label: "Harvested", date: harvestRecord?.harvestDate, done: !!harvestRecord },
    { label: "Bulk Packed", date: firstPacking?.packingDate, done: !!firstPacking },
    { label: "Supplier Packing", date: batch.createdAt, done: true },
    { label: "Transported", date: batch.createdAt, done: true },
    { label: "Delivered", date: null, done: false },
  ];

  return (
    <div className="trace-page trace-public">
      <div className="trace-hero">
        <div className="trace-hero-img">
          <div className="trace-hero-overlay">
            <h2 className="trace-product-name">{cropRecord?.name || "Agricultural Product"}</h2>
          </div>
          <div className="trace-info-bar">
            <div className="trace-info-item"><span className="amber-dot">•</span><span>Variety</span><strong>{cropRecord?.variety || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">•</span><span>Harvested</span><strong>{harvestRecord?.harvestDate || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">•</span><span>Origin</span><strong>{plantation?.location || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">•</span><span>Batch ID</span><strong className="mono">{batch.id}</strong></div>
          </div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">Farmer Information</div>
        <div className="farmer-row">
          <div className="farmer-avatar">{isShrimp ? "AQ" : "FM"}</div>
          <div>
            <div className="farmer-name">{plantation?.name || "Unknown Farm"}</div>
            <div className="farmer-sub">{isShrimp ? "Aquaculture Farm" : "Organic Farming Cooperative"}</div>
            <div className="farmer-badges">
              <span className="badge badge-green">{isShrimp ? "MPEDA Registered" : "Certified Organic Farmer"}</span>
              <span className="badge badge-blue">{isShrimp ? "Aquaculture Expert" : "Experienced Farmer"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">Farm Location</div>
        <div className="location-row">
          <div>
            <div className="location-name">{plantation?.location || "-"}</div>
            <div className="location-meta">Area: 2.5 hectares - <span className="badge badge-green">Active</span></div>
          </div>
        </div>
        <div style={{ padding: "0 16px 14px" }}>
          <button className="btn btn-dark"><FiVideo /> View Farm Media</button>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header" style={{ background: isShrimp ? "#1a5276" : "#2d6a2e" }}>
          {isShrimp ? "Water & Environment Data" : "Sustainability Data"}
        </div>
        {isShrimp ? (
          <div className="sustain-grid">
            {[{ l: "Water Quality", v: "pH 7.5-8.5" }, { l: "Water Temp", v: "28-32°C" }, { l: "Dissolved O2", v: ">= 5 mg/L" }, { l: "Ammonia", v: "< 0.1 mg/L" }, { l: "Antibiotic Test", v: "Passed" }, { l: "Salinity", v: "15-25 ppt" }].map((i) => (
              <div key={i.l} className="sustain-item"><div className="sustain-label">{i.l}</div><div className="sustain-val">{i.v}</div></div>
            ))}
          </div>
        ) : (
          <div className="sustain-grid">
            {[{ l: "Water Used", v: "1100 L/kg" }, { l: "Soil Health", v: "pH 6.8" }, { l: "Organic Carbon", v: "1.2%" }, { l: "NPK", v: "N:45 P:30 K:35 kg/ha" }, { l: "NDVI Score", v: "0.78" }, { l: "CO2 Footprint", v: "0.4 kg CO2e" }].map((i) => (
              <div key={i.l} className="sustain-item"><div className="sustain-label">{i.l}</div><div className="sustain-val">{i.v}</div></div>
            ))}
          </div>
        )}
      </div>

      <div className="trace-card">
        <div className="trace-section-header">{isShrimp ? "Shrimp Product Details" : "Crop-Specific Quality X-Factor"}</div>
        <div className="xfactor-grid">
          {xfactor.map((x) => (
            <div key={x.label} className="xfactor-item">
              <span className="star">★★★★★</span>
              <div className="xfactor-label">{x.label}</div>
              <div className="xfactor-val">{x.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">Certifications</div>
        <div className="cert-row">
          <span className="cert-badge">CERT</span>
          <div>
            <div style={{ fontWeight: 600 }}>{isShrimp ? "MPEDA / BAP Certified" : "India Organic Certified"}</div>
            <div style={{ fontSize: 13 }} className="muted">Valid Until: Dec 2025</div>
          </div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">Harvest & Supply Chain</div>
        <div className="supply-chain">
          {["Harvested", "Bulk Packed", "Supplier Packing", "Transported", "At Store"].map((s, i) => (
            <div key={s} className="chain-item">
              <div className={`chain-dot ${i < 4 ? "chain-active" : "chain-inactive"}`}>{i < 4 ? "✓" : "○"}</div>
              <div className={`chain-label ${i < 4 ? "" : "muted"}`}>{s}</div>
              {i < 4 && <div className="chain-line" />}
            </div>
          ))}
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">Harvest Data</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Harvest Date</span><strong>{harvestRecord?.harvestDate || "-"}</strong></div>
          <div className="kv-item"><span>Total Quantity</span><strong>{harvestRecord?.total || 0} {harvestRecord?.unit || "kg"}</strong></div>
          <div className="kv-item"><span>Accepted</span><strong style={{ color: "#2d6a2e" }}>{harvestRecord?.accepted || 0} {harvestRecord?.unit || "kg"}</strong></div>
          {harvestRecord?.rejected > 0 && <div className="kv-item"><span>Rejected</span><strong style={{ color: "#e53935" }}>{harvestRecord.rejected} {harvestRecord.unit}</strong></div>}
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">Bulk Packing Details</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Packed On</span><strong>{firstPacking?.packingDate || "-"}</strong></div>
          <div className="kv-item"><span>Packages</span><strong>{firstPacking?.numPackages || 0} x {firstPacking?.packingSize || "-"}</strong></div>
          <div className="kv-item"><span>Net Weight</span><strong>{firstPacking?.netWeight || 0} kg</strong></div>
          <div className="kv-item"><span>Warehouse</span><strong>{firstPacking?.warehouse || "-"}</strong></div>
          <div className="kv-item"><span>Location</span><strong>{firstPacking ? `${firstPacking.city}, ${firstPacking.state}` : "-"}</strong></div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header" style={{ background: "linear-gradient(90deg, #1a5276, #2980b9)" }}>Supplier Packing (Retail)</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Batch ID</span><code className="mono">{batch.id}</code></div>
          <div className="kv-item"><span>Bulk Weight</span><strong>{batch.totalWeight} kg</strong></div>
          <div className="kv-item"><span>Retail Packet Size</span><strong>{retailSize} kg</strong></div>
          <div className="kv-item"><span>Total Retail Packets</span><strong>{totalRetail} pcs</strong></div>
          <div className="kv-item"><span>Packaging Type</span><strong>{isShrimp ? "IQF / Frozen Pack" : "Consumer Ready"}</strong></div>
          <div className="kv-item"><span>QC Status</span><strong style={{ color: "#2d6a2e" }}>Passed</strong></div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">Traceability Timeline</div>
        <div className="v-timeline">
          {timeline.map((t, i) => (
            <div key={t.label} className="v-tl-item">
              <div className={`v-tl-dot ${t.done ? "v-tl-done" : "v-tl-pending"}`} />
              {i < timeline.length - 1 && <div className={`v-tl-line ${t.done ? "v-tl-line-done" : ""}`} />}
              <div className="v-tl-content">
                <span className="v-tl-label">{t.label}</span>
                <span className="v-tl-date">{t.date || "Pending"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">Batch Summary</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Batch ID</span><code className="mono">{batch.id}</code></div>
          <div className="kv-item"><span>Total Weight</span><strong>{batch.totalWeight} kg</strong></div>
          <div className="kv-item"><span>Description</span><strong>{batch.description || "-"}</strong></div>
          <div className="kv-item"><span>Created</span><strong>{batch.createdAt}</strong></div>
          <div className="kv-item"><span>Items</span><strong>{batch.packingIds.length}</strong></div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">Data Verification</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Verified By</span><strong>MaatiAI System</strong></div>
          <div className="kv-item"><span>Last Updated</span><strong>{new Date().toLocaleString()}</strong></div>
          <div className="kv-item"><span>Status</span><strong style={{ color: "#2d6a2e" }}>Verified</strong></div>
        </div>
      </div>

      <div className="trace-actions">
        <button className="btn btn-primary"><FiCamera /> View Harvest Photos</button>
        <button className="btn btn-outline"><FiVideo /> Watch Farmer Story</button>
      </div>

      <div className="trace-footer">Powered by <strong>MaatiAI</strong> Traceability</div>
    </div>
  );
}
function AppShell() {
  const { user, loading } = useAuth();
  const { route, navigate } = useRouter();
  const { toast, toasts } = useToast();
  const plantationMatch = route.match(/^\/plantation\/(.+)$/);
  const patchMatch = route.match(/^\/patch\/(.+)$/);

  useEffect(() => {
    if (loading) return;
    if (!user && route !== "/" && !patchMatch) navigate("/");
  }, [user, loading, route, patchMatch, navigate]);

  let page = null;
  if (patchMatch) page = <TracePage patchId={patchMatch[1]} />;
  else if (loading) page = <div className="page-container"><div className="card">Loading...</div></div>;
  else if (!user) page = <LoginRequired />;
  else if (plantationMatch) page = <PlantationDetail plantationId={plantationMatch[1]} toast={toast} />;
  else if (route === "/grower") page = user.role === "grower" ? <GrowerDashboard navigate={navigate} toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/supplier") page = user.role === "supplier" ? <SupplierDashboard navigate={navigate} toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/plantations") page = user.role === "grower" ? <PlantationsPage navigate={navigate} toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/reports") page = <ReportsPage />;
  else if (route === "/profile") page = <ProfilePage />;
  else page = user.role === "grower" ? <GrowerDashboard navigate={navigate} toast={toast} /> : <SupplierDashboard navigate={navigate} toast={toast} />;

  return (
    <div className="app-root">
      <Toasts toasts={toasts} />
      {user && !patchMatch && <Header route={route} navigate={navigate} />}
      <main>{page}</main>
    </div>
  );
}

export default function TraceConnect() {
  useEffect(() => {
    const rootEl = typeof document !== "undefined" ? document.getElementById("root") : null;
    if (typeof document !== "undefined") {
      document.body.classList.add("traceconnect-body");
    }
    if (rootEl) {
      rootEl.classList.add("traceconnect-root-host");
    }

    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("traceconnect-body");
      }
      if (rootEl) {
        rootEl.classList.remove("traceconnect-root-host");
      }
    };
  }, []);

  return (
    <div className="tc-root">
      <AuthProvider>
        <DataProvider>
          <AppShell />
        </DataProvider>
      </AuthProvider>
    </div>
  );
}



