"use client";
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
import "./History.css";

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

const History = ({ currentLanguage = "en" }) => {
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [farmLocation, setFarmLocation] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedGrid, setSelectedGrid] = useState(null);

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

    const data = Array.from({ length: 25 }, (_, index) => ({
      id: index + 1,
      gridId: `GRID-${String(Math.floor(Math.random() * 100) + 1).padStart(
        3,
        "0"
      )}`,
      problem: problems[Math.floor(Math.random() * problems.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ),
      severity:
        Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "moderate" : "low",
      resolvedDate:
        Math.random() > 0.5
          ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)
          : null,
    }));

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

  // Filter data based on search and status
  useEffect(() => {
    let filtered = historyData;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.gridId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.problem.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleGridClick = (grid) => {
    setSelectedGrid(grid);
  };

  const solvedCount = historyData.filter(
    (item) => item.status === "solved"
  ).length;
  const pendingCount = historyData.filter(
    (item) => item.status === "pending"
  ).length;
  const inProgressCount = historyData.filter(
    (item) => item.status === "in-progress"
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
                  <Search className="search-icon" />
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
                            const grid = gridData.find(
                              (g) => g.id === item.gridId
                            );
                            if (grid) handleGridClick(grid);
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
    </div>
  );
};

export default History;
