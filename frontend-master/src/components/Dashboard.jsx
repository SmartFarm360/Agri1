import { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  Thermometer,
  Droplets,
  Sprout,
  FlaskConical,
  Beaker,
} from "lucide-react";
import {
  FaTimes,
  FaTemperatureHigh,
  FaTint,
  FaSeedling,
  FaRulerCombined,
  FaExclamationTriangle,
  FaTachometerAlt,
  FaWind,
  FaSun,
  FaLeaf,
  FaVial,
  FaFlask,
  FaMicroscope,
  FaDna,
} from "react-icons/fa";

import { AlertTriangle, MapPin, Clock } from "lucide-react";
import AddFarmModal from "./AddFarmModal";
import * as turf from "@turf/turf";

const translations = {
  en: {
    dashboard: "Agricultural Dashboard",
    temperature: "Temperature",
    humidity: "Humidity",
    moisture: "Soil Moisture",
    high: "High",
    moderate: "Moderate",
    low: "Low",
    activeCases: "Active Cases",
    recommendations: "Recommendations",
    farmLocation: "Farm Location",
    parameters: "Parameters",
  },
};

const GRID_CELL_SIZE_METERS = 20;
const SMALL_GRID_ZOOM_THRESHOLD = 17;
const LARGE_GRID_TARGET_CELLS = 320;
const MAX_LARGE_GRID_CELLS = 320;
const MAX_SMALL_GRID_CELLS = 480;
const GRID_REFINEMENT_ATTEMPTS = 4;

const runWhenBrowserIdle = () =>
  new Promise((resolve) => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => resolve(), { timeout: 300 });
      return;
    }
    setTimeout(resolve, 0);
  });

const getSeededUnit = (seed) => {
  let hash = 2166136261;
  const text = String(seed);

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  return ((hash >>> 0) % 10000) / 10000;
};

const getSeededNumber = (seed, min, max) => {
  return Math.round(min + getSeededUnit(seed) * (max - min));
};

const getSeededFloat = (seed, min, max, precision = 2) => {
  return Number((min + getSeededUnit(seed) * (max - min)).toFixed(precision));
};

const getMedianValue = (values, fallback = 0) => {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (validValues.length === 0) return fallback;

  const sorted = [...validValues].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  return sorted[mid];
};

const getGridRisk = (temperature, humidity, moisture) => {
  if (temperature > 32 || humidity > 78 || moisture < 35) return "high";
  if (temperature > 28 || humidity > 65 || moisture < 50) return "moderate";
  return "low";
};

const gridRiskColor = {
  high: "#ef4444",
  moderate: "#f59e0b",
  low: "#9ca3af",
};

const getCaseGridMetrics = (caseData) => {
  if (!caseData) return null;
  if (caseData.gridDetails) return caseData.gridDetails;

  const seedPrefix = `${caseData.gridId || "GRID"}-${caseData.caseId || "CASE"}`;
  const temperature = getSeededNumber(`${seedPrefix}-temp`, 21, 37);
  const humidity = getSeededNumber(`${seedPrefix}-hum`, 40, 90);
  const moisture = getSeededNumber(`${seedPrefix}-soil`, 25, 85);
  const cellArea = getSeededNumber(`${seedPrefix}-area`, 180, 980);
  const pressure = getSeededNumber(`${seedPrefix}-pressure`, 98, 103);
  const windSpeed = getSeededNumber(`${seedPrefix}-wind`, 1, 12);
  const solarRadiation = getSeededNumber(`${seedPrefix}-solar`, 150, 950);
  const ndvi = getSeededFloat(`${seedPrefix}-ndvi`, 0.2, 0.95, 2);
  const soilPh = getSeededFloat(`${seedPrefix}-ph`, 5.4, 8.2, 1);
  const nitrogen = getSeededNumber(`${seedPrefix}-nitrogen`, 20, 120);
  const phosphorus = getSeededNumber(`${seedPrefix}-phosphorus`, 5, 60);
  const potassium = getSeededNumber(`${seedPrefix}-potassium`, 40, 220);
  const risk = getGridRisk(temperature, humidity, moisture);

  return {
    temperature,
    humidity,
    moisture,
    cellArea,
    pressure,
    windSpeed,
    solarRadiation,
    ndvi,
    soilPh,
    nitrogen,
    phosphorus,
    potassium,
    risk,
  };
};

const cropProfiles = [
  {
    name: "Rice",
    ranges: {
      temperature: [24, 35],
      humidity: [60, 90],
      moisture: [55, 85],
      soilPh: [5, 7],
    },
    harvestMonth: "October-November",
    expectedTime: "110-140 days",
  },
  {
    name: "Wheat",
    ranges: {
      temperature: [15, 25],
      humidity: [40, 65],
      moisture: [35, 60],
      soilPh: [6, 7.5],
    },
    harvestMonth: "March-April",
    expectedTime: "110-130 days",
  },
  {
    name: "Maize",
    ranges: {
      temperature: [18, 32],
      humidity: [50, 75],
      moisture: [40, 65],
      soilPh: [5.5, 7.5],
    },
    harvestMonth: "September-October",
    expectedTime: "90-110 days",
  },
  {
    name: "Cotton",
    ranges: {
      temperature: [21, 35],
      humidity: [45, 70],
      moisture: [35, 55],
      soilPh: [5.8, 8],
    },
    harvestMonth: "October-January",
    expectedTime: "150-170 days",
  },
  {
    name: "Mustard",
    ranges: {
      temperature: [10, 25],
      humidity: [35, 60],
      moisture: [30, 50],
      soilPh: [6, 7.5],
    },
    harvestMonth: "February-March",
    expectedTime: "110-140 days",
  },
  {
    name: "Groundnut",
    ranges: {
      temperature: [20, 30],
      humidity: [50, 70],
      moisture: [35, 60],
      soilPh: [5.5, 7],
    },
    harvestMonth: "September-October",
    expectedTime: "100-120 days",
  },
];

