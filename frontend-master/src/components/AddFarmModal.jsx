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

const AREA_UNITS = {
  hectares: "Hectares",
  acres: "Acres",
  sq_metres: "Sq Metres",
};

const HECTARE_TO_ACRE = 2.4710538147;
const HECTARE_TO_SQ_METRE = 10000;

const AddFarmModal = ({ isOpen, onClose, onFarmAdded }) => {
  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({
    visible: false,
    type: "info",
    message: "",
    confirm: false,
    onConfirm: null,
  });

  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState([]);
  const [areaUnit, setAreaUnit] = useState("hectares");
  const [movingPointIndex, setMovingPointIndex] = useState(null);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const polygonRef = useRef(null);
  const gridLayersRef = useRef([]);
  const boundaryMarkersRef = useRef([]);
  const movingPointIndexRef = useRef(null);
  const toastTimerRef = useRef(null);

  const hideToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast((prev) => ({
      ...prev,
      visible: false,
      confirm: false,
      onConfirm: null,
    }));
  };

  const showToast = (message, type = "info", duration = 2200) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast({
      visible: true,
      type,
      message,
      confirm: false,
      onConfirm: null,
    });

    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        visible: false,
        confirm: false,
        onConfirm: null,
      }));
      toastTimerRef.current = null;
    }, duration);
  };

  const showConfirmToast = (message, onConfirm) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }

    setToast({
      visible: true,
      type: "warning",
      message,
      confirm: true,
      onConfirm,
    });
  };

  const clearBoundaryLayers = (map) => {
    boundaryMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    boundaryMarkersRef.current = [];

    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    gridLayersRef.current.forEach((layer) => map.removeLayer(layer));
    gridLayersRef.current = [];
  };

  const syncBoundaryLayers = (points, map) => {
    if (!map) return;
    clearBoundaryLayers(map);

    points.forEach((point) => {
      const marker = L.marker([point.lat, point.lng]).addTo(map);
      boundaryMarkersRef.current.push(marker);
    });

    if (points.length !== 4) {
      setFormData((prev) =>
        prev.area_hectares === ""
          ? prev
          : {
              ...prev,
              area_hectares: "",
            },
      );
      return;
    }

    polygonRef.current = L.polygon(
      points.map((point) => [point.lat, point.lng]),
      {
        color: "#16a34a",
        fillOpacity: 0.3,
        weight: 2,
      },
    ).addTo(map);
    polygonRef.current.bringToBack();

    const turfCoords = [
      ...points.map((point) => [point.lng, point.lat]),
      [points[0].lng, points[0].lat],
    ];

    const turfPolygon = turf.polygon([turfCoords]);
    const areaSqMeters = turf.area(turfPolygon);
    const areaHectares = Number((areaSqMeters / 10000).toFixed(2));

    setFormData((prev) =>
      prev.area_hectares === areaHectares
        ? prev
        : {
            ...prev,
            area_hectares: areaHectares,
          },
    );

    generateGrids(points, map);
    map.fitBounds(polygonRef.current.getBounds());
  };

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

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles © Esri",
      },
    ).addTo(map);

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

    map.on("click", (e) => {
      setBoundaryPoints((prev) => {
        const clickedPoint = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        };

        const pointToMove = movingPointIndexRef.current;
        if (pointToMove !== null && prev[pointToMove]) {
          const moved = prev.map((point, index) =>
            index === pointToMove ? clickedPoint : point,
          );

          movingPointIndexRef.current = null;
          setMovingPointIndex(null);
          showToast(`Boundary point ${pointToMove + 1} moved.`, "success");
          return moved;
        }

        if (prev.length >= 4) {
          showToast("Only 4 boundary points allowed.", "warning");
          return prev;
        }

        return [...prev, clickedPoint];
      });
    });

    leafletMapRef.current = map;
    syncBoundaryLayers(boundaryPoints, map);
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isOpen, formData.latitude, formData.longitude]);

  useEffect(() => {
    if (!isOpen) {
      movingPointIndexRef.current = null;
      setMovingPointIndex(null);
      hideToast();
      return;
    }

    if (!leafletMapRef.current) return;
    syncBoundaryLayers(boundaryPoints, leafletMapRef.current);
  }, [isOpen, boundaryPoints]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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
      setShowDropdown(false);
      return;
    }

    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
      );

      if (!res.ok) {
        throw new Error("Location lookup failed.");
      }

      const data = await res.json();
      const mappedResults = Array.isArray(data?.features)
        ? data.features
            .map((feature) => {
              const lat = Number(feature?.geometry?.coordinates?.[1]);
              const lon = Number(feature?.geometry?.coordinates?.[0]);

              const display_name = [
                feature?.properties?.name,
                feature?.properties?.city ||
                  feature?.properties?.district ||
                  feature?.properties?.state,
                feature?.properties?.country,
              ]
                .filter(Boolean)
                .join(", ");

              return { lat, lon, display_name };
            })
            .filter(
              (place) =>
                Number.isFinite(place.lat) &&
                Number.isFinite(place.lon) &&
                place.display_name,
            )
        : [];

      setLocationResults(mappedResults);
      setShowDropdown(mappedResults.length > 0);
    } catch (err) {
      setLocationResults([]);
      setShowDropdown(false);
      console.error("Location search error:", err);
    }
  };

  const generateGrids = (polygonCoords, map) => {
    if (!polygonCoords || polygonCoords.length !== 4) return;

    // remove old grids
    gridLayersRef.current.forEach((layer) => map.removeLayer(layer));
    gridLayersRef.current = [];

    // create turf polygon (correct order lng,lat)
    const turfCoords = polygonCoords.map((p) => [p.lng, p.lat]);

    // close polygon
    turfCoords.push([polygonCoords[0].lng, polygonCoords[0].lat]);

    const farmPolygon = turf.polygon([turfCoords]);

    // bounding box
    const bbox = turf.bbox(farmPolygon);

    // create grid (20m x 20m)
    const grid = turf.squareGrid(bbox, 0.02, { units: "kilometers" });

    grid.features.forEach((cell) => {
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

      const ratio = turf.area(intersection) / turf.area(cell);

      const leafletCoords = cell.geometry.coordinates[0].map((coord) => [
        coord[1],
        coord[0],
      ]);

      const gridLayer = L.polygon(leafletCoords, {
        color: ratio >= 0.5 ? "#16a34a" : "#9ca3af",
        weight: 1,
        fillOpacity: ratio >= 0.5 ? 0.25 : 0.12,
      }).addTo(map);
      setTimeout(() => gridLayer.bringToFront(), 0);

      gridLayersRef.current.push(gridLayer);
    });
  };

  const handleLocationSelect = (place) => {
    const lat = Number(place.lat);
    const lng = Number(place.lon);

    // update form state
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    // MOVE MAP to selected location immediately
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([lat, lng], 18);

      // optional: add marker at selected location
      L.marker([lat, lng]).addTo(leafletMapRef.current);
    }

    setLocationQuery(place.display_name);
    setLocationResults([]);
    setShowDropdown(false);
  };

  const handleDeleteBoundaryPoint = (index) => {
    showConfirmToast(`Delete boundary point ${index + 1}?`, () => {
      setBoundaryPoints((prev) => prev.filter((_, pointIndex) => pointIndex !== index));

      if (movingPointIndexRef.current !== null) {
        if (movingPointIndexRef.current === index) {
          movingPointIndexRef.current = null;
          setMovingPointIndex(null);
        } else if (movingPointIndexRef.current > index) {
          const newIndex = movingPointIndexRef.current - 1;
          movingPointIndexRef.current = newIndex;
          setMovingPointIndex(newIndex);
        }
      }

      showToast(`Boundary point ${index + 1} deleted.`, "success");
    });
  };

  const handleMoveBoundaryPoint = (index) => {
    showConfirmToast(
      `Move boundary point ${index + 1}? Click Confirm, then click on the map to set its new position.`,
      () => {
        movingPointIndexRef.current = index;
        setMovingPointIndex(index);
        showToast(`Move mode enabled for point ${index + 1}.`, "info", 3200);
      },
    );
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
     polygon_coordinates: [...boundaryPoints],
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
        import.meta.env.VITE_API_URL || "http://localhost:5000";

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
      movingPointIndexRef.current = null;
      setMovingPointIndex(null);

      onClose?.();
    } catch (submitError) {
      setError(submitError.message || "Failed to create farm.");
    } finally {
      setSaving(false);
    }
  };

  const getConvertedArea = () => {
    const hectares = Number(formData.area_hectares);
    if (!Number.isFinite(hectares) || hectares <= 0) return "";

    if (areaUnit === "acres") {
      return (hectares * HECTARE_TO_ACRE).toFixed(2);
    }

    if (areaUnit === "sq_metres") {
      return (hectares * HECTARE_TO_SQ_METRE).toFixed(2);
    }

    return hectares.toFixed(2);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        {toast.visible && (
          <div className={`modal-toast modal-toast-${toast.type}`}>
            <span>{toast.message}</span>
            {toast.confirm && (
              <div className="modal-toast-actions">
                <button
                  type="button"
                  className="modal-toast-btn confirm"
                  onClick={() => {
                    const confirmAction = toast.onConfirm;
                    hideToast();
                    confirmAction?.();
                  }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="modal-toast-btn cancel"
                  onClick={hideToast}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          X
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
            <div className="boundary-points-panel">
              <div className="boundary-points-header">
                <strong>Boundary Points</strong>
                {movingPointIndex !== null && (
                  <span className="boundary-move-note">
                    Move mode: click map for point {movingPointIndex + 1}
                  </span>
                )}
              </div>
              {boundaryPoints.map((point, index) => (
                <div
                  key={`${point.lat}-${point.lng}-${index}`}
                  className={`boundary-point-row ${movingPointIndex === index ? "moving" : ""}`}
                >
                  <div className="boundary-point-index">{index + 1}</div>
                  <div className="boundary-point-coords">
                    {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                  </div>
                  <div className="boundary-point-actions">
                    <button
                      type="button"
                      className="move-btn"
                      onClick={() => handleMoveBoundaryPoint(index)}
                    >
                      Move
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDeleteBoundaryPoint(index)}
                    >
                      Delete
                    </button>
                  </div>
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

          <div className="area-field-row">
            <input
              type="text"
              name="total_area"
              placeholder="Total Area"
              value={getConvertedArea()}
              readOnly
            />
            <select
              className="area-unit-select"
              value={areaUnit}
              onChange={(event) => setAreaUnit(event.target.value)}
            >
              {Object.entries(AREA_UNITS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

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
