"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { translations } from "../utils/translations"
import "./Profile.css"

const Profile = ({ currentLanguage }) => {
  const t = translations[currentLanguage] || translations.en

  const [profileData, setProfileData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)

  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        
        const API_URL =
          import.meta.env.MODE === "production"
            ? "https://agri1-32qq.onrender.com"
            : "http://localhost:5000";
      const res = await axios.get(
        `${API_URL}/api/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setProfileData(res.data);
      setEditData(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  fetchProfile();
}, []);


  const handleEdit = () => {
    setIsEditing(true)
    setEditData({ ...profileData })
  }

const handleSave = async () => {
  try {
    const API_URL =
     "http://localhost:5000";

    // Build payload safely
    const payload = {
      name: editData.name,
      email: editData.email,
    };

    // Only send password if user actually changed it
    if (editData.password && editData.password.trim() !== "") {
      payload.password = editData.password;
    }

    const res = await axios.put(
      `${API_URL}/api/auth/profile`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setProfileData(res.data);
    setEditData(res.data);
    setIsEditing(false);
    setShowSuccess(true);

    setTimeout(() => setShowSuccess(false), 3000);
  } catch (error) {
    console.error("Failed to update profile:", error);
    alert(
      error.response?.data?.message ||
      "❌ Failed to update profile. Please try again."
    );
  }
};



  const handleCancel = () => {
    setEditData({ ...profileData })
    setIsEditing(false)
  }

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    })
  }

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (!profileData) {
    return <div className="profile-page">Loading profile...</div>
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {showSuccess && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            <span>{t?.profileUpdated || "Profile updated successfully!"}</span>
          </div>
        )}

        <div className="page-header">
          <h1>{t?.accountInfo || "Account Information"}</h1>
          <p className="page-subtitle">Manage your personal information and account settings</p>
        </div>

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <span className="avatar-text">{getInitials(profileData.name)}</span>
            </div>
            <div className="profile-info">
              <h2>{profileData.name}</h2>
              <p className="profile-email">{profileData.email}</p>
              <div className="status-badge">Active Account</div>
            </div>
          </div>

          <div className="profile-form">
            <div className="form-header">
              <div className="form-title-section">
                <h3 className="form-title">Personal Details</h3>
                <p className="form-subtitle">Update your account information below</p>
              </div>
              {!isEditing && (
                <button className="edit-btn-header" onClick={handleEdit}>
                  <span className="edit-icon">✏️</span>
                  {t?.edit || "Edit Profile"}
                </button>
              )}
            </div>

            <div className="form-divider"></div>

            <div className="form-fields">
              {/* Name Field */}
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">👤</span>
                  {t?.name || "Full Name"}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleChange}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{profileData.name}</div>
                )}
              </div>

              {/* Email Field */}
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📧</span>
                  {t?.email || "Email Address"}
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleChange}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{profileData.email}</div>
                )}
              </div>

              {/* Password Field (Masked) */}
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔒</span>
                  {t?.password || "Password"}
                </label>
                {isEditing ? (
                  <input
                    type="password"
                    name="password"
                    value={editData.password || "********"}
                    onChange={handleChange}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">••••••••</div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <>
                <div className="form-divider"></div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={handleCancel}>
                    <span className="btn-icon">✕</span>
                    {t?.cancel || "Cancel"}
                  </button>
                  <button className="save-btn" onClick={handleSave}>
                    <span className="btn-icon">💾</span>
                    {t?.save || "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="info-card">
          <div className="info-header">
            <h3>Account Status</h3>
            <p>Your account information and status</p>
          </div>
          <div className="info-content">
            <div className="info-item premium">
              <span className="info-label">Account Type</span>
              <span className="info-badge premium-badge">Premium</span>
            </div>
            <div className="info-item member">
  <span className="info-label">Member Since</span>
  <span className="info-value">
    {new Date(profileData.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })}
  </span>
</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
