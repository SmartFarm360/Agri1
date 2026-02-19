import { useState } from "react";
import "./AddFarmModal.css";

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login again.");
      return;
    }

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

    const payload = {
      farm_name: formData.farm_name.trim(),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      area_hectares: Number(formData.area_hectares),
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


          <input
            type="number"
            step="any"
            min="0.01"
            name="area_hectares"
            placeholder="Area (hectares)"
            value={formData.area_hectares}
            onChange={handleChange}
            required
          />

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
