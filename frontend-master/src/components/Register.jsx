import { useState, useRef } from "react";

import { Link, useNavigate } from "react-router-dom";
import { translations } from "../utils/translations";
import "./Register.css";

const Register = ({ currentLanguage, onRegister }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    mob: "",
    password: "",
    confirmPassword: "",
    role: "",
    farm_location: "",
    land_size: "",
    crop_type: "",
    experience: "",
    license_id: "",
    base_location: "",
    available_drones: "",
    flight_experience: "",
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [landDocument, setLandDocument] = useState(null);
  const locationTimeoutRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = translations[currentLanguage] || translations["en"];
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 🚀 FAST & DEBOUNCED location search
    if (name === "farm_location") {
      // Clear previous debounce
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }

      if (value.length < 3) {
        setLocationSuggestions([]);
        return;
      }

      locationTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}`,
            {
              headers: {
                "Accept-Language": "en",
              },
            },
          );
          const data = await res.json();
          setLocationSuggestions(data.slice(0, 5));
        } catch (err) {
          console.error("Location fetch error:", err);
        }
      }, 500); // ⏱️ waits 500ms after typing stops
    }
  };

  const handleLocationSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      farm_location: location.display_name,
      latitude: location.lat,
      longitude: location.lon,
    }));
    setLocationSuggestions([]);
  };

  const validateForm = () => {
    const validationErrors = {};
    if (!formData.firstName?.trim())
      validationErrors.firstName = t.requiredField || "This field is required.";
    if (!formData.email.includes("@"))
      validationErrors.email = t.invalidEmail || "Invalid email format.";
    if (!formData.mob?.trim())
      validationErrors.mob = t.requiredField || "This field is required.";
    if (formData.password.length < 8)
      validationErrors.password =
        t.passwordError || "Password must be at least 8 characters.";
    if (formData.password !== formData.confirmPassword)
      validationErrors.confirmPassword =
        t.passwordMismatch || "Passwords do not match.";
    if (formData.role === "farmer" && !landDocument)
      validationErrors.landDocument = "Land document is required.";

    return Object.keys(validationErrors).length === 0
      ? (setErrors({}), true)
      : (setErrors(validationErrors), false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const submissionData = new FormData();
      submissionData.append("name", formData.firstName);
      submissionData.append("email", formData.email);
      submissionData.append("mob", formData.mob);
      submissionData.append("password", formData.password);
      submissionData.append("confirmPassword", formData.confirmPassword);
      submissionData.append("role", formData.role);

      if (formData.role === "farmer") {
        submissionData.append("landSize", formData.land_size);
        submissionData.append("location", formData.farm_location);
        submissionData.append("latitude", formData.latitude || "");
        submissionData.append("longitude", formData.longitude || "");
        submissionData.append("experience", formData.experience);
        submissionData.append("cropType", formData.crop_type);
        submissionData.append("landDocument", landDocument);
      } else if (formData.role === "drone_controller") {
        submissionData.append("licenseId", formData.license_id);
        submissionData.append("baseLocation", formData.base_location);
        submissionData.append("availableDrones", formData.available_drones);
        submissionData.append("flightExperience", formData.flight_experience);
      }

      const API_URL =
        import.meta.env.MODE === "production"
          ? "https://frontend-k-backend.onrender.com"
          : "http://localhost:5000";

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        body: submissionData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      alert("Registration successful!");
      navigate("/login");
    } catch (registerError) {
      console.error("Registration error:", registerError);
      setErrors({
        submit:
          registerError.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRoleFields = () => {
    if (!formData.role) return null;

    switch (formData.role) {
      case "farmer":
        return (
          <div className="role-section">
            <div className="role-header">
              <div className="role-icon farmer-icon">🌱</div>
              <h3 className="role-title">Farmer Details</h3>
            </div>

            <div className="form-group location-group">
              <label className="form-label">
                <span className="label-icon">📍</span>
                {t.farmLocation || "Farm Location"}
              </label>
              <input
                type="text"
                name="farm_location"
                value={formData.farm_location}
                onChange={handleChange}
                placeholder="Start typing farm location..."
                autoComplete="off"
                className="form-input"
              />
              {locationSuggestions.length > 0 && (
                <ul className="location-dropdown">
                  {locationSuggestions.map((location, index) => (
                    <li
                      key={index}
                      onClick={() => handleLocationSelect(location)}
                    >
                      {location.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  {t.landSize || "Land Size"}
                </label>
                <input
                  type="text"
                  name="land_size"
                  value={formData.land_size}
                  onChange={handleChange}
                  placeholder="e.g., 5 acres"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t.cropType || "Crop Type"}
                </label>
                <input
                  type="text"
                  name="crop_type"
                  value={formData.crop_type}
                  onChange={handleChange}
                  placeholder="e.g., Rice, Wheat"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t.experienceYears || "Experience (Years)"}
              </label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Years of farming experience"
                className="form-input"
                min="0"
              />
            </div>

            <div className="form-group file-group">
              <label className="form-label">
                <span className="label-icon">📄</span>
                Land Document (PDF)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setLandDocument(e.target.files[0])}
                className="file-input"
                required
              />
              {errors.landDocument && (
                <span className="error">{errors.landDocument}</span>
              )}
            </div>
          </div>
        );

      case "drone_controller":
        return (
          <div className="role-section">
            <div className="role-header">
              <div className="role-icon drone-icon">🚁</div>
              <h3 className="role-title">Drone Controller Details</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  {t.licenseId || "License ID"}
                </label>
                <input
                  type="text"
                  name="license_id"
                  value={formData.license_id}
                  onChange={handleChange}
                  placeholder="Enter License ID"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t.baseLocation || "Base Location"}
                </label>
                <input
                  type="text"
                  name="base_location"
                  value={formData.base_location}
                  onChange={handleChange}
                  placeholder="Enter Base Location"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  {t.availableDrones || "Available Drones"}
                </label>
                <input
                  type="number"
                  name="available_drones"
                  value={formData.available_drones}
                  onChange={handleChange}
                  placeholder="Number of drones"
                  className="form-input"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t.flightExperienceYears || "Flight Experience (Years)"}
                </label>
                <input
                  type="number"
                  name="flight_experience"
                  value={formData.flight_experience}
                  onChange={handleChange}
                  placeholder="Years of experience"
                  className="form-input"
                  min="0"
                />
              </div>
            </div>
          </div>
        );

      // case "admin":
      //   return (
      //     <div className="role-section">
      //       <div className="role-header">
      //         <div className="role-icon admin-icon">🛡</div>
      //         <h3 className="role-title">Admin Access</h3>
      //       </div>
      //       <div className="admin-note">
      //         <p>Admin privileges will be granted after verification.</p>
      //       </div>
      //     </div>
      //   )

      default:
        return null;
    }
  };

  return (
    <>
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <div className="logo-section">
              <div className="logo">🌱</div>
              <h1>MAATI AI</h1>
            </div>
            <p className="tagline">
              {t.registerTagline ||
                "Join MAATI AI and revolutionize your farming experience"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Basic Information Section */}
            <div className="form-section">
              <h3 className="section-title">
                <span className="section-icon">👤</span>
                Basic Information
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    <span className="label-icon">👤</span>
                    {t.firstName || "First Name"}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder={t.enterFirstName || "Enter First Name"}
                    className={`form-input ${errors.firstName ? "error-input" : ""}`}
                    required
                  />
                  {errors.firstName && (
                    <span className="error">{errors.firstName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    <span className="label-icon">📧</span>
                    {t.email || "Email"}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t.enterEmail || "Enter Email"}
                    className={`form-input ${errors.email ? "error-input" : ""}`}
                    required
                  />
                  {errors.email && (
                    <span className="error">{errors.email}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="mob" className="form-label">
                  <span className="label-icon">📱</span>
                  {t.mob || "mob Number"}
                </label>
                <input
                  type="tel"
                  id="mob"
                  name="mob"
                  value={formData.mob}
                  onChange={handleChange}
                  placeholder={t.entermob || "Enter mob Number"}
                  className={`form-input ${errors.mob ? "error-input" : ""}`}
                  required
                />
                {errors.mob && <span className="error">{errors.mob}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    <span className="label-icon">🔒</span>
                    {t.createPassword || "Create Password"}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t.enterPassword || "Enter Password"}
                    className={`form-input ${errors.password ? "error-input" : ""}`}
                    required
                  />
                  {errors.password && (
                    <span className="error">{errors.password}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    <span className="label-icon">🔒</span>
                    {t.confirmPassword || "Confirm Password"}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t.reEnterPassword || "Re-enter Password"}
                    className={`form-input ${errors.confirmPassword ? "error-input" : ""}`}
                    required
                  />
                  {errors.confirmPassword && (
                    <span className="error">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="section-divider"></div>

            {/* Role Selection */}
            <div className="form-section">
              <h3 className="section-title">Select Your Role</h3>
              <div className="form-group">
                <label className="form-label">{t.role || "Role"}</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">-- Select Role --</option>
                  <option value="farmer">🌱 {t.farmer || "Farmer"}</option>
                  {/* <option value="admin">🛡 {t.admin || "Admin"}</option> */}
                  <option value="drone_controller">
                    🚁 {t.droneController || "Drone Controller"}
                  </option>
                </select>
              </div>

              {formData.role && (
                <div
                  className={`role-badge ${formData.role.replace(" ", "-")}-badge`}
                >
                  <span className="badge-icon">
                    {formData.role === "farmer"
                      ? "🌱"
                      : formData.role === "admin"
                        ? "🛡"
                        : "🚁"}
                  </span>
                  {formData.role === "farmer"
                    ? t.farmer
                    : formData.role === "admin"
                      ? t.admin
                      : t.droneController}
                </div>
              )}
            </div>

            {/* Role-specific fields */}
            {formData.role && (
              <>
                <div className="section-divider"></div>
                {renderRoleFields()}
              </>
            )}

            {errors.submit && (
              <div className="error-alert">
                <span className="error-icon">⚠</span>
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              className="register-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  {t.registering || "Creating Account..."}
                </>
              ) : (
                <>
                  <span className="btn-icon">✅</span>
                  {t.register || "Create Account"}
                </>
              )}
            </button>
          </form>

          <div className="register-footer">
            <p>
              {t.haveAccount || "Already have an account?"}{" "}
              <Link to="/login" className="login-link">
                {t.login || "Sign In"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
