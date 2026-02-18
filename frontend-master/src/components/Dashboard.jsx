import { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import {
  Thermometer,
  Droplets,
  Sprout,
  AlertTriangle,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Beaker,
  Leaf,
  Eye,
} from "lucide-react";
import AddFarmModal from "./AddFarmModal";

// Mock translations for demo - replace with your actual translations
const translations = {
  en: {
    dashboard: "Agricultural Dashboard",
    temperature: "Temperature",
    humidity: "Humidity",
    moisture: "Soil Moisture",
    high: "High",
    moderate: "Moderate",
    low: "Low",
    risk: "Risk",
    activeCases: "Active Cases",
    caseId: "Case ID",
    gridId: "Grid ID",
    problem: "Problem",
    recommendations: "Recommendations",
    gridLocation: "Grid Location",
    farmLocation: "Farm Location",
    parameters: "Parameters",
    waterLevel: "Water Level",
    soilContent: "Soil Content",
    nutrition: "Nutrition",
    gridView: "Grid View",
    viewDetails: "View Details",
  },
};

const Dashboard = ({ currentLanguage = "en", translatedText }) => {
  const [dashboardData, setDashboardData] = useState({
    temperature: 0,
    humidity: 0,
    moisture: 0,
    cases: [],
  });
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [activeGridPopup, setActiveGridPopup] = useState(null);

  const [farms, setFarms] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);

  // 🌾 Farmer-declared land size (hectares) – later fetch from backend

  const [activeCase, setActiveCase] = useState(null);

  const [mapError, setMapError] = useState(null);
  // const apiKey = "ploikagbfmtisxflsxfuwhszpqmbwkdlzvtg"; // MapmyIndia API Key
  const mapRef = useRef(null);

  const leafletMapRef = useRef(null); //new

  // Fallback to translations["en"] if translatedText is missing
  const fallbackText = translations[currentLanguage] || translations["en"];
  const t = new Proxy(translatedText || fallbackText, {
    get: (target, prop) => target[prop] || prop,
  });

  // Generate grid data
  const generateGridData = () => {
    const grids = [];
    for (let i = 1; i <= 24; i++) {
      const status =
        Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "moderate" : "low";
      grids.push({
        id: `GRID-${i.toString().padStart(3, "0")}`,
        status,
        waterLevel: Math.floor(Math.random() * 40) + 30,
        moisture: Math.floor(Math.random() * 50) + 25,
        soilContent: Math.floor(Math.random() * 30) + 40,
        nutrition: Math.floor(Math.random() * 35) + 45,
        recommendations:
          status === "high"
            ? "Immediate irrigation needed, check drainage system"
            : status === "moderate"
              ? "Monitor closely, consider fertilizer application"
              : "Maintain current conditions, regular monitoring",
      });
    }
    return grids;
  };

  const [gridData, setGridData] = useState(generateGridData());
  // Convert meters to latitude degrees
  const metersToLat = (m) => m / 111320;

  // Convert meters to longitude degrees (latitude dependent)
  const metersToLng = (m, lat) =>
    m / (111320 * Math.cos((lat * Math.PI) / 180));

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

        // set default farm
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
  }, []); // ✅ FIXED

  useEffect(() => {
    const API_URL = "https://agri1-32qq.onrender.com";
    const token = localStorage.getItem("token");

    const initMap = async () => {
      try {
        if (!mapRef.current || leafletMapRef.current || farms.length === 0)
          return;

        // 🔁 Fallback coordinates (Bangalore)
        if (!selectedFarm) return;

        let latitude = Number(selectedFarm.latitude);
        let longitude = Number(selectedFarm.longitude);

        // 🌐 Try API (non-blocking)
        try {
          const res = await fetch(`${API_URL}/api/farmer/location`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            const lat = Number(data.latitude);
            const lng = Number(data.longitude);

            if (lat && lng) {
              latitude = lat;
              longitude = lng;
            }
          }
        } catch (e) {
          console.warn(
            "Location API failed (CORS or server error). Using fallback.",
          );
        }

        // 🌾 UI offset
        const visualLat = latitude + 0.0025;
        const visualLng = longitude + 0.0025;

        // 🔥 HARD RESET (prevents double-init)
        if (mapRef.current && mapRef.current._leaflet_id) {
          mapRef.current._leaflet_id = null;
        }

        // 🗺️ Init map
        const map = L.map(mapRef.current).setView([visualLat, visualLng], 16);
        leafletMapRef.current = map;

        // 🌍 Tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        // 📍 Marker
        L.marker([visualLat, visualLng])
          .addTo(map)
          .bindPopup("Farm Location")
          .openPopup();

        // 🌾 Farm boundary
        const landSizeHectares = Number(
          selectedFarm.area_hectares || selectedFarm.landSize || 1,
        );

        const areaSqMeters = landSizeHectares * 10000;
        const sideMeters = Math.sqrt(areaSqMeters);

        const metersToLat = (m) => m / 111320;
        const metersToLng = (m, lat) =>
          m / (111320 * Math.cos((lat * Math.PI) / 180));

        const halfLat = metersToLat(sideMeters / 2);
        const halfLng = metersToLng(sideMeters / 2, visualLat);

        const farmBounds = [
          [visualLat - halfLat, visualLng - halfLng],
          [visualLat - halfLat, visualLng + halfLng],
          [visualLat + halfLat, visualLng + halfLng],
          [visualLat + halfLat, visualLng - halfLng],
        ];

        L.polygon(farmBounds, {
          color: "#14532d",
          weight: 2,
          dashArray: "6,6",
          fillColor: "#16a34a",
          fillOpacity: 0.15,
        })
          .addTo(map)
          .bindPopup(
            `<strong>Operational Farm Area</strong><br/>
           ${landSizeHectares} hectares<br/>
           <small>Farmer-declared • Advisory use only</small>`,
          );

        // 🧩 Grid drawing
        const gridRows = 5;
        const gridCols = 5;
        let index = 0;

        const latStep = (halfLat * 2) / gridRows;
        const lngStep = (halfLng * 2) / gridCols;

        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            if (!gridData[index]) continue;

            const grid = gridData[index++];
            const startLat = visualLat - halfLat + row * latStep;
            const startLng = visualLng - halfLng + col * lngStep;

            const bounds = [
              [startLat, startLng],
              [startLat + latStep, startLng + lngStep],
            ];

            const color =
              grid.status === "high"
                ? "#ef4444"
                : grid.status === "moderate"
                  ? "#f59e0b"
                  : "#10b981";

            const rectangle = L.rectangle(bounds, {
              color,
              weight: 1,
              fillOpacity: 0.35,
            }).addTo(map);

            rectangle.on("click", () => {
              map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
              setSelectedGrid(grid);
              setActiveGridPopup(grid);
            });
          }
        }
      } catch (err) {
        console.error("Leaflet map error:", err);
        setMapError("Unable to load map");
      }
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [selectedFarm]);
  // ✅ IMPORTANT: EMPTY DEPENDENCY

  useEffect(() => {
    if (activeCase) return;
    const generateData = () => {
      const newData = {
        temperature: Math.floor(Math.random() * 15) + 20,
        humidity: Math.floor(Math.random() * 40) + 40,
        moisture: Math.floor(Math.random() * 50) + 30,
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
  };

  const getMetricIcon = (type) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="metric-icon" />;
      case "humidity":
        return <Droplets className="metric-icon" />;
      case "moisture":
        return <Sprout className="metric-icon" />;
      default:
        return null;
    }
  };

  const getGridIcon = (type) => {
    switch (type) {
      case "temperature":
        return <Droplets className="grid-metric-icon" />;
      case "humidity":
        return <Sprout className="grid-metric-icon" />;
      case "moisture":
        return <Beaker className="grid-metric-icon" />;
      case "soilContent":
        return <Leaf className="grid-metric-icon" />;
      default:
        return null;
    }
  };

  const toggleCase = (caseId) => {
    setOpenCases((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  };

  const handleGridClick = (grid) => {
    setSelectedGrid(grid);
    setActiveGridPopup(grid);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">{t.dashboard}</h1>
          <div className="title-underline"></div>
        </div>
        {/* First Section: Map and Parameters */}
        <div className="main-section">
          <div className="map-container">
            <div className="map-card">
              <div className="map-header">
                <MapPin className="map-icon" />
                <h3 className="map-title">{t.farmLocation}</h3>

                {farms.length > 0 && (
                  <select
                    className="farm-selector"
                    value={selectedFarm?.farm_id || ""}
                    onChange={(e) => {
                      const farm = farms.find(
                        (f) => f.farm_id == e.target.value,
                      );

                      setSelectedFarm(farm);
                    }}
                  >
                    {farms.map((farm) => (
                      <option key={farm.farm_id} value={farm.farm_id}>
                        {farm.farm_name}
                      </option>
                    ))}
                  </select>
                )}

                {selectedGrid && (
                  <span className="selected-grid-info">
                    - Viewing {selectedGrid.id}
                  </span>
                )}
              </div>
              <div className="map-placeholder">
                {mapError && <div className="map-error">{mapError}</div>}

                {/* MAP - full space */}
                <div className="map-wrapper">
                  <div
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

              {/* Land declaration disclaimer - below map box */}
              <div className="map-disclaimer-inline">
                <strong>Operational Farm Area</strong>
                <span>
                  Boundary shown is farmer-declared for advisory & monitoring
                  purposes only.
                </span>
              </div>
            </div>
          </div>
          <div className="parameters-container">
            <h2 className="parameters-title">{t.parameters}</h2>
            <div className="parameters-grid">
              {["temperature", "humidity", "moisture"].map((type) => {
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
                          {type === "temperature" ? "°C" : "%"}
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
        {/* Second Section: Recommendations */}
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
        {/* Third Section: Grid View and Active Cases */}
        <div className="bottom-section">
          <div className="grid-container">
            <div className="grid-header">
              <Grid3X3 className="grid-icon" />
              <h3 className="grid-title">{t.gridView}</h3>
            </div>
            <div className="grid-wrapper">
              {gridData.map((grid) => (
                <div key={grid.id} className="grid-item-container">
                  <div
                    className={`grid-item ${grid.status}-status ${
                      selectedGrid?.id === grid.id ? "selected" : ""
                    }`}
                    onClick={() => handleGridClick(grid)}
                  >
                    <span className="grid-id">{grid.id}</span>
                    <div
                      className={`status-indicator ${grid.status}-indicator`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid-legend">
              <div className="legend-item">
                <div className="legend-color-low-status"></div>
                <span id="low">Low Risk</span>
              </div>
              <div className="legend-item">
                <div className="legend-color-moderate-status"></div>
                <span id="moderate">Moderate Risk</span>
              </div>
              <div className="legend-item">
                <div className="legend-color-high-status"></div>
                <span id="high">High Risk</span>
              </div>
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

      {activeGridPopup && (
        <div
          className="grid-popup-overlay"
          onClick={() => setActiveGridPopup(null)}
        >
          <div className="grid-popup" onClick={(e) => e.stopPropagation()}>
            <div className="grid-popup-header">
              <h3>{activeGridPopup.id} Details</h3>
              <button
                className="popup-close"
                onClick={() => setActiveGridPopup(null)}
              >
                ✕
              </button>
            </div>

            <div className="grid-metrics">
              <div className="grid-metric">
                <span>Water Level</span>
                <strong>{activeGridPopup.waterLevel}%</strong>
              </div>
              <div className="grid-metric">
                <span>Soil Moisture</span>
                <strong>{activeGridPopup.moisture}%</strong>
              </div>
              <div className="grid-metric">
                <span>Soil Content</span>
                <strong>{activeGridPopup.soilContent}%</strong>
              </div>
              <div className="grid-metric">
                <span>Nutrition</span>
                <strong>{activeGridPopup.nutrition}%</strong>
              </div>
            </div>

            <div className="grid-recommendations">
              <h4>Recommendations</h4>
              <p>{activeGridPopup.recommendations}</p>
            </div>

            <button className="resolve-btn">Resolve</button>
          </div>
        </div>
      )}

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

      {/* ADD FARM MODAL — ADD THIS BLOCK HERE */}
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
