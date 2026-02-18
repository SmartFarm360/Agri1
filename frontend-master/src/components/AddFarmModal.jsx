import React, { useState } from "react";
import "./AddFarmModal.css";

const AddFarmModal = ({ isOpen, onClose, onFarmAdded }) => {

  const [farmName, setFarmName] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);

  // Do not render if closed
  if (!isOpen) return null;

  const handleSave = async () => {

    if (!farmName || !area) {
      alert("Please fill all fields");
      return;
    }

    try {

      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login again");
        return;
      }

      // map center saved globally from dashboard map
      const mapCenter = window.currentMapCenter;

      if (!mapCenter) {
        alert("Map location not detected. Please select location.");
        return;
      }

      const res = await fetch(
        "https://agri1-32qq.onrender.com/api/farm/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            farm_name: farmName,
            latitude: mapCenter.lat,
            longitude: mapCenter.lng,
            area_hectares: Number(area),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to save farm");
      }

      const farm = await res.json();

      // send farm back to dashboard
      onFarmAdded(farm);

      // close modal
      onClose();

      // reset fields
      setFarmName("");
      setArea("");

    } catch (err) {

      console.error(err);
      alert(err.message);

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="modal-overlay">

      <div className="modal">

        <h2>Add New Farm</h2>

        <input
          type="text"
          placeholder="Farm Name"
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Area (hectares)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />

        <div className="modal-buttons">

          <button onClick={onClose}>
            Cancel
          </button>

          <button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Farm"}
          </button>

        </div>

      </div>

    </div>
  );

};

export default AddFarmModal;
