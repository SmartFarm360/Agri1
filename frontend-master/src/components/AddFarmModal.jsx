import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./AddFarmModal.css";
import * as turf from "@turf/turf";

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
      const newPoint = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };

      setBoundaryPoints((prev) => {
        // ✅ LIMIT TO 4 POINTS ONLY
        if (prev.length >= 4) {
          alert("Only 4 boundary points allowed");
          return prev;
        }

        const updated = [...prev, newPoint];

        // remove old polygon
        if (polygonRef.current) {
          map.removeLayer(polygonRef.current);
        }

        // draw polygon ONLY when 4 points reached
        if (updated.length === 4) {
          polygonRef.current = L.polygon(updated, {
            color: "#16a34a",
            fillOpacity: 0.3,
          }).addTo(map);

          // calculate area
          const coords = updated.map((p) => [p.lng, p.lat]);
          coords.push(coords[0]);

          const polygon = turf.polygon([coords]);

          const areaSqMeters = turf.area(polygon);
          const areaHectares = areaSqMeters / 10000;

          setFormData((prev) => ({
            ...prev,
            area_hectares: Number(areaHectares.toFixed(2)),
          }));

          // generate grids ONLY when valid polygon
          generateGrids(updated, map);
        }

        return updated;
      });

      L.marker(e.latlng).addTo(map);
    });

    leafletMapRef.current = map;
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isOpen, formData.latitude, formData.longitude]);

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
    // remove old grids

     if (!polygonCoords || polygonCoords.length !== 4) return;
    gridLayersRef.current.forEach((layer) => map.removeLayer(layer));
    gridLayersRef.current = [];

   

    const polygon = turf.polygon([
      [
        ...polygonCoords.map((p) => [p.lng, p.lat]),
        [polygonCoords[0].lng, polygonCoords[0].lat],
      ],
    ]);

    const bbox = turf.bbox(polygon);

    const grid = turf.squareGrid(bbox, 0.02, {
      units: "kilometers",
    });

    grid.features.forEach((cell) => {
      const intersection = turf.intersect(cell, polygon);

      if (!intersection) return;

      const ratio = turf.area(intersection) / turf.area(cell);

      const coords = cell.geometry.coordinates[0].map((c) => [c[1], c[0]]);

      const layer = L.polygon(coords, {
        color: ratio >= 0.5 ? "#16a34a" : "#9ca3af",
        weight: 1,
        fillOpacity: ratio >= 0.5 ? 0.2 : 0.1,
      }).addTo(map);

      gridLayersRef.current.push(layer);
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
