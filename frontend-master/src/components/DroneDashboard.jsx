import React from "react";
import { translations } from "../utils/translations";
import "../styles/DroneDashboard.css";

const DroneDashboard = ({ currentLanguage = "en" }) => {
  // Fallback to English if currentLanguage is undefined or invalid
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="dashboard-container">
      <h1>{t.droneDashboard || "Drone Operator Dashboard"}</h1>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Pending Spray Tasks</h3>
          <p>You have 3 new spray missions assigned.</p>
        </div>
        <div className="metric-card">
          <h3>Drone Movement</h3>
          <p>Live GPS feed enabled. Drone #14 covering Grid-27.</p>
        </div>
        <div className="metric-card">
          <h3>Completed Tasks</h3>
          <p>12 of 15 tasks completed today. Great job!</p>
        </div>
      </div>
    </div>
  );
};

export default DroneDashboard;
