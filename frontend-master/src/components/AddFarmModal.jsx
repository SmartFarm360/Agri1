import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/AddFarmModal.css";
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
  const [locationLoading, setLocationLoading] = useState(false);
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
  const locationSearchTimerRef = useRef(null);
  const locationSearchAbortRef = useRef(null);
  const locationSearchRequestIdRef = useRef(0);
  const locationCacheRef = useRef(new Map());
  const selectedLocationMarkerRef = useRef(null);
  const skipLocationSearchRef = useRef(false);

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
      selectedLocationMarkerRef.current = null;
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
        selectedLocationMarkerRef.current = null;
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

      if (locationSearchTimerRef.current) {
        clearTimeout(locationSearchTimerRef.current);
      }

      if (locationSearchAbortRef.current) {
        locationSearchAbortRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = locationQuery.trim();

    if (skipLocationSearchRef.current) {
      skipLocationSearchRef.current = false;
      return;
    }

    if (locationSearchTimerRef.current) {
      clearTimeout(locationSearchTimerRef.current);
      locationSearchTimerRef.current = null;
    }

    if (locationSearchAbortRef.current) {
      locationSearchAbortRef.current.abort();
      locationSearchAbortRef.current = null;
    }

    if (trimmedQuery.length < 2) {
      setLocationLoading(false);
      setLocationResults([]);
      setShowDropdown(false);
      return;
    }

    locationSearchTimerRef.current = setTimeout(() => {
      searchLocation(trimmedQuery);
    }, 300);

    return () => {
      if (locationSearchTimerRef.current) {
        clearTimeout(locationSearchTimerRef.current);
        locationSearchTimerRef.current = null;
      }
    };
  }, [locationQuery]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatLocationLabel = (...parts) =>
    [...new Set(parts.filter(Boolean).map((part) => String(part).trim()))].join(", ");

  const buildRankedLocationResults = (query, nominatimResults = [], photonResults = []) => {
    const normalizedQuery = query.trim().toLowerCase();
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const mergedResults = new Map();

    const addResult = (place, sourcePriority) => {
      if (
        !Number.isFinite(place?.lat) ||
        !Number.isFinite(place?.lon) ||
        !place?.display_name
      ) {
        return;
      }

      const key = `${place.lat.toFixed(5)}:${place.lon.toFixed(5)}:${place.display_name.toLowerCase()}`;
      const label = place.display_name.toLowerCase();
      let score = sourcePriority;

      if (label.startsWith(normalizedQuery)) score += 120;
      if (label.includes(normalizedQuery)) score += 80;

      const matchedTokens = queryTokens.filter((token) => label.includes(token)).length;
      score += matchedTokens * 20;

      if (place.kind === "village" || place.kind === "hamlet" || place.kind === "suburb") {
        score += 18;
      }

      if (place.kind === "town" || place.kind === "city") {
        score += 12;
      }

      if (place.countryCode === "in" || place.country?.toLowerCase() === "india") {
        score += 30;
      }

      const existing = mergedResults.get(key);
      if (!existing || score > existing.score) {
        mergedResults.set(key, {
          ...place,
          score,
        });
      }
    };

    nominatimResults.forEach((place) => addResult(place, 120));
    photonResults.forEach((place) => addResult(place, 80));

    return [...mergedResults.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ score, ...place }) => place);
  };

  const searchLocation = async (query) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length < 2) {
      setLocationLoading(false);
      setLocationResults([]);
      setShowDropdown(false);
      return;
    }

    const cachedResults = locationCacheRef.current.get(normalizedQuery);
    if (cachedResults) {
      setLocationLoading(false);
      setLocationResults(cachedResults);
      setShowDropdown(true);
      return;
    }

    const controller = new AbortController();
    const requestId = locationSearchRequestIdRef.current + 1;
    locationSearchRequestIdRef.current = requestId;
    locationSearchAbortRef.current = controller;
    setLocationLoading(true);
    setShowDropdown(true);

    try {
      const encodedQuery = encodeURIComponent(query);
      const [nominatimResponse, photonResponse] = await Promise.allSettled([
        fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&dedupe=1&q=${encodedQuery}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        ),
        fetch(
          `https://photon.komoot.io/api/?q=${encodedQuery}&limit=6&lang=en`,
          {
            signal: controller.signal,
          },
        ),
      ]);

      const nominatimData =
        nominatimResponse.status === "fulfilled" && nominatimResponse.value.ok
          ? await nominatimResponse.value.json()
          : [];

      const photonData =
        photonResponse.status === "fulfilled" && photonResponse.value.ok
          ? await photonResponse.value.json()
          : { features: [] };

      if (locationSearchRequestIdRef.current !== requestId) {
        return;
      }

      const mappedNominatimResults = Array.isArray(nominatimData)
        ? nominatimData
            .map((place) => ({
              lat: Number(place?.lat),
              lon: Number(place?.lon),
              display_name: formatLocationLabel(
                place?.name,
                place?.address?.village ||
                  place?.address?.hamlet ||
                  place?.address?.suburb ||
                  place?.address?.town ||
                  place?.address?.city,
                place?.address?.county ||
                  place?.address?.state_district ||
                  place?.address?.district,
                place?.address?.state,
                place?.address?.country,
              ),
              kind: place?.addresstype || place?.type,
              country: place?.address?.country,
              countryCode: place?.address?.country_code,
            }))
            .filter(
              (place) =>
                Number.isFinite(place.lat) &&
                Number.isFinite(place.lon) &&
                place.display_name,
            )
        : [];

      const mappedPhotonResults = Array.isArray(photonData?.features)
        ? photonData.features
            .map((feature) => ({
              lat: Number(feature?.geometry?.coordinates?.[1]),
              lon: Number(feature?.geometry?.coordinates?.[0]),
              display_name: formatLocationLabel(
                feature?.properties?.name,
                feature?.properties?.district ||
                  feature?.properties?.city ||
                  feature?.properties?.county,
                feature?.properties?.state,
                feature?.properties?.country,
              ),
              kind: feature?.properties?.type,
              country: feature?.properties?.country,
              countryCode: feature?.properties?.countrycode,
            }))
            .filter(
              (place) =>
                Number.isFinite(place.lat) &&
                Number.isFinite(place.lon) &&
                place.display_name,
            )
        : [];

      const mergedResults = buildRankedLocationResults(
        query,
        mappedNominatimResults,
        mappedPhotonResults,
      );

      locationCacheRef.current.set(normalizedQuery, mergedResults);
      setLocationResults(mergedResults);
      setShowDropdown(true);
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      setLocationResults([]);
      setShowDropdown(false);
      console.error("Location search error:", err);
    } finally {
      if (locationSearchRequestIdRef.current === requestId) {
        setLocationLoading(false);
      }
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
      if (selectedLocationMarkerRef.current) {
        leafletMapRef.current.removeLayer(selectedLocationMarkerRef.current);
      }

      leafletMapRef.current.setView([lat, lng], 18);
      selectedLocationMarkerRef.current = L.marker([lat, lng]).addTo(
        leafletMapRef.current,
      );
    }

    skipLocationSearchRef.current = true;
    setLocationQuery(place.display_name);
    setLocationResults([]);
    setShowDropdown(false);
    setLocationLoading(false);
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
              }}
              onFocus={() => {
                if (locationQuery.trim().length >= 2) {
                  setShowDropdown(true);
                }
              }}
            />

            {showDropdown && (
              <div className="location-dropdown">
                {locationLoading ? (
                  <div className="location-dropdown-status">Searching locations...</div>
                ) : locationResults.length > 0 ? (
                  locationResults.map((place, index) => (
                    <div
                      key={`${place.lat}-${place.lon}-${index}`}
                      className="location-item"
                      onClick={() => handleLocationSelect(place)}
                    >
                      {place.display_name}
                    </div>
                  ))
                ) : (
                  <div className="location-dropdown-status">No matching locations found.</div>
                )}
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
