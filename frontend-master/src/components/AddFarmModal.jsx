import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./AddFarmModal.css";
import * as turf from "@turf/turf";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const initialForm = {
  farm_name: "",
  latitude: "",
  longitude: "",
  area_hectares: "",
};

const AddFarmModal = ({ isOpen, onClose, onFarmAdded }) => {
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const polygonRef = useRef(null);
  const gridLayersRef = useRef([]);

  useEffect(() => {
    if (!isOpen) return;

    if (!mapRef.current) return;

    // remove old map
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const lat = Number(formData.latitude) || 20.5937;
    const lng = Number(formData.longitude) || 78.9629;

    const map = L.map(mapRef.current).setView([lat, lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (e) => {
      setBoundaryPoints((prev) => {
        if (prev.length >= 4) {
          alert("Only 4 boundary points allowed");
          return prev;
        }

        const newPoint = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        };

        const updated = [...prev, newPoint];

        // draw marker
        L.marker([newPoint.lat, newPoint.lng]).addTo(map);

        // remove old polygon
        if (polygonRef.current) {
          map.removeLayer(polygonRef.current);
          polygonRef.current = null;
        }

        // draw polygon ONLY when exactly 4 points
        if (updated.length === 4) {
          polygonRef.current = L.polygon(
            updated.map((p) => [p.lat, p.lng]),
            {
              color: "#16a34a",
              fillOpacity: 0.3,
              weight: 2,
            },
          ).addTo(map);
          polygonRef.current.bringToBack();

          // calculate area
          const turfCoords = [
            ...updated.map((p) => [p.lng, p.lat]),
            [updated[0].lng, updated[0].lat],
          ];

          const turfPolygon = turf.polygon([turfCoords]);

          const areaSqMeters = turf.area(turfPolygon);
          const areaHectares = areaSqMeters / 10000;

          setFormData((prev) => ({
            ...prev,
            area_hectares: Number(areaHectares.toFixed(2)),
          }));

          // generate grids
          generateGrids(updated, map);

          map.fitBounds(polygonRef.current.getBounds());
        }

        return updated;
      });
    });

    leafletMapRef.current = map;
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isOpen]);


  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setLocationResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`,
      );

      const data = await res.json();
      setLocationResults(data);
      setShowDropdown(true);
    } catch (err) {
      console.error("Location search error:", err);
    }
  };

  const generateGrids = (polygonCoords, map) => {

  if (!polygonCoords || polygonCoords.length !== 4) return;

  // remove old grids
  gridLayersRef.current.forEach(layer => map.removeLayer(layer));
  gridLayersRef.current = [];

  // create turf polygon (correct order lng,lat)
  const turfCoords = polygonCoords.map(p => [p.lng, p.lat]);

  // close polygon
  turfCoords.push([polygonCoords[0].lng, polygonCoords[0].lat]);

  const farmPolygon = turf.polygon([turfCoords]);

  // bounding box
  const bbox = turf.bbox(farmPolygon);

  // create grid (20m × 20m)
  const grid = turf.squareGrid(bbox, 0.02, { units: "kilometers" });

  grid.features.forEach(cell => {

    // check if cell intersects farm polygon
    const intersects = turf.booleanIntersects(cell, farmPolygon);

    if (!intersects) return;

    // calculate how much cell is inside farm
    let intersection;
    try {
      intersection = turf.intersect(cell, farmPolygon);
    } catch {
      return;
    }

    if (!intersection) return;

    const ratio =
      turf.area(intersection) /
      turf.area(cell);

    const leafletCoords =
      cell.geometry.coordinates[0]
      .map(coord => [coord[1], coord[0]]);

    const gridLayer = L.polygon(leafletCoords, {

      color: ratio >= 0.5 ? "#16a34a" : "#9ca3af",
      weight: 1,
      fillOpacity: ratio >= 0.5 ? 0.25 : 0.12,

    }).addTo(map);
    gridLayer.bringToFront();

    gridLayersRef.current.push(gridLayer);

  });

};


  const handleLocationSelect = (place) => {
    setFormData((prev) => ({
      ...prev,
      latitude: place.lat,
      longitude: place.lon,
    }));

    setLocationQuery(place.display_name);
    setLocationResults([]);
    setShowDropdown(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login again.");
      return;
    }

    const payload = {
      farm_name: formData.farm_name.trim(),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      area_hectares: Number(formData.area_hectares),
      boundary: boundaryPoints,
    };

    if (
      !payload.farm_name ||
      Number.isNaN(payload.latitude) ||
      Number.isNaN(payload.longitude) ||
      Number.isNaN(payload.area_hectares) ||
      payload.area_hectares <= 0
    ) {
      setError("Please enter valid farm details.");
      return;
    }

    try {
      setSaving(true);
      const API_URL =
        import.meta.env.VITE_API_URL || "https://agri1-32qq.onrender.com";

      const response = await fetch(`${API_URL}/api/farm/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result?.message || "Failed to create farm.");
      }

      if (result?.farm && onFarmAdded) {
        onFarmAdded(result.farm);
      }

      setFormData(initialForm);
      setBoundaryPoints([]);

      onClose?.();
    } catch (submitError) {
      setError(submitError.message || "Failed to create farm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        <h2>Add Farm</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="farm_name"
            placeholder="Farm Name"
            value={formData.farm_name}
            onChange={handleChange}
            required
          />

          {/* NEW LOCATION SEARCH INPUT */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search Village / Farm Location"
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                searchLocation(e.target.value);
              }}
            />

            {showDropdown && locationResults.length > 0 && (
              <div className="location-dropdown">
                {locationResults.map((place, index) => (
                  <div
                    key={index}
                    className="location-item"
                    onClick={() => handleLocationSelect(place)}
                  >
                    {place.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MAP FOR SELECTING FARM BOUNDARY */}
          <div
            ref={mapRef}
            style={{
              height: "300px",
              width: "100%",
              borderRadius: "8px",
              marginBottom: "10px",
              border: "1px solid #d1d5db",
            }}
          ></div>

          {/* SHOW SELECTED POINTS */}
          {boundaryPoints.length > 0 && (
            <div style={{ fontSize: "12px", marginBottom: "10px" }}>
              <strong>Boundary Points:</strong>
              {boundaryPoints.map((point, index) => (
                <div key={index}>
                  {index + 1}. {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                </div>
              ))}
            </div>
          )}

          <input
            type="number"
            step="any"
            name="latitude"
            placeholder="Latitude"
            value={formData.latitude}
            readOnly
          />

          <input
            type="number"
            step="any"
            name="longitude"
            placeholder="Longitude"
            value={formData.longitude}
            readOnly
          />

          {/* <input
            type="number"
            step="any"
            min="0.01"
            name="area_hectares"
            placeholder="Area (hectares)"
            value={formData.area_hectares}
            onChange={handleChange}
            required
          /> */}

          {error && (
            <p
              style={{
                color: "#b91c1c",
                fontSize: "0.85rem",
                margin: "0 0 10px",
              }}
            >
              {error}
            </p>
          )}

          <div className="modal-buttons">
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFarmModal;
