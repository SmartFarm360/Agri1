import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  BarChart3,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  TrendingUp,
  Filter,
  Download,
  Search,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import "../styles/History.css";

// Mock translations for demo (no network dependency)
const translations = {
  en: {
    history: "Farm History Dashboard",
    solved: "Solved",
    pending: "Pending",
    inProgress: "In Progress",
    gridId: "Grid ID",
    problem: "Problem",
    status: "Status",
    createdDate: "Date",
    pendingDays: "Pending Days",
    days: "days",
    gridVisualization: "Grid Visualization",
    recentActivity: "Recent Activity",
    farmLocation: "Farm Location",
    totalIssues: "Total Issues",
    avgResolutionTime: "Avg Resolution Time",
    searchPlaceholder: "Search by Grid ID or Problem...",
    filterByStatus: "Filter by Status",
    exportData: "Export Data",
    viewDetails: "View Details",
    allStatuses: "All Statuses",
  },
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const HECTARE_TO_ACRE = 2.4710538147;

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

const getSeededNumber = (seed, min, max) =>
  Math.round(min + getSeededUnit(seed) * (max - min));

const getGridRisk = (temperature, humidity, moisture) => {
  if (temperature > 32 || humidity > 78 || moisture < 35) return "high";
  if (temperature > 28 || humidity > 65 || moisture < 50) return "moderate";
  return "low";
};

const getStatusFromRisk = (risk) => {
  if (risk === "high") return "pending";
  if (risk === "moderate") return "in-progress";
  return "solved";
};

const History = ({ currentLanguage = "en" }) => {
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [farmLocation, setFarmLocation] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  //newly add
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [actionTaken, setActionTaken] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [showResponseBox, setShowResponseBox] = useState(false);

  const t = translations?.[currentLanguage] || translations["en"];

  // Define redIcon inside the component
  const redIcon = new L.Icon({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const problemDescriptions = {
    "Leaf Blight":
      "Leaf blight is a fungal disease that causes brown or yellow patches on leaves. If untreated, it reduces photosynthesis and lowers crop yield. Past records show it often spreads during humid conditions.",

    "Pest Infestation":
      "Pest infestation occurs when insects attack crops, feeding on leaves, stems, or roots. Historical data indicates rapid spread during warm temperatures and delayed intervention.",

    "Nutrient Deficiency":
      "Nutrient deficiency happens when essential elements like nitrogen, phosphorus, or potassium are insufficient in the soil. Past cases resulted in poor plant growth and discoloration.",

    "Water Stress":
      "Water stress arises due to irregular irrigation or drought conditions. Previous incidents show wilting, reduced growth, and long-term soil degradation if ignored.",

    "Soil Erosion":
      "Soil erosion is the loss of fertile topsoil due to wind or water runoff. Past farm data links this issue to heavy rainfall and lack of ground cover.",

    "Disease Outbreak":
      "Disease outbreaks spread quickly across grids when early symptoms are missed. Historical trends show higher risk during seasonal transitions.",
  };

  useEffect(() => {
    // Simulated API call for history data
    const statuses = ["solved", "pending", "in-progress"];
    const problems = [
      "Leaf Blight",
      "Pest Infestation",
      "Nutrient Deficiency",
      "Water Stress",
      "Soil Erosion",
      "Disease Outbreak",
    ];

    const data = Array.from({ length: 25 }, (_, index) => {
      const problem = problems[Math.floor(Math.random() * problems.length)];

      return {
        id: index + 1,
        gridId: `GRID-${String(Math.floor(Math.random() * 100) + 1).padStart(3, "0")}`,
        problem,
        description: problemDescriptions[problem],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
        severity:
          Math.random() > 0.7
            ? "high"
            : Math.random() > 0.4
              ? "moderate"
              : "low",
        resolvedDate: Math.random() > 0.5 ? new Date() : null,
      };
    });

    setHistoryData(data);
    setFilteredData(data);

    // Generate grid visualization data
    const grids = Array.from({ length: 64 }, (_, index) => ({
      id: `GRID-${String(index + 1).padStart(3, "0")}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      row: Math.floor(index / 8),
      col: index % 8,
      issueCount: Math.floor(Math.random() * 5),
    }));

    setGridData(grids);
  }, []);

  useEffect(() => {
    // Simulated farm location
    setFarmLocation({
      lat: 28.6139,
      lng: 77.209,
      name: "Demo Farm Location",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHistoryContext = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      let farms = [];
      let ownerName = "Farm Owner";

      try {
        const [farmRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/api/farm/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (farmRes.ok) {
          const farmPayload = await farmRes.json();
          farms = Array.isArray(farmPayload) ? farmPayload : [];
        }

        if (profileRes.ok) {
          const profilePayload = await profileRes.json();
          if (profilePayload?.name) {
            ownerName = profilePayload.name;
          }
        }
      } catch (error) {
        console.error("History data fetch error:", error);
      }

      if (cancelled || farms.length === 0) return;

      const recordsPerFarm = 8;
      const problems = Object.keys(problemDescriptions);

      const generatedData = farms.flatMap((farm, farmIndex) => {
        const farmKey = farm.farm_id || `${farm.farm_name || "FARM"}-${farmIndex}`;
        const farmName = farm.farm_name || `Farm ${farmIndex + 1}`;
        const latitude = Number(farm.latitude);
        const longitude = Number(farm.longitude);
        const areaHectares = Number(farm.area_hectares || farm.land_size || 0);
        const areaAcres = areaHectares > 0 ? areaHectares * HECTARE_TO_ACRE : 0;

        return Array.from({ length: recordsPerFarm }, (_, gridIndex) => {
          const seed = `${farmKey}-${gridIndex + 1}`;
          const problemIndex = Math.min(
            problems.length - 1,
            Math.floor(getSeededUnit(`${seed}-problem`) * problems.length),
          );
          const problem = problems[problemIndex];
          const temperature = getSeededNumber(`${seed}-temp`, 21, 37);
          const humidity = getSeededNumber(`${seed}-hum`, 40, 90);
          const moisture = getSeededNumber(`${seed}-soil`, 25, 85);
          const pressure = getSeededNumber(`${seed}-pressure`, 1006, 1018);
          const severity = getGridRisk(temperature, humidity, moisture);
          const status = getStatusFromRisk(severity);
          const ageDays = getSeededNumber(`${seed}-age`, 1, 30);
          const createdDate = new Date(
            Date.now() - ageDays * 24 * 60 * 60 * 1000,
          );
          const recommendation =
            severity === "high"
              ? "Immediate field visit recommended. Apply corrective treatment and monitor this grid daily."
              : severity === "moderate"
                ? "Schedule treatment and monitor on alternate days to prevent escalation."
                : "Maintain current practices and continue weekly monitoring for this grid.";

          return {
            id: `${farmKey}-${gridIndex + 1}`,
            gridId: `GRID-${String(farmIndex * recordsPerFarm + gridIndex + 1).padStart(3, "0")}`,
            problem,
            description: problemDescriptions[problem],
            recommendation,
            status,
            createdDate,
            severity,
            resolvedDate:
              status === "solved"
                ? new Date(
                    createdDate.getTime() +
                      getSeededNumber(`${seed}-resolved`, 1, 5) *
                        24 *
                        60 *
                        60 *
                        1000,
                  )
                : null,
            temperature,
            humidity,
            moisture,
            pressure,
            gridArea: farmName,
            ownerName,
            latitude: Number.isFinite(latitude) ? latitude : null,
            longitude: Number.isFinite(longitude) ? longitude : null,
            areaAcres,
          };
        });
      });

      const firstFarm = farms[0];
      const firstLat = Number(firstFarm?.latitude);
      const firstLng = Number(firstFarm?.longitude);

      const grids = generatedData.slice(0, 64).map((item, index) => ({
        id: item.gridId,
        status: item.status,
        row: Math.floor(index / 8),
        col: index % 8,
        issueCount: item.status === "solved" ? 0 : item.severity === "high" ? 3 : 1,
      }));

      setFarmLocation({
        lat: Number.isFinite(firstLat) ? firstLat : 20.5937,
        lng: Number.isFinite(firstLng) ? firstLng : 78.9629,
        name: firstFarm?.farm_name || "Farm Location",
      });
      setHistoryData(generatedData);
      setFilteredData(generatedData);
      setGridData(grids);
    };

    loadHistoryContext();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter data based on search and status
  useEffect(() => {
    let filtered = historyData;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.gridId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.problem.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    setFilteredData(filtered);
  }, [searchTerm, statusFilter, historyData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "solved":
        return "#10b981";
      case "pending":
        return "#ef4444";
      case "in-progress":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "solved":
        return <CheckCircle className="status-icon" />;
      case "pending":
        return <AlertCircle className="status-icon" />;
      case "in-progress":
        return <Loader className="status-icon" />;
      default:
        return <Clock className="status-icon" />;
    }
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString("en-IN");
    } catch {
      return "N/A";
    }
  };

  const getPendingDays = (createdDate) => {
    const today = new Date();
    const diffTime = Math.abs(today - new Date(createdDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatCoordinate = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue.toFixed(6) : "N/A";
  };

  const formatAreaAcres = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0
      ? `${numericValue.toFixed(2)} Acres`
      : "N/A";
  };

  const handleGridClick = (grid) => {
    setSelectedGrid(grid);
  };

  const solvedCount = historyData.filter(
    (item) => item.status === "solved",
  ).length;
  const pendingCount = historyData.filter(
    (item) => item.status === "pending",
  ).length;
  const inProgressCount = historyData.filter(
    (item) => item.status === "in-progress",
  ).length;
  const totalIssues = historyData.length;
  const avgResolutionTime = Math.floor(Math.random() * 10) + 5; // Mock average

  return (
    <div className="history-container">
      <div className="history-wrapper">
        {/* Header */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-left">
              <h1 className="main-title">
                <BarChart3 className="title-icon" />
                {t?.history || "History"}
              </h1>
              <p className="subtitle">
                Monitor your farm's health and track issue resolution over time
              </p>
            </div>
            <div className="header-actions">
              <button className="action-btn export-btn">
                <Download className="btn-icon" />
                {t?.exportData || "Export Data"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card solved-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="stat-label">{t?.solved || "Solved"}</p>
                  <p className="stat-number">{solvedCount}</p>
                </div>
                <div className="stat-icon-container solved-icon">
                  <CheckCircle className="stat-icon" />
                </div>
              </div>
              <div className="stat-footer">
                <span className="stat-description">Issues resolved</span>
                <div className="stat-trend positive">
                  <TrendingUp className="trend-icon" />
                  +12%
                </div>
              </div>
            </div>

            <div className="stat-card pending-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="stat-label">{t?.pending || "Pending"}</p>
                  <p className="stat-number">{pendingCount}</p>
                </div>
                <div className="stat-icon-container pending-icon">
                  <AlertCircle className="stat-icon" />
                </div>
              </div>
              <div className="stat-footer">
                <span className="stat-description">Needs attention</span>
                <div className="stat-trend negative">
                  <TrendingUp className="trend-icon" />
                  -5%
                </div>
              </div>
            </div>

            <div className="stat-card progress-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="stat-label">{t?.inProgress || "In Progress"}</p>
                  <p className="stat-number">{inProgressCount}</p>
                </div>
                <div className="stat-icon-container progress-icon">
                  <Loader className="stat-icon" />
                </div>
              </div>
              <div className="stat-footer">
                <span className="stat-description">Being worked on</span>
                <div className="stat-trend neutral">
                  <TrendingUp className="trend-icon" />
                  +2%
                </div>
              </div>
            </div>

            <div className="stat-card total-card">
              <div className="stat-content">
                <div className="stat-info">
                  <p className="stat-label">
                    {t?.totalIssues || "Total Issues"}
                  </p>
                  <p className="stat-number">{totalIssues}</p>
                </div>
                <div className="stat-icon-container total-icon">
                  <BarChart3 className="stat-icon" />
                </div>
              </div>
              <div className="stat-footer">
                <span className="stat-description">All time issues</span>
                <div className="stat-trend positive">
                  <TrendingUp className="trend-icon" />
                  +8%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        {/* <div className="main-content-section">
          <div className="content-grid"> */}
        {/* Grid Visualization */}
        {/* <div className="grid-section">
              <div className="content-card">
                <div className="card-header">
                  <h3 className="section-title">
                    <div className="title-indicator"></div>
                    {t?.gridVisualization || "Grid Visualization"}
                  </h3>
                  <div className="card-actions">
                    <button className="icon-btn">
                      <MoreHorizontal className="icon" />
                    </button>
                  </div>
                </div>
                <div className="grid-container">
                  <div className="grid-visualization">
                    {gridData.map((grid) => (
                      <div
                        key={grid.id}
                        className={`grid-cell ${grid.status} ${selectedGrid?.id === grid.id ? "selected" : ""}`}
                        title={`${grid.id} - ${grid.status} (${grid.issueCount} issues)`}
                        onClick={() => handleGridClick(grid)}
                      >
                        <span className="grid-cell-id">{grid.id.split("-")[1]}</span>
                        {grid.issueCount > 0 && <div className="issue-indicator">{grid.issueCount}</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid-legend">
                  <div className="legend-item">
                    <div className="legend-color solved"></div>
                    <span className="legend-text">Solved</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color in-progress"></div>
                    <span className="legend-text">In Progress</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color pending"></div>
                    <span className="legend-text">Pending</span>
                  </div>
                </div>
              </div>
            </div>

           
            <div className="map-section">
              <div className="content-card">
                <div className="card-header">
                  <h3 className="section-title">
                    <MapPin className="section-icon" />
                    {t?.farmLocation || "Farm Location"}
                    {selectedGrid && <span className="selected-info">- {selectedGrid.id}</span>}
                  </h3>
                </div>
                <div className="map-wrapper">
                  {farmLocation && (
                    <MapContainer
                      center={[farmLocation.lat, farmLocation.lng]}
                      zoom={10}
                      scrollWheelZoom={true}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution='© <a href="https://www.mappls.com">MapmyIndia</a>'
                        url="https://maps.mapmyindia.com/rastertiles/v1.0/{z}/{x}/{y}?access_token=890b827c2d4d264a7179eca8750ce4"
                      />
                      <Marker position={[farmLocation.lat, farmLocation.lng]} icon={redIcon}>
                        <Popup>
                          {selectedGrid ? `${selectedGrid.id} - ${selectedGrid.status}` : farmLocation.name}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* History Table */}
        <div className="table-section">
          <div className="table-card">
            <div className="table-header">
              <div className="table-header-left">
                <h3 className="section-title">
                  <Calendar className="section-icon" />
                  {t?.recentActivity || "Recent Activity"}
                </h3>
                <span className="table-count">
                  {filteredData.length} records
                </span>
              </div>
              <div className="table-controls">
                <div className="search-container">
                  {/* <Search className="search-icon" /> */}
                  <input
                    type="text"
                    placeholder={
                      t?.searchPlaceholder || "Search by Grid ID or Problem..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-container">
                  <Filter className="filter-icon" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">
                      {t?.allStatuses || "All Statuses"}
                    </option>
                    <option value="solved">{t?.solved || "Solved"}</option>
                    <option value="pending">{t?.pending || "Pending"}</option>
                    <option value="in-progress">
                      {t?.inProgress || "In Progress"}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="history-table">
                <thead className="table-head">
                  <tr>
                    <th className="table-header-cell">
                      {t?.gridId || "Grid ID"}
                    </th>
                    <th className="table-header-cell">
                      {t?.problem || "Problem"}
                    </th>
                    <th className="table-header-cell">
                      {t?.status || "Status"}
                    </th>
                    <th className="table-header-cell">
                      {t?.createdDate || "Date"}
                    </th>
                    <th className="table-header-cell">
                      {t?.pendingDays || "Pending Days"}
                    </th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredData.map((item, index) => (
                    <tr key={index} className="table-row">
                      <td className="table-cell">
                        <div className="cell-content font-medium">
                          {item.gridId}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="cell-content">{item.problem}</div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`status-badge ${item.status}`}
                          style={{
                            backgroundColor: `${getStatusColor(item.status)}20`,
                            color: getStatusColor(item.status),
                          }}
                        >
                          {getStatusIcon(item.status)}
                          {t?.[item.status] || item.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="cell-content secondary">
                          {formatDate(item.createdDate)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="cell-content secondary">
                          {item.status === "pending" ||
                          item.status === "in-progress"
                            ? `${getPendingDays(item.createdDate)} ${
                                t?.days || "days"
                              }`
                            : "-"}
                        </div>
                      </td>
                      <td className="table-cell">
                        <button
                          className="action-btn view-btn"
                          onClick={() => {
                            setSelectedHistoryItem(item);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="btn-icon" />
                          {t?.viewDetails || "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedHistoryItem && (
        <div className="details-modal-overlay">
          <div className="details-modal">
            {/* Close Button */}
            <button
              className="modal-back-btn"
              aria-label="Close details"
              onClick={() => {
                setShowDetailsModal(false);
                setShowResponseBox(false);
                setActionTaken("");
                setIsSubmitted(false);
              }}
            >
              ×
            </button>

            {/* GRID STATUS */}
            {/* MODAL HEADER */}
            {/* GRID HEADER (COMPACT) */}
            <div className="modal-header">
              <div
                className={`grid-header-box ${selectedHistoryItem.severity}`}
              >
                <span className="grid-id">{selectedHistoryItem.gridId}</span>
                <span className="grid-risk">
                  {selectedHistoryItem.severity.toUpperCase()} RISK
                </span>
              </div>
              <span className={`history-grid-status-chip ${selectedHistoryItem.status}`}>
                {(t?.[selectedHistoryItem.status] || selectedHistoryItem.status).toUpperCase()}
              </span>
            </div>

            {/* GRID DETAILS */}
            <div className="modal-section grid-details-box">
              <div className="grid-detail-item">
                <strong>Grid Area:</strong> {selectedHistoryItem.gridArea || "N/A"}
              </div>
              <div className="grid-detail-item">
                <strong>Owner:</strong> {selectedHistoryItem.ownerName || "N/A"}
              </div>
              <div className="grid-detail-item">
                <strong>Latitude:</strong>{" "}
                {formatCoordinate(selectedHistoryItem.latitude)}
              </div>
              <div className="grid-detail-item">
                <strong>Longitude:</strong>{" "}
                {formatCoordinate(selectedHistoryItem.longitude)}
              </div>
              <div className="grid-detail-item">
                <strong>Area:</strong> {formatAreaAcres(selectedHistoryItem.areaAcres)}
              </div>
            </div>

            {/* PROBLEM DESCRIPTION */}
            <div className="modal-section problem-box">
              <h4>Problem Description</h4>
              <p>{selectedHistoryItem.description}</p>
            </div>

            {/* ENVIRONMENT DATA */}
            <div className="modal-flex">
              <div className="env-box">
                <p>
                  <strong>Temperature:</strong> {selectedHistoryItem.temperature}&deg;C
                </p>
                <p>
                  <strong>Pressure:</strong> {selectedHistoryItem.pressure} hPa
                </p>
                <p>
                  <strong>Humidity:</strong> {selectedHistoryItem.humidity}%
                </p>
                <p>
                  <strong>Moisture:</strong> {selectedHistoryItem.moisture}%
                </p>
              </div>

              <div className="recommend-box">
                <h4>Recommendation</h4>
                <p>{selectedHistoryItem.recommendation}</p>
              </div>
            </div>

            {/* ACTION TAKEN */}
            <div className="modal-section">
              <h4>Action Taken</h4>
              <textarea
                placeholder="Enter action taken..."
                value={actionTaken}
                disabled={isSubmitted}
                onChange={(e) => setActionTaken(e.target.value)}
              />

              <button
                className={`submit-action-btn ${isSubmitted ? "submitted" : ""}`}
                disabled={isSubmitted}
                onClick={() => {
                  if (!actionTaken.trim()) return;
                  setIsSubmitted(true);
                  setShowResponseBox(true);
                }}
              >
                {isSubmitted ? "Submitted" : "Submit"}
              </button>
            </div>

            {/* RESPONSE MESSAGE */}
            {showResponseBox && (
              <div className="response-box">
                <p>
                  <CheckCircle size={18} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />
                  <strong>Action Submitted Successfully</strong>
                  <br />
                  <br />
                  Your issue is of{" "}
                  <strong>
                    {selectedHistoryItem.severity.toUpperCase()} RISK
                  </strong>
                  .
                  <br />
                  {selectedHistoryItem.severity === "low" &&
                    "Evaluation will be done within 3-4 days."}
                  {selectedHistoryItem.severity === "moderate" &&
                    "Evaluation will be done on alternate days."}
                  {selectedHistoryItem.severity === "high" &&
                    "Daily evaluation is required."}
                </p>

                <div className={`status-pill ${selectedHistoryItem.status}`}>
                  {selectedHistoryItem.status.toUpperCase()}
                </div>

                <button
                  className="back-btn"
                  onClick={() => {
                    setShowResponseBox(false);
                    setIsSubmitted(false);
                    setActionTaken("");
                  }}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;


