"use client";

import { useState, useEffect } from "react";
import "./Dashboard.css";
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
  const [openCases, setOpenCases] = useState({});
  const [mapError, setMapError] = useState(null);
  const apiKey = "890b927c2d4d2642a7179eca68750ce4"; // MapmyIndia API Key

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

  useEffect(() => {
  const token = localStorage.getItem("token");

  const fetchLocationAndLoadMap = async () => {
    try {
      const res = await fetch("https://frontend-k-backend.onrender.com/api/farmer/location", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.latitude || !data.longitude) {
        console.error("Location data not found");
        return;
      }

      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);

      if (document.getElementById("mapmyindia-script")) {
        if (!window.mapInstance && document.getElementById("map")) {
          window.mapInstance = new window.MapmyIndia.Map("map", {
            center: [lat, lng],
            zoom: 14,
          });
          window.L.marker([lat, lng])
            .addTo(window.mapInstance)
            .bindPopup("Your Farm Location")
            .openPopup();
        }
        return;
      }

      const script = document.createElement("script");
      script.id = "mapmyindia-script";
      script.src = `https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/map_load?v=1.5`;
      script.async = true;
      script.onload = () => {
  setTimeout(() => {
    if (
      window.MapmyIndia &&
      window.MapmyIndia.Map &&
      !window.mapInstance &&
      document.getElementById("map")
    ) {
      window.mapInstance = new window.MapmyIndia.Map("map", {
        center: [lat, lng],
        zoom: 14,
      });
      window.L.marker([lat, lng])
        .addTo(window.mapInstance)
        .bindPopup("Your Farm Location")
        .openPopup();
    } else {
      console.error("MapmyIndia SDK not loaded properly or map already initialized");
    }
  }, 100);
};

      script.onerror = () => {
        console.error("Failed to load MapmyIndia script");
      };
      document.body.appendChild(script);
    } catch (err) {
      console.error("Error loading location and map:", err);
    }
  };

  fetchLocationAndLoadMap();
}, []);


  useEffect(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        await fetch("https://frontend-k-backend.onrender.com/api/farmer/location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ latitude, longitude }),
        });
      },
      (error) => console.error("Location permission denied:", error)
    );
  } else {
    alert("Geolocation not supported in your browser");
  }
}, []);

  useEffect(() => {
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
              "GRID-00"
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
              "GRID-00"
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
              "GRID-00"
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
  }, []);

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
                {selectedGrid && (
                  <span className="selected-grid-info">
                    - Viewing {selectedGrid.id}
                  </span>
                )}
              </div>
              <div className="map-placeholder">
                {mapError && (
                  <div className="map-error">{mapError}</div>
                )}
                <div
                  id="map"
                  style={{
                    height: "100%",
                    width: "100%",
                    borderRadius: "12px",
                  }}
                ></div>
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
                  {selectedGrid?.id === grid.id && (
                    <div className="grid-details-panel">
                      <div className="grid-details-header">
                        <h4 className="grid-details-title">
                          {grid.id} Details
                        </h4>
                      </div>
                      <div className="grid-details">
                        <div className="grid-metrics">
                          {[
                            {
                              key: "waterLevel",
                              label: t.waterLevel,
                              unit: "%",
                            },
                            {
                              key: "moisture",
                              label: t.moisture,
                              unit: "%",
                            },
                            {
                              key: "soilContent",
                              label: t.soilContent,
                              unit: "%",
                            },
                            {
                              key: "nutrition",
                              label: t.nutrition,
                              unit: "%",
                            },
                          ].map((metric) => (
                            <div key={metric.key} className="grid-metric">
                              <div className="grid-metric-header">
                                {getGridIcon(metric.key)}
                                <span className="grid-metric-label">
                                  {metric.label}
                                </span>
                              </div>
                              <div className="grid-metric-value">
                                {grid[metric.key]}
                                {metric.unit}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="grid-recommendations">
                          <h5 className="grid-rec-title">
                            {t.recommendations}
                          </h5>
                          <p className="grid-rec-text">
                            {grid.recommendations}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                    onClick={() => toggleCase(case_.caseId)}
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
                      <div className="dropdown-toggle">
                        {openCases[case_.caseId] ? (
                          <ChevronUp />
                        ) : (
                          <ChevronDown />
                        )}
                      </div>
                    </div>
                  </div>
                  {openCases[case_.caseId] && (
                    <div className="case-content">
                      <div className="case-grid-info">
                        <div className="info-item">
                          <p className="info-label">{t.gridId}</p>
                          <p className="info-value">{case_.gridId}</p>
                        </div>
                        <div className="info-item">
                          <p className="info-label">Status</p>
                          <p className="info-value">{case_.status}</p>
                        </div>
                      </div>
                      <div className="problem-section">
                        <p className="problem-label">{t.problem}</p>
                        <p className="problem-value">{case_.problem}</p>
                      </div>
                      <div className="recommendations-section">
                        <p className="recommendations-label">
                          {t.recommendations}
                        </p>
                        <p className="recommendations-value">
                          {case_.recommendations}
                        </p>
                      </div>
                      <button
                        className="view-location-btn"
                        onClick={() => {
                          const grid = gridData.find(
                            (g) => g.id === case_.gridId
                          );
                          if (grid) handleGridClick(grid);
                        }}
                      >
                        <Eye className="view-icon" />
                        View on Grid
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;