const getRangeScore = (value, min, max) => {
  if (!Number.isFinite(value)) return 0.4;
  if (value >= min && value <= max) return 1;

  const width = Math.max(max - min, 1);
  const distance = value < min ? min - value : value - max;
  const normalizedDistance = distance / width;

  if (normalizedDistance <= 0.2) return 0.75;
  if (normalizedDistance <= 0.4) return 0.55;
  if (normalizedDistance <= 0.7) return 0.35;
  return 0.15;
};

const getGridCropPlan = (gridMetrics, limit = 3) => {
  if (!gridMetrics) return [];

  return cropProfiles
    .map((crop) => {
      const temperatureScore = getRangeScore(
        gridMetrics.temperature,
        crop.ranges.temperature[0],
        crop.ranges.temperature[1],
      );
      const humidityScore = getRangeScore(
        gridMetrics.humidity,
        crop.ranges.humidity[0],
        crop.ranges.humidity[1],
      );
      const moistureScore = getRangeScore(
        gridMetrics.moisture,
        crop.ranges.moisture[0],
        crop.ranges.moisture[1],
      );
      const phScore = getRangeScore(
        gridMetrics.soilPh,
        crop.ranges.soilPh[0],
        crop.ranges.soilPh[1],
      );

      return {
        ...crop,
        score:
          temperatureScore * 0.35 +
          humidityScore * 0.25 +
          moistureScore * 0.25 +
          phScore * 0.15,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

const Dashboard = ({ currentLanguage = "en", translatedText }) => {
  const [dashboardData, setDashboardData] = useState({
    temperature: 0,
    moisture: 0,
    humidity: 0,
    nutrients: 0,
    ph: 0,
    waterLevel: 0,
    cases: [],
  });

  const [farms, setFarms] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [activeCase, setActiveCase] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [mapToast, setMapToast] = useState({
    visible: false,
    type: "loading",
    message: "",
  });
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [linkedGridCase, setLinkedGridCase] = useState(null);

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const activeCasesRef = useRef(null);

  const fallbackText = translations[currentLanguage] || translations.en;
  const t = new Proxy(translatedText || fallbackText, {
    get: (target, prop) => target[prop] || prop,
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fetchFarms = async () => {
      try {
        const API_URL = "https://agri1-32qq.onrender.com";
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/api/farm/my`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch farms");

        const data = await res.json();
        setFarms(data);

        if (data.length > 0) {
          setSelectedFarm(data[0]);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Farm fetch error:", err);
        }
        setFarms([]);
      } finally {
        setLoadingFarms(false);
        clearTimeout(timeoutId);
      }
    };

    fetchFarms();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (loadingFarms) {
      setMapToast({
        visible: true,
        type: "loading",
        message: "Loading farm map...",
      });
      return;
    }

    if (!loadingFarms && farms.length === 0) {
      setMapToast((prev) => ({ ...prev, visible: false }));
    }
  }, [loadingFarms, farms.length]);

  useEffect(() => {
    if (!mapToast.visible || mapToast.type === "loading") return;

    const timer = setTimeout(() => {
      setMapToast((prev) => ({ ...prev, visible: false }));
    }, 2500);

    return () => clearTimeout(timer);
  }, [mapToast]);

  useEffect(() => {
    const isAnyPopupOpen = Boolean(selectedGrid || activeCase || showAddFarmModal);

    if (isAnyPopupOpen) {
      document.body.classList.add("dashboard-modal-open");
    } else {
      document.body.classList.remove("dashboard-modal-open");
    }

    return () => {
      document.body.classList.remove("dashboard-modal-open");
    };
  }, [selectedGrid, activeCase, showAddFarmModal]);

  useEffect(() => {
    if (!selectedFarm) return;

    let isCancelled = false;

    const initMap = async () => {
      try {
        if (!mapRef.current || !selectedFarm) return;
        setMapToast({
          visible: true,
          type: "loading",
          message: "Loading farm map...",
        });
        setMapError(null);

        const latitude = Number(selectedFarm.latitude);
        const longitude = Number(selectedFarm.longitude);
        const farmSeed = selectedFarm.farm_id || `${latitude}-${longitude}`;

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          throw new Error("Invalid farm coordinates");
        }

        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const map = L.map(mapRef.current).setView([latitude, longitude], 16);
        leafletMapRef.current = map;

        const tileLayer = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "Tiles © Esri",
          },
        );

        // L.tileLayer(
        //   "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        //   {
        //     attribution: "Tiles © Esri"
        //   }
        // ).addTo(map);

        tileLayer.once("load", () => {
          if (isCancelled) return;
          setMapToast({
            visible: true,
            type: "success",
            message: "Farm map loaded successfully.",
          });
        });

        tileLayer.addTo(map);

        map.createPane("labels");
        map.getPane("labels").style.zIndex = 650;
        map.getPane("labels").style.pointerEvents = "none";

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
          {
            subdomains: "abcd",
            pane: "labels",
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
          },
        ).addTo(map);
        setTimeout(() => {
          if (isCancelled || !leafletMapRef.current) return;
          leafletMapRef.current.invalidateSize();
        }, 0);

        const farmMarkerIcon = L.icon({
          iconRetinaUrl: markerIcon2x,
          iconUrl: markerIcon,
          shadowUrl: markerShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        const centerMarker = L.marker([latitude, longitude], {
          icon: farmMarkerIcon,
        })
          .addTo(map)
          .bindPopup(selectedFarm.farm_name);

        let farmBoundary;

        let polygonCoords = selectedFarm.polygon_coordinates;

        if (typeof polygonCoords === "string") {
          try {
            polygonCoords = JSON.parse(polygonCoords);
          } catch {
            polygonCoords = [];
          }
        }

        const validPolygonCoords = Array.isArray(polygonCoords)
          ? polygonCoords
              .map((point) => ({
                lat: Number(point?.lat),
                lng: Number(point?.lng),
              }))
              .filter(
                (point) =>
                  Number.isFinite(point.lat) && Number.isFinite(point.lng),
              )
          : [];

        if (validPolygonCoords.length >= 4) {
          const seenPoints = new Set();
          const uniquePolygonCoords = validPolygonCoords.filter((point) => {
            const key = `${point.lat.toFixed(8)}:${point.lng.toFixed(8)}`;
            if (seenPoints.has(key)) return false;
            seenPoints.add(key);
            return true;
          });

          if (uniquePolygonCoords.length < 4) {
            throw new Error("Invalid farm polygon points");
          }

          const buildClosedCoords = (points) => {
            const coords = points.map((p) => [Number(p.lng), Number(p.lat)]);
            const firstCoord = coords[0];
            const lastCoord = coords[coords.length - 1];

            if (
              !lastCoord ||
              lastCoord[0] !== firstCoord[0] ||
              lastCoord[1] !== firstCoord[1]
            ) {
              coords.push(firstCoord);
            }

            return coords;
          };

          let polygonToRender = uniquePolygonCoords;
          let turfCoords = buildClosedCoords(polygonToRender);
          let farmPolygon = turf.polygon([turfCoords]);

          if (!turf.booleanValid(farmPolygon)) {
            const center = polygonToRender.reduce(
              (acc, point) => ({
                lat: acc.lat + point.lat / polygonToRender.length,
                lng: acc.lng + point.lng / polygonToRender.length,
              }),
              { lat: 0, lng: 0 },
            );

            polygonToRender = [...polygonToRender].sort((a, b) => {
              const angleA = Math.atan2(a.lat - center.lat, a.lng - center.lng);
              const angleB = Math.atan2(b.lat - center.lat, b.lng - center.lng);
              return angleA - angleB;
            });

            turfCoords = buildClosedCoords(polygonToRender);
            farmPolygon = turf.polygon([turfCoords]);
          }

          if (!turf.booleanValid(farmPolygon)) {
            throw new Error("Invalid farm polygon");
          }

          // DRAW boundary
          farmBoundary = L.polygon(
            polygonToRender.map((point) => [Number(point.lat), Number(point.lng)]),
            {
              color: "#14532d",
              weight: 2,
              dashArray: "6,6",
              fillColor: "#16a34a",
              fillOpacity: 0.15,
            },
          ).addTo(map);

          const bbox = turf.bbox(farmPolygon);

          const smallCellSizeKm = GRID_CELL_SIZE_METERS / 1000;

          const southWest = turf.point([bbox[0], bbox[1]]);
          const southEast = turf.point([bbox[2], bbox[1]]);
          const northWest = turf.point([bbox[0], bbox[3]]);

          const bboxWidthMeters =
            turf.distance(southWest, southEast, { units: "kilometers" }) *
            1000;
          const bboxHeightMeters =
            turf.distance(southWest, northWest, { units: "kilometers" }) *
            1000;

          const largeCellSizeKm = Math.max(
            smallCellSizeKm * 5,
            Math.sqrt((bboxWidthMeters * bboxHeightMeters) / LARGE_GRID_TARGET_CELLS) /
              1000,
          );

          const getIntersectingCells = (
            baseCellSizeKm,
            ratioThreshold = 0.51,
            maxCells = MAX_SMALL_GRID_CELLS,
          ) => {
            let refinedCellSizeKm = baseCellSizeKm;
            let keptCells = [];

            for (
              let attempt = 0;
              attempt < GRID_REFINEMENT_ATTEMPTS;
              attempt += 1
            ) {
              const grid = turf.squareGrid(bbox, refinedCellSizeKm, {
                units: "kilometers",
              });

              if (!grid.features.length) {
                return { cells: [], cellSizeKm: refinedCellSizeKm };
              }

              if (
                grid.features.length > maxCells * 5 &&
                attempt < GRID_REFINEMENT_ATTEMPTS - 1
              ) {
                const scaleFactor = Math.sqrt(grid.features.length / maxCells);
                refinedCellSizeKm *= Math.max(1.2, scaleFactor);
                continue;
              }

              keptCells = [];

              grid.features.forEach((cell) => {
                const cellArea = turf.area(cell);
                const center = turf.center(cell);
                const isCenterInside = turf.booleanPointInPolygon(
                  center,
                  farmPolygon,
                );

                if (!isCenterInside && !turf.booleanIntersects(cell, farmPolygon)) {
                  return;
                }

                const estimatedIntersectionArea = isCenterInside
                  ? cellArea
                  : cellArea * 0.6;

                if (estimatedIntersectionArea / cellArea < ratioThreshold) return;

                keptCells.push({
                  cell,
                  intersectionArea: estimatedIntersectionArea,
                });
              });

              if (
                keptCells.length <= maxCells ||
                attempt === GRID_REFINEMENT_ATTEMPTS - 1
              ) {
                break;
              }

              const scaleFactor = Math.sqrt(keptCells.length / maxCells);
              refinedCellSizeKm *= Math.max(1.2, scaleFactor);
            }

            return {
              cells: keptCells.slice(0, maxCells),
              cellSizeKm: refinedCellSizeKm,
            };
          };

          const largeGridLayer = L.layerGroup().addTo(map);
          const smallGridLayer = L.layerGroup();

          const buildMetricPayload = (seedPrefix, cellId, areaSqM, metricScope) => {
            const temperature = getSeededNumber(`${seedPrefix}-temp`, 21, 37);
            const humidity = getSeededNumber(`${seedPrefix}-hum`, 40, 90);
            const moisture = getSeededNumber(`${seedPrefix}-soil`, 25, 85);
            const pressure = getSeededNumber(`${seedPrefix}-pressure`, 98, 103);
            const windSpeed = getSeededNumber(`${seedPrefix}-wind`, 1, 12);
            const solarRadiation = getSeededNumber(`${seedPrefix}-solar`, 150, 950);
            const ndvi = getSeededFloat(`${seedPrefix}-ndvi`, 0.2, 0.95, 2);
            const soilPh = getSeededFloat(`${seedPrefix}-ph`, 5.4, 8.2, 1);
            const nitrogen = getSeededNumber(`${seedPrefix}-nitrogen`, 20, 120);
            const phosphorus = getSeededNumber(`${seedPrefix}-phosphorus`, 5, 60);
            const potassium = getSeededNumber(`${seedPrefix}-potassium`, 40, 220);
            const risk = getGridRisk(temperature, humidity, moisture);

            return {
              gridId: cellId,
              temperature,
              humidity,
              moisture,
              pressure,
              windSpeed,
              solarRadiation,
              ndvi,
              soilPh,
              nitrogen,
              phosphorus,
              potassium,
              risk,
              cellArea: Math.round(areaSqM),
              metricScope,
            };
          };

          const drawCells = (
            cells,
            layerGroup,
            styleConfig,
            idPrefix,
            metricScope,
            payloads,
          ) => {
            cells.forEach(({ cell, intersectionArea }, index) => {
              const coords = cell.geometry.coordinates[0].map((c) => [c[1], c[0]]);
              const payload =
                payloads?.[index] ||
                buildMetricPayload(
                  `${selectedFarm.farm_id}-${idPrefix}-${index}`,
                  `${idPrefix}-${index + 1}`,
                  intersectionArea,
                  metricScope,
                );

              const gridPolygon = L.polygon(coords, {
                color: styleConfig.strokeColor,
                weight: styleConfig.weight,
                fillColor: gridRiskColor[payload.risk],
                fillOpacity: styleConfig.fillOpacity,
              }).addTo(layerGroup);

              gridPolygon.on("click", () => {
                setSelectedGrid(payload);
              });
            });
          };

          await runWhenBrowserIdle();

          const { cells: largeCells } = getIntersectingCells(
            largeCellSizeKm,
            0.45,
            MAX_LARGE_GRID_CELLS,
          );
          const largeCellPayloads = largeCells.map(({ intersectionArea }, index) =>
            buildMetricPayload(
              `${selectedFarm.farm_id}-ZONE-${index}`,
              `ZONE-${index + 1}`,
              intersectionArea,
              "overall",
            ),
          );

          drawCells(
            largeCells,
            largeGridLayer,
            {
              strokeColor: "#6b7280",
              weight: 1.2,
              fillOpacity: 0.32,
            },
            "ZONE",
            "overall",
            largeCellPayloads,
          );

          const updateFarmMetrics = (payloads) => {
            const medianTemperature = getMedianValue(
              payloads.map((payload) => payload.temperature),
              getSeededNumber(`${farmSeed}-temp`, 21, 37),
            );
            const medianHumidity = getMedianValue(
              payloads.map((payload) => payload.humidity),
              getSeededNumber(`${farmSeed}-hum`, 40, 90),
            );
            const medianMoisture = getMedianValue(
              payloads.map((payload) => payload.moisture),
              getSeededNumber(`${farmSeed}-soil`, 25, 85),
            );

            if (!isCancelled) {
              setDashboardData((prev) => ({
                ...prev,
                temperature: medianTemperature,
                humidity: medianHumidity,
                moisture: medianMoisture,
              }));
            }
          };

          updateFarmMetrics(largeCellPayloads);

          let smallGridDrawn = false;
          let smallGridBuildPromise = null;

          const ensureSmallGrid = async () => {
            if (smallGridDrawn) return;
            if (smallGridBuildPromise) {
              await smallGridBuildPromise;
              return;
            }

            smallGridBuildPromise = (async () => {
              if (!isCancelled) {
                setMapToast({
                  visible: true,
                  type: "loading",
                  message: "Preparing detailed grid...",
                });
              }

              await runWhenBrowserIdle();
              if (isCancelled) return;

              const { cells: smallCells } = getIntersectingCells(
                smallCellSizeKm,
                0.51,
                MAX_SMALL_GRID_CELLS,
              );
              const smallCellPayloads = smallCells.map(
                ({ intersectionArea }, index) =>
                  buildMetricPayload(
                    `${selectedFarm.farm_id}-GRID-${index}`,
                    `GRID-${index + 1}`,
                    intersectionArea,
                    "individual",
                  ),
              );

              drawCells(
                smallCells,
                smallGridLayer,
                {
                  strokeColor: "#4b5563",
                  weight: 1,
                  fillOpacity: 0.45,
                },
                "GRID",
                "individual",
                smallCellPayloads,
              );

              updateFarmMetrics(smallCellPayloads);
              smallGridDrawn = true;

              if (!isCancelled) {
                setMapToast({
                  visible: true,
                  type: "success",
                  message: "Detailed grid loaded.",
                });
              }
            })();

            try {
              await smallGridBuildPromise;
            } finally {
              smallGridBuildPromise = null;
            }
          };

          const syncGridLayersByZoom = () => {
            if (map.getZoom() >= SMALL_GRID_ZOOM_THRESHOLD) {
              ensureSmallGrid()
                .then(() => {
                  if (isCancelled || !leafletMapRef.current) return;

                  if (map.hasLayer(largeGridLayer)) {
                    map.removeLayer(largeGridLayer);
                  }
                  if (!map.hasLayer(smallGridLayer)) {
                    smallGridLayer.addTo(map);
                  }
                })
                .catch(() => {});
              return;
            }

            if (map.hasLayer(smallGridLayer)) {
              map.removeLayer(smallGridLayer);
            }
            if (!map.hasLayer(largeGridLayer)) {
              largeGridLayer.addTo(map);
            }
          };

          syncGridLayersByZoom();
          map.on("zoomend", syncGridLayersByZoom);
        } else {
          farmBoundary = L.circle([latitude, longitude], {
            radius: 50,
            color: "#14532d",
            fillColor: "#16a34a",
            fillOpacity: 0.15,
          }).addTo(map);

          if (!isCancelled) {
            setDashboardData((prev) => ({
              ...prev,
              temperature: getSeededNumber(`${farmSeed}-temp`, 21, 37),
              humidity: getSeededNumber(`${farmSeed}-hum`, 40, 90),
              moisture: getSeededNumber(`${farmSeed}-soil`, 25, 85),
            }));
          }
        }

        if (farmBoundary) {
          map.fitBounds(farmBoundary.getBounds(), { padding: [20, 20] });
        }

        setTimeout(() => {
          if (isCancelled || !leafletMapRef.current) return;
          leafletMapRef.current.invalidateSize();
        }, 100);
      } catch (err) {
        if (isCancelled) return;
        console.error("Leaflet map error:", err);
        setMapError("Unable to load map");
        setMapToast({
          visible: true,
          type: "error",
          message: "Unable to load farm map.",
        });
      }
    };

    initMap();

    return () => {
      isCancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [selectedFarm]);

  useEffect(() => {
    if (activeCase) return;

    const generateData = () => {
      const newData = {
        temperature: 0,
        moisture: 0,
        nutrients: Math.floor(Math.random() * 60) + 30,
        ph: (Math.random() * 3 + 5).toFixed(1),
        humidity: 0,
        waterLevel: Math.floor(Math.random() * 70) + 20,

        cases: [
          {
            caseId: `CASE-${Math.floor(Math.random() * 10000)}`,
            gridId: `GRID-${Math.floor(Math.random() * 24) + 1}`.padStart(
              7,
              "GRID-00",
            ),
            urgency:
              Math.random() > 0.7
                ? "high"
                : Math.random() > 0.4
                  ? "moderate"
                  : "low",
            problem: "Leaf Blight Detected",
            recommendations: "Apply fungicide spray, improve drainage",
            location: { lat: 12.9716, lng: 77.5946 },
            status: "Active",
          },
          {
            caseId: `CASE-${Math.floor(Math.random() * 10000)}`,
            gridId: `GRID-${Math.floor(Math.random() * 24) + 1}`.padStart(
              7,
              "GRID-00",
            ),
            urgency:
              Math.random() > 0.7
                ? "high"
                : Math.random() > 0.4
                  ? "moderate"
                  : "low",
            problem: "Pest Infestation",
            recommendations: "Use organic pesticide, monitor closely",
            location: { lat: 12.9716, lng: 77.5946 },
            status: "Under Treatment",
          },
          {
            caseId: `CASE-${Math.floor(Math.random() * 10000)}`,
            gridId: `GRID-${Math.floor(Math.random() * 24) + 1}`.padStart(
              7,
              "GRID-00",
            ),
            urgency:
              Math.random() > 0.7
                ? "high"
                : Math.random() > 0.4
                  ? "moderate"
                  : "low",
            problem: "Nutrient Deficiency",
            recommendations:
              "Apply balanced fertilizer, soil testing recommended",
            location: { lat: 12.9716, lng: 77.5946 },
            status: "Monitoring",
          },
        ],
      };

      setDashboardData((prev) => {
        const nextData = {
          ...newData,
          temperature: prev.temperature,
          humidity: prev.humidity,
          moisture: prev.moisture,
        };

        if (linkedGridCase) {
          nextData.cases = [
            linkedGridCase,
            ...nextData.cases.filter(
              (caseItem) => caseItem.gridId !== linkedGridCase.gridId,
            ),
          ];
        }

        return nextData;
      });
    };

    generateData();
    const interval = setInterval(generateData, 10000);
    return () => clearInterval(interval);
  }, [activeCase, linkedGridCase]);

  const getRiskLevel = (value, type) => {
    if (type === "temperature") {
      if (value > 30) return "high";
      if (value < 25) return "low";
      return "moderate";
    }

    if (type === "humidity") {
      if (value > 70) return "high";
      if (value < 50) return "low";
      return "moderate";
    }

    if (type === "moisture") {
      if (value < 40) return "high";
      if (value > 70) return "low";
      return "moderate";
    }

    return "low";
  };

  const getMetricIcon = (type) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="metric-icon" />;
      case "moisture":
        return <Sprout className="metric-icon" />;
      case "nutrients":
        return <FlaskConical className="metric-icon" />;
      case "ph":
        return <Beaker className="metric-icon" />;
      case "waterLevel":
        return <Droplets className="metric-icon" />;
      default:
        return null;
    }
  };

  const activeCaseGridMetrics = getCaseGridMetrics(activeCase);
  const gridCropPlan = getGridCropPlan(selectedGrid);

  const handleViewGridInActiveCases = () => {
    if (!selectedGrid) return;

    const linkedCase = {
      caseId: `CASE-${selectedGrid.gridId}`,
      gridId: selectedGrid.gridId,
      urgency: selectedGrid.risk,
      problem:
        selectedGrid.metricScope === "overall"
          ? "Zone condition alert"
          : "Grid condition alert",
      recommendations:
        "Review this grid and continue monitoring temperature, humidity, and soil moisture.",
      location: selectedFarm
        ? {
            lat: Number(selectedFarm.latitude),
            lng: Number(selectedFarm.longitude),
          }
        : null,
      status: "Active",
      gridDetails: {
        temperature: selectedGrid.temperature,
        humidity: selectedGrid.humidity,
        moisture: selectedGrid.moisture,
        cellArea: selectedGrid.cellArea,
        pressure: selectedGrid.pressure,
        windSpeed: selectedGrid.windSpeed,
        solarRadiation: selectedGrid.solarRadiation,
        ndvi: selectedGrid.ndvi,
        soilPh: selectedGrid.soilPh,
        nitrogen: selectedGrid.nitrogen,
        phosphorus: selectedGrid.phosphorus,
        potassium: selectedGrid.potassium,
        risk: selectedGrid.risk,
      },
    };
    setLinkedGridCase(linkedCase);

    setDashboardData((prev) => {
      const existingIndex = prev.cases.findIndex(
        (caseItem) => caseItem.gridId === selectedGrid.gridId,
      );

      if (existingIndex !== -1) {
        const updatedCases = [...prev.cases];
        updatedCases[existingIndex] = {
          ...updatedCases[existingIndex],
          ...linkedCase,
        };
        return { ...prev, cases: updatedCases };
      }

      return { ...prev, cases: [linkedCase, ...prev.cases] };
    });

    setSelectedGrid(null);
    setActiveCase(linkedCase);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">{t.dashboard}</h1>
          <div className="title-underline"></div>
        </div>

        <div className="main-section">
          <div className="map-container">
            <div className="map-card">
              <div className="map-header">
                <MapPin className="map-icon" />
                <h3 className="map-title">{t.farmLocation}</h3>

                <div className="farm-selector-container">
                  <select
                    className="farm-selector"
                    value={selectedFarm?.farm_id || ""}
                    onChange={(e) => {
                      if (e.target.value === "add-new") {
                        setShowAddFarmModal(true);
                        return;
                      }

                      const farm = farms.find(
                        (f) => f.farm_id == e.target.value,
                      );

                      setSelectedFarm(farm);
                    }}
                  >
                    {farms.map((farm) => (
                      <option key={farm.farm_id} value={farm.farm_id}>
                        🌾 {farm.farm_name}
                      </option>
                    ))}

                    <option value="add-new">➕ Add New Land</option>
                  </select>
                </div>
              </div>

              <div className="map-placeholder">
                {mapError && <div className="map-error">{mapError}</div>}

                <div className="map-wrapper">
                  {mapToast.visible && (
                    <div className={`map-toast ${mapToast.type}`}>
                      {mapToast.message}
                    </div>
                  )}

                  <div
                    key={selectedFarm?.farm_id}
                    ref={mapRef}
                    id="map"
                    className={farms.length === 0 ? "map-blur" : ""}
                    style={{
                      height: "100%",
                      width: "100%",
                      borderRadius: "12px",
                    }}
                  ></div>

                  {farms.length === 0 && !loadingFarms && (
                    <div className="no-farm-overlay">
                      <div className="no-farm-card">
                        <MapPin className="no-farm-icon" />

                        <h3>No land added yet</h3>

                        <p>
                          Add your farm to start monitoring crops and receiving
                          insights.
                        </p>

                        <button
                          className="add-farm-btn"
                          onClick={() => setShowAddFarmModal(true)}
                        >
                          + Add Land
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="map-disclaimer-inline">
                <strong>Operational Farm Area</strong>
                <span>
                  Boundary shown is farmer-declared for advisory and monitoring
                  purposes only.
                </span>
              </div>
            </div>
          </div>
          <div className="grid-container parameters-panel">
            <div className="cases-header">
              <h3 className="cases-title">{t.parameters}</h3>
            </div>
            <div className="parameters-grid">
              {["temperature", "moisture", "humidity"].map((type) => {
                const value = dashboardData[type];
                const risk = getRiskLevel(value, type);
                const percentage =
                  type === "temperature" ? (value / 40) * 100 : value;

                return (
                  <div key={type} className={`parameter-card ${risk}-risk`}>
                    <div className="card-background"></div>
                    <div className="card-content">
                      <div className="parameter-header">
                        <div className="parameter-title-section">
                          <div
                            className={`parameter-icon-container ${risk}-gradient`}
                          >
                            {getMetricIcon(type)}
                          </div>
                          <h3 className="parameter-title">{t[type]}</h3>
                        </div>
                        <div className={`risk-badge ${risk}-gradient`}>
                          {t[risk]}
                        </div>
                      </div>

                      <div className="parameter-value-section">
                        <span className="parameter-value">{value}</span>
                        <span className="parameter-unit">
                          {type === "temperature"
                            ? "°C"
                            : type === "ph"
                              ? "pH"
                              : "%"}
                        </span>
                      </div>

                      <div className="progress-container">
                        <div className="progress-track">
                          <div
                            className={`progress-bar ${risk}-gradient`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="progress-labels">
                          <span>0</span>
                          <span>
                            {type === "temperature" ? "40°C" : "100%"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="recommendations-section">
          <div className="section-header">
            <h2 className="section-title">{t.recommendations}</h2>
            <div className="section-underline"></div>
          </div>
          <div className="recommendations-grid">
            <div className="recommendation-card irrigation">
              <div className="recommendation-icon">💧</div>
              <h4 className="recommendation-title">Irrigation Schedule</h4>
              <p className="recommendation-text">
                Based on current soil moisture levels, consider adjusting
                irrigation timing for optimal crop growth.
              </p>
            </div>
            <div className="recommendation-card health">
              <div className="recommendation-icon">🌱</div>
              <h4 className="recommendation-title">Crop Health</h4>
              <p className="recommendation-text">
                Monitor for early signs of disease given current humidity
                conditions. Regular inspection recommended.
              </p>
            </div>
            <div className="recommendation-card weather">
              <div className="recommendation-icon">🌤️</div>
              <h4 className="recommendation-title">Weather Alert</h4>
              <p className="recommendation-text">
                Temperature fluctuations expected. Prepare protective measures
                for sensitive crops.
              </p>
            </div>
            <div className="recommendation-card fertilizer">
              <div className="recommendation-icon">🧪</div>
              <h4 className="recommendation-title">Fertilizer Application</h4>
              <p className="recommendation-text">
                Soil analysis suggests nitrogen deficiency in some areas.
                Consider targeted fertilizer application.
              </p>
            </div>
          </div>
        </div>

        <div className="bottom-section">
          <div className="cases-container" ref={activeCasesRef}>
            <div className="cases-header">
              <h3 className="cases-title">{t.activeCases}</h3>
            </div>
            <div className="cases-list">
              {dashboardData.cases.map((case_, index) => (
                <div key={index} className={`case-item ${case_.urgency}-risk`}>
                  <div
                    className="case-item-header"
                    onClick={() => setActiveCase(case_)}
                  >
                    <div className="case-info">
                      <div
                        className={`case-icon-container ${case_.urgency}-gradient`}
                      >
                        <AlertTriangle className="case-icon" />
                      </div>
                      <div className="case-details">
                        <div className="case-id">{case_.caseId}</div>
                        <div className="case-timestamp">
                          <Clock className="timestamp-icon" />
                          Just now
                        </div>
                      </div>
                    </div>
                    <div className="case-header-right">
                      <div
                        className={`urgency-badge ${case_.urgency}-gradient`}
                      >
                        {t[case_.urgency]}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeCase && (
        <div className="case-modal-overlay" onClick={() => setActiveCase(null)}>
          <div className="case-modal" onClick={(e) => e.stopPropagation()}>
            <div className="case-modal-header">
              <h3>{activeCase.caseId}</h3>
              <button
                className="case-modal-close"
                onClick={() => setActiveCase(null)}
              >
                ×
              </button>
            </div>

            <div className="case-modal-body">
              <div className="modal-row">
                <span>Grid ID</span>
                <strong>{activeCase.gridId}</strong>
              </div>

              <div className="modal-row">
                <span>Status</span>
                <strong>{activeCase.status}</strong>
              </div>

              {activeCaseGridMetrics && (
                <div className="case-grid-scroll-wrap">
                  <div className="case-grid-scroll">
                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaExclamationTriangle className="case-grid-pill-icon icon-risk" />
                        <span>Risk</span>
                      </div>
                      <strong
                        className={`case-grid-pill-value risk-${activeCaseGridMetrics.risk}`}
                      >
                        {activeCaseGridMetrics.risk.toUpperCase()}
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaTemperatureHigh className="case-grid-pill-icon icon-temp" />
                        <span>Temperature</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.temperature} °C
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaTint className="case-grid-pill-icon icon-humidity" />
                        <span>Humidity</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.humidity}%
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaSeedling className="case-grid-pill-icon icon-moisture" />
                        <span>Soil Moisture</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.moisture}%
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaTachometerAlt className="case-grid-pill-icon icon-pressure" />
                        <span>Pressure</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.pressure} kPa
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaWind className="case-grid-pill-icon icon-wind" />
                        <span>Wind Speed</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.windSpeed} m/s
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaSun className="case-grid-pill-icon icon-solar" />
                        <span>Solar Radiation</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.solarRadiation} W/m2
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaLeaf className="case-grid-pill-icon icon-ndvi" />
                        <span>NDVI</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.ndvi}
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaVial className="case-grid-pill-icon icon-ph" />
                        <span>Soil pH</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.soilPh} pH
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaFlask className="case-grid-pill-icon icon-nitrogen" />
                        <span>Nitrogen</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.nitrogen} mg/kg
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaMicroscope className="case-grid-pill-icon icon-phosphorus" />
                        <span>Phosphorus</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.phosphorus} mg/kg
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaDna className="case-grid-pill-icon icon-potassium" />
                        <span>Potassium</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.potassium} mg/kg
                      </strong>
                    </div>

                    <div className="case-grid-pill">
                      <div className="case-grid-pill-label">
                        <FaRulerCombined className="case-grid-pill-icon icon-area" />
                        <span>Cell Area</span>
                      </div>
                      <strong className="case-grid-pill-value">
                        {activeCaseGridMetrics.cellArea} m²
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-section problem">
                <h4>Problem</h4>
                <p>{activeCase.problem}</p>
              </div>

              <div className="modal-section recommendation">
                <h4>Recommendations</h4>
                <p>{activeCase.recommendations}</p>
              </div>

              <button
                className="resolve-btn"
                onClick={() => setActiveCase(null)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedGrid && (
        <div
          className="grid-popup-overlay"
          onClick={() => setSelectedGrid(null)}
        >
          <div className="grid-popup" onClick={(e) => e.stopPropagation()}>
            <div className="grid-popup-header">
              <div className="grid-popup-title-wrap">
                <h3>{selectedGrid.gridId}</h3>
                <p>
                  {selectedGrid.metricScope === "overall"
                    ? "Overall parameters"
                    : "Individual grid parameters"}
                </p>
              </div>
              <button
                className="popup-close"
                aria-label="Close grid details"
                onClick={() => setSelectedGrid(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid-popup-body">
              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaExclamationTriangle className="grid-popup-row-icon icon-risk" />
                  <span>Risk</span>
                </div>
                <strong className={`grid-popup-row-value risk-${selectedGrid.risk}`}>
                  {selectedGrid.risk.toUpperCase()}
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaTemperatureHigh className="grid-popup-row-icon icon-temp" />
                  <span>Temperature</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.temperature} °C
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaTint className="grid-popup-row-icon icon-humidity" />
                  <span>Humidity</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.humidity}%
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaSeedling className="grid-popup-row-icon icon-moisture" />
                  <span>Soil Moisture</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.moisture}%
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaTachometerAlt className="grid-popup-row-icon icon-pressure" />
                  <span>Pressure</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.pressure} kPa
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaWind className="grid-popup-row-icon icon-wind" />
                  <span>Wind Speed</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.windSpeed} m/s
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaSun className="grid-popup-row-icon icon-solar" />
                  <span>Solar Radiation</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.solarRadiation} W/m2
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaLeaf className="grid-popup-row-icon icon-ndvi" />
                  <span>NDVI</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.ndvi}
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaVial className="grid-popup-row-icon icon-ph" />
                  <span>Soil pH</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.soilPh} pH
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaFlask className="grid-popup-row-icon icon-nitrogen" />
                  <span>Nitrogen</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.nitrogen} mg/kg
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaMicroscope className="grid-popup-row-icon icon-phosphorus" />
                  <span>Phosphorus</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.phosphorus} mg/kg
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaDna className="grid-popup-row-icon icon-potassium" />
                  <span>Potassium</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.potassium} mg/kg
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaRulerCombined className="grid-popup-row-icon icon-area" />
                  <span>Cell Area</span>
                </div>
                <strong className="grid-popup-row-value">
                  {selectedGrid.cellArea} m²
                </strong>
              </div>

              <div className="grid-popup-row">
                <div className="grid-popup-row-label">
                  <FaSeedling className="grid-popup-row-icon icon-moisture" />
                  <span>Crop Harvest Plan</span>
                </div>
                <strong className="grid-popup-row-value">
                  Based on current grid readings
                </strong>
              </div>

              {gridCropPlan.map((crop, index) => (
                <div className="grid-popup-row" key={crop.name}>
                  <div className="grid-popup-row-label">
                    <FaSeedling className="grid-popup-row-icon icon-moisture" />
                    <span>{`Crop ${index + 1}: ${crop.name}`}</span>
                  </div>
                  <strong className="grid-popup-row-value">
                    Harvest: {crop.harvestMonth} | Expected: {crop.expectedTime}
                  </strong>
                </div>
              ))}
            </div>

            <button
              className="resolve-btn grid-link-btn"
              onClick={handleViewGridInActiveCases}
            >
              View In Active Cases
            </button>

            <button
              className="resolve-btn grid-resolve-btn"
              onClick={() => setSelectedGrid(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <AddFarmModal
        isOpen={showAddFarmModal}
        onClose={() => setShowAddFarmModal(false)}
        onFarmAdded={(newFarm) => {
          setFarms((prev) => [...prev, newFarm]);
          setSelectedFarm(newFarm);
        }}
      />
    </div>
  );
};

export default Dashboard;

