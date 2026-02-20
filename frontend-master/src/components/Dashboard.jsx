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

const getGridRisk = (temperature, humidity, moisture) => {
  if (temperature > 32 || humidity > 78 || moisture < 35) return "high";
  if (temperature > 28 || humidity > 65 || moisture < 50) return "moderate";
  return "low";
};

const gridRiskColor = {
  high: "#ef4444",
  moderate: "#f59e0b",
  low: "#10b981",
};

const Dashboard = ({ currentLanguage = "en", translatedText }) => {
  const [dashboardData, setDashboardData] = useState({
    temperature: 0,
    moisture: 0,
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

  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  const fallbackText = translations[currentLanguage] || translations.en;
  const t = new Proxy(translatedText || fallbackText, {
    get: (target, prop) => target[prop] || prop,
  });

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const API_URL = "https://agri1-32qq.onrender.com";
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/api/farm/my`, {
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
        console.error("Farm fetch error:", err);
        setFarms([]);
      } finally {
        setLoadingFarms(false);
      }
    };

    fetchFarms();
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

        const farmMarkerIcon = L.icon({
          iconRetinaUrl: markerIcon2x,
          iconUrl: markerIcon,
          shadowUrl: markerShadow,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        L.marker([latitude, longitude], { icon: farmMarkerIcon })
          .addTo(map)
          .bindPopup(selectedFarm.farm_name);

        const rawLandSizeHectares = Number(
          selectedFarm.area_hectares || selectedFarm.landSize || 1,
        );
        const landSizeHectares =
          Number.isFinite(rawLandSizeHectares) && rawLandSizeHectares > 0
            ? rawLandSizeHectares
            : 1;
        const areaSqMeters = landSizeHectares * 10000;
        const sideMeters = Math.sqrt(areaSqMeters);
        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, lat) =>
          m / (111320 * Math.cos((lat * Math.PI) / 180));
        const halfSideMeters = sideMeters / 2;
        const halfLat = metersToLat(halfSideMeters);
        const halfLng = metersToLng(halfSideMeters, latitude);

        let farmBoundary;

        let polygonCoords = selectedFarm.polygon_coordinates;

        if (typeof polygonCoords === "string") {
          polygonCoords = JSON.parse(polygonCoords);
        }

        if (polygonCoords && polygonCoords.length >= 4) {
          // DRAW boundary FIRST
          farmBoundary = L.polygon(
            polygonCoords.map((point) => [
              Number(point.lat),
              Number(point.lng),
            ]),
            {
              color: "#14532d",
              weight: 2,
              dashArray: "6,6",
              fillColor: "#16a34a",
              fillOpacity: 0.15,
            },
          ).addTo(map);

          // THEN generate turf grid
          const turfCoords = polygonCoords.map((p) => [
            Number(p.lng),
            Number(p.lat),
          ]);

          turfCoords.push(turfCoords[0]);

          const farmPolygon = turf.polygon([turfCoords]);

          const bbox = turf.bbox(farmPolygon);

          const grid = turf.squareGrid(bbox, GRID_CELL_SIZE_METERS / 1000, {
            units: "kilometers",
          });

          grid.features.forEach((cell, index) => {
            let intersection;

            try {
              intersection = turf.intersect(cell, farmPolygon);
            } catch {
              return;
            }

            if (!intersection) return;

            const ratio = turf.area(intersection) / turf.area(cell);

            if (ratio < 0.51) return;

            const coords = cell.geometry.coordinates[0].map((c) => [
              c[1],
              c[0],
            ]);

            const seedPrefix = `${selectedFarm.farm_id}-${index}`;

            const temperature = getSeededNumber(`${seedPrefix}-temp`, 21, 37);

            const humidity = getSeededNumber(`${seedPrefix}-hum`, 40, 90);

            const moisture = getSeededNumber(`${seedPrefix}-soil`, 25, 85);

            const risk = getGridRisk(temperature, humidity, moisture);

            const fillColor = gridRiskColor[risk];

            const gridPolygon = L.polygon(coords, {
              color: "#166534",
              weight: 1,
              fillColor,
              fillOpacity: 0.45,
            }).addTo(map);

            gridPolygon.on("click", () => {
              setSelectedGrid({
                gridId: `GRID-${index + 1}`,
                temperature,
                humidity,
                moisture,
                risk,
                cellArea: Math.round(turf.area(cell)),
              });
            });
          });
        } else {
          farmBoundary = L.circle([latitude, longitude], {
            radius: 50,
            color: "#14532d",
            fillColor: "#16a34a",
            fillOpacity: 0.15,
          }).addTo(map);
        }

        if (farmBoundary) {
          map.fitBounds(farmBoundary.getBounds(), { padding: [20, 20] });
        }
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
        temperature: Math.floor(Math.random() * 18) + 18,
        moisture: Math.floor(Math.random() * 50) + 30,
        nutrients: Math.floor(Math.random() * 60) + 30,
        ph: (Math.random() * 3 + 5).toFixed(1),
        humidity: Math.floor(Math.random() * 40) + 40,
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

      setDashboardData(newData);
    };

    generateData();
    const interval = setInterval(generateData, 10000);
    return () => clearInterval(interval);
  }, [activeCase]);

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
          <div className="grid-container">
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

          <div className="cases-container">
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
                className="popup-close"
                onClick={() => setActiveCase(null)}
              >
                ✕
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
              <h3>{selectedGrid.gridId}</h3>
              <button
                className="popup-close"
                onClick={() => setSelectedGrid(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-row">
              <span>Risk</span>
              <strong>{selectedGrid.risk.toUpperCase()}</strong>
            </div>

            <div className="modal-row">
              <span>Temperature</span>
              <strong>{selectedGrid.temperature} °C</strong>
            </div>

            <div className="modal-row">
              <span>Humidity</span>
              <strong>{selectedGrid.humidity}%</strong>
            </div>

            <div className="modal-row">
              <span>Soil Moisture</span>
              <strong>{selectedGrid.moisture}%</strong>
            </div>

            <div className="modal-row">
              <span>Cell Area</span>
              <strong>{selectedGrid.cellArea} m²</strong>
            </div>

            <button
              className="resolve-btn"
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
