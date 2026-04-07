import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiFileText,
  FiLayers,
  FiLock,
  FiMail,
  FiMapPin,
  FiNavigation,
  FiPackage,
  FiPhone,
  FiPlusCircle,
  FiShield,
  FiTrash2,
  FiTruck,
  FiUser,
} from "react-icons/fi";
import { getApiUrl } from "../api/traceabilityApi";
import { translations } from "../utils/translations";
import "./Register.css";
import navLogo from "../assets/Maati AI.jpg";

const API_URL = getApiUrl();

const supplierTypeOptions = [
  "Local Trader",
  "Aggregator",
  "Farmer Producer Organization (FPO)",
];

const cropsHandledOptions = [
  "Rice",
  "Potato",
  "Wheat",
  "Maize",
  "Pulses",
  "Vegetables",
  "Fruits",
  "Oilseeds",
];

const sourcingTypeOptions = [
  "Direct from Farmers",
  "From Farmer Groups (FPO/Cooperative)",
  "From Mandi",
  "From Local Traders",
  "From Commission Agents",
  "From Aggregators",
  "From Wholesalers",
  "From Distributors",
  "From Processing Units",
  "From Storage Facilities",
];

const transportTypeOptions = [
  "Pickup Van",
  "Mini Truck",
  "Truck (Heavy)",
  "Refrigerated Truck",
  "Tractor Trolley",
  "Third-Party Transport",
];

const storageTypeOptions = [
  "Open Storage",
  "Warehouse",
  "Cold Storage",
  "Refrigerated Storage",
  "Grain Silo",
  "Temporary Shed",
  "No Storage",
];

const createEmptyOperatingArea = () => ({
  village: "",
  district: "",
  state: "",
  pincode: "",
  cropsHandled: [],
  useOtherCrop: false,
  otherCropName: "",
  sourcingType: "",
  avgDailyVolume: "",
});

const getAreaCropsHandled = (area) => {
  const crops = Array.isArray(area.cropsHandled) ? [...area.cropsHandled] : [];
  const otherCrop = String(area.otherCropName || "").trim();

  if (area.useOtherCrop && otherCrop) {
    crops.push(otherCrop);
  }

  return crops.filter(Boolean);
};

const createInitialFormData = () => ({
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
  supplier_type: "",
  has_transport: false,
  transport_type: "",
  storage_facility: false,
  storage_type: "",
  latitude: "",
  longitude: "",
});

const Register = ({ currentLanguage, showGlobalToast }) => {
  const [formData, setFormData] = useState(createInitialFormData);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [landDocument, setLandDocument] = useState(null);
  const [operatingAreas, setOperatingAreas] = useState([createEmptyOperatingArea()]);
  const locationTimeoutRef = useRef(null);
  const locationAbortRef = useRef(null);
  const locationCacheRef = useRef(new Map());
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = translations[currentLanguage] || translations.en;
  const navigate = useNavigate();

  const resetRoleSpecificState = (nextRole) => {
    if (nextRole !== "farmer") {
      setLandDocument(null);
      setLocationSuggestions([]);
    }

    if (nextRole !== "supplier") {
      setOperatingAreas([createEmptyOperatingArea()]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    if (name === "role") {
      resetRoleSpecificState(value);
      setErrors({});
      setFormData((prev) => ({
        ...prev,
        role: value,
        ...(value === "farmer"
          ? {}
          : {
              farm_location: "",
              land_size: "",
              crop_type: "",
              experience: "",
              latitude: "",
              longitude: "",
            }),
        ...(value === "drone_controller"
          ? {}
          : {
              license_id: "",
              base_location: "",
              available_drones: "",
              flight_experience: "",
            }),
        ...(value === "supplier"
          ? {}
          : {
              supplier_type: "",
              has_transport: false,
              transport_type: "",
              storage_facility: false,
              storage_type: "",
            }),
      }));
      return;
    }

    setFormData((prev) => {
      const nextData = { ...prev, [name]: fieldValue };
      if (name === "has_transport" && !checked) nextData.transport_type = "";
      if (name === "storage_facility" && !checked) nextData.storage_type = "";
      return nextData;
    });

    if (name === "farm_location") {
      if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
      if (value.length < 3) {
        setLocationSuggestions([]);
        return;
      }

      const query = value.trim();
      const cacheKey = query.toLowerCase();
      const cached = locationCacheRef.current.get(cacheKey);

      if (cached) {
        setLocationSuggestions(cached);
        return;
      }

      locationTimeoutRef.current = setTimeout(async () => {
        try {
          if (locationAbortRef.current) locationAbortRef.current.abort();

          const controller = new AbortController();
          locationAbortRef.current = controller;

          const res = await fetch(
            `${API_URL}/api/location/search?q=${encodeURIComponent(query)}`,
            { signal: controller.signal },
          );

          if (!res.ok) throw new Error("Location fetch failed");

          const data = await res.json();
          locationCacheRef.current.set(cacheKey, data);
          setLocationSuggestions(data);
        } catch (err) {
          if (err.name === "AbortError") return;
          console.error("Location fetch error:", err);
          setLocationSuggestions([]);
        }
      }, 200);
    }
  };

  useEffect(() => {
    return () => {
      if (locationTimeoutRef.current) clearTimeout(locationTimeoutRef.current);
      if (locationAbortRef.current) locationAbortRef.current.abort();
    };
  }, []);

  const handleLocationSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      farm_location: location.display_name,
      latitude: location.lat,
      longitude: location.lon,
    }));
    setLocationSuggestions([]);
  };

  const handleOperatingAreaChange = (index, field, value) => {
    setOperatingAreas((prev) =>
      prev.map((area, areaIndex) =>
        areaIndex === index ? { ...area, [field]: value } : area,
      ),
    );
  };

  const handleCropToggle = (index, crop) => {
    setOperatingAreas((prev) =>
      prev.map((area, areaIndex) => {
        if (areaIndex !== index) return area;

        const isSelected = area.cropsHandled.includes(crop);
        return {
          ...area,
          cropsHandled: isSelected
            ? area.cropsHandled.filter((item) => item !== crop)
            : [...area.cropsHandled, crop],
        };
      }),
    );
  };

  const handleOtherCropToggle = (index) => {
    setOperatingAreas((prev) =>
      prev.map((area, areaIndex) =>
        areaIndex === index
          ? {
              ...area,
              useOtherCrop: !area.useOtherCrop,
              otherCropName: area.useOtherCrop ? "" : area.otherCropName,
            }
          : area,
      ),
    );
  };

  const addOperatingArea = () => {
    setOperatingAreas((prev) => [...prev, createEmptyOperatingArea()]);
  };

  const removeOperatingArea = (index) => {
    setOperatingAreas((prev) => prev.filter((_, areaIndex) => areaIndex !== index));
  };

  const validateSupplierAreas = () =>
    operatingAreas.every(
      (area) =>
        area.village.trim() &&
        area.district.trim() &&
        area.state.trim() &&
        area.pincode.trim() &&
        area.sourcingType.trim() &&
        area.avgDailyVolume.trim() &&
        getAreaCropsHandled(area).length > 0 &&
        (!area.useOtherCrop || area.otherCropName.trim()),
    );

  const validateForm = () => {
    const validationErrors = {};

    if (!formData.firstName.trim()) {
      validationErrors.firstName = t.requiredField || "This field is required.";
    }

    if (!formData.email.includes("@")) {
      validationErrors.email = t.invalidEmail || "Invalid email format.";
    }

    if (!formData.mob.trim()) {
      validationErrors.mob = t.requiredField || "This field is required.";
    }

    if (formData.password.length < 8) {
      validationErrors.password =
        t.passwordError || "Password must be at least 8 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword =
        t.passwordMismatch || "Passwords do not match.";
    }

    if (formData.role === "farmer" && !landDocument) {
      validationErrors.landDocument = "Land document is required.";
    }

    if (formData.role === "supplier") {
      if (!formData.supplier_type) {
        validationErrors.supplier_type = "Supplier type is required.";
      }

      if (!validateSupplierAreas()) {
        validationErrors.operatingAreas =
          "Please complete each operating area and select at least one crop.";
      }

      if (formData.has_transport && !formData.transport_type) {
        validationErrors.transport_type = "Transport type is required.";
      }

      if (formData.storage_facility && !formData.storage_type) {
        validationErrors.storage_type = "Storage type is required.";
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
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
      } else if (formData.role === "supplier") {
        submissionData.append("supplierType", formData.supplier_type);
        submissionData.append(
          "operatingAreas",
          JSON.stringify(
            operatingAreas.map((area) => ({
              village: area.village,
              district: area.district,
              state: area.state,
              pincode: area.pincode,
              cropsHandled: getAreaCropsHandled(area),
              sourcingType: area.sourcingType,
              avgDailyVolume: area.avgDailyVolume,
            })),
          ),
        );
        submissionData.append("hasTransport", String(formData.has_transport));
        submissionData.append("transportType", formData.transport_type);
        submissionData.append(
          "storageFacility",
          String(formData.storage_facility),
        );
        submissionData.append("storageType", formData.storage_type);
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        body: submissionData,
      });

      if (!response.ok) {
        let errorMessage = "Registration failed";

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }

        throw new Error(errorMessage);
      }

      showGlobalToast?.("Registration successful. You can now login.", "success");
      navigate("/login");
    } catch (registerError) {
      console.error("Registration error:", registerError);
      showGlobalToast?.(
        registerError.message || "Registration failed. Please try again.",
        "error",
      );
      setErrors({
        submit:
          registerError.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSupplierFields = () => (
    <div className="role-section">
      <div className="role-header">
        <div className="role-icon supplier-icon">
          <FiPackage />
        </div>
        <h3 className="role-title">Supplier Details</h3>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span className="label-icon">
            <FiLayers />
          </span>
          Supplier Type
        </label>
        <select
          name="supplier_type"
          value={formData.supplier_type}
          onChange={handleChange}
          className={`form-select ${errors.supplier_type ? "error-input" : ""}`}
          required
        >
          <option value="">Select supplier type</option>
          {supplierTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.supplier_type && (
          <span className="error">{errors.supplier_type}</span>
        )}
      </div>

      <div className="supplier-subsection">
        <div className="supplier-subsection-header">
          <div>
            <h4 className="subsection-heading">Operating Area & Crop Handling</h4>
            <p className="subsection-caption">
              Add one or more sourcing entries for the areas you operate in.
            </p>
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={addOperatingArea}
          >
            <FiPlusCircle />
            Add More
          </button>
        </div>

        {operatingAreas.map((area, index) => (
          <div key={`operating-area-${index}`} className="repeatable-card">
            <div className="repeatable-card-header">
              <span className="repeatable-card-title">Entry {index + 1}</span>
              {operatingAreas.length > 1 && (
                <button
                  type="button"
                  className="link-btn-danger"
                  onClick={() => removeOperatingArea(index)}
                >
                  <FiTrash2 />
                  Remove
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Village</label>
                <input
                  type="text"
                  value={area.village}
                  onChange={(e) =>
                    handleOperatingAreaChange(index, "village", e.target.value)
                  }
                  placeholder="Enter village"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">District</label>
                <input
                  type="text"
                  value={area.district}
                  onChange={(e) =>
                    handleOperatingAreaChange(index, "district", e.target.value)
                  }
                  placeholder="Enter district"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  value={area.state}
                  onChange={(e) =>
                    handleOperatingAreaChange(index, "state", e.target.value)
                  }
                  placeholder="Enter state"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  value={area.pincode}
                  onChange={(e) =>
                    handleOperatingAreaChange(index, "pincode", e.target.value)
                  }
                  placeholder="Enter pincode"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Crops Handled</label>
              <div className="checkbox-grid">
                {cropsHandledOptions.map((crop) => {
                  const isSelected = area.cropsHandled.includes(crop);

                  return (
                    <label
                      key={`${index}-${crop}`}
                      className={`chip-option ${isSelected ? "active" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCropToggle(index, crop)}
                      />
                      <span>{crop}</span>
                    </label>
                  );
                })}

                <label
                  className={`chip-option ${area.useOtherCrop ? "active" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={area.useOtherCrop}
                    onChange={() => handleOtherCropToggle(index)}
                  />
                  <span>Other</span>
                </label>
              </div>

              {area.useOtherCrop && (
                <div className="supplier-other-crop-input">
                  <input
                    type="text"
                    value={area.otherCropName}
                    onChange={(e) =>
                      handleOperatingAreaChange(
                        index,
                        "otherCropName",
                        e.target.value,
                      )
                    }
                    placeholder="Type a crop name not listed above"
                    className="form-input"
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sourcing Type</label>
                <select
                  value={area.sourcingType}
                  onChange={(e) =>
                    handleOperatingAreaChange(index, "sourcingType", e.target.value)
                  }
                  className="form-select"
                  required
                >
                  <option value="">Select sourcing type</option>
                  {sourcingTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Average Daily Volume</label>
                <input
                  type="text"
                  value={area.avgDailyVolume}
                  onChange={(e) =>
                    handleOperatingAreaChange(
                      index,
                      "avgDailyVolume",
                      e.target.value,
                    )
                  }
                  placeholder="e.g., 1000 kg/day"
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>
        ))}

        {errors.operatingAreas && (
          <span className="error">{errors.operatingAreas}</span>
        )}
      </div>

      <div className="supplier-subsection">
        <div className="supplier-subsection-header">
          <div>
            <h4 className="subsection-heading">Logistics Capability</h4>
            <p className="subsection-caption">
              Tell us about your transport and storage setup.
            </p>
          </div>
        </div>

        <div className="toggle-grid">
          <label className="toggle-card">
            <div className="toggle-copy">
              <span className="toggle-title">
                <FiTruck />
                Has Transport
              </span>
              <span className="toggle-description">
                Enable if you manage or arrange transport directly.
              </span>
            </div>
            <span className="toggle-control">
              <input
                type="checkbox"
                name="has_transport"
                checked={formData.has_transport}
                onChange={handleChange}
                className="toggle-input"
              />
              <span className="toggle-switch"></span>
            </span>
          </label>

          <label className="toggle-card">
            <div className="toggle-copy">
              <span className="toggle-title">
                <FiPackage />
                Storage Facility
              </span>
              <span className="toggle-description">
                Enable if you have access to any storage setup.
              </span>
            </div>
            <span className="toggle-control">
              <input
                type="checkbox"
                name="storage_facility"
                checked={formData.storage_facility}
                onChange={handleChange}
                className="toggle-input"
              />
              <span className="toggle-switch"></span>
            </span>
          </label>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Transport Type</label>
            <select
              name="transport_type"
              value={formData.transport_type}
              onChange={handleChange}
              className={`form-select ${errors.transport_type ? "error-input" : ""}`}
              disabled={!formData.has_transport}
            >
              <option value="">Select transport type</option>
              {transportTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.transport_type && (
              <span className="error">{errors.transport_type}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Storage Type</label>
            <select
              name="storage_type"
              value={formData.storage_type}
              onChange={handleChange}
              className={`form-select ${errors.storage_type ? "error-input" : ""}`}
              disabled={!formData.storage_facility}
            >
              <option value="">Select storage type</option>
              {storageTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.storage_type && (
              <span className="error">{errors.storage_type}</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );

  const renderRoleFields = () => {
    if (!formData.role) return null;

    switch (formData.role) {
      case "farmer":
        return (
          <div className="role-section">
            <div className="role-header">
              <div className="role-icon farmer-icon">
                <FiUser />
              </div>
              <h3 className="role-title">Farmer Details</h3>
            </div>

            <div className="form-group location-group">
              <label className="form-label">
                <span className="label-icon">
                  <FiMapPin />
                </span>
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
                      key={`${location.display_name}-${index}`}
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
                <label className="form-label">{t.landSize || "Land Size"}</label>
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
                <label className="form-label">{t.cropType || "Crop Type"}</label>
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
                <span className="label-icon">
                  <FiFileText />
                </span>
                Land Document (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setLandDocument(e.target.files?.[0] || null)}
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
              <div className="role-icon drone-icon">
                <FiNavigation />
              </div>
              <h3 className="role-title">Drone Controller Details</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t.licenseId || "License ID"}</label>
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

      case "supplier":
        return renderSupplierFields();

      default:
        return null;
    }
  };

  const selectedRoleConfig =
    formData.role === "farmer"
      ? { label: t.farmer || "Farmer", icon: <FiUser /> }
      : formData.role === "supplier"
        ? { label: t.supplier || "Supplier", icon: <FiPackage /> }
        : formData.role === "admin"
          ? { label: t.admin || "Admin", icon: <FiShield /> }
          : { label: t.droneController || "Drone Controller", icon: <FiNavigation /> };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="logo-section">
            <img
              src={navLogo}
              alt="Maati AI logo"
              className="logo-image"
              draggable="false"
            />
            <h1>MAATI AI</h1>
          </div>
          <p className="tagline">
            {t.registerTagline ||
              "Join MAATI AI and revolutionize your farming experience"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">
                <FiUser />
              </span>
              Basic Information
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  <span className="label-icon">
                    <FiUser />
                  </span>
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
                  <span className="label-icon">
                    <FiMail />
                  </span>
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
                {errors.email && <span className="error">{errors.email}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="mob" className="form-label">
                <span className="label-icon">
                  <FiPhone />
                </span>
                {t.mobile || "Mobile Number"}
              </label>
              <input
                type="tel"
                id="mob"
                name="mob"
                value={formData.mob}
                onChange={handleChange}
                placeholder={t.enterMobile || "Enter Mobile Number"}
                className={`form-input ${errors.mob ? "error-input" : ""}`}
                required
              />
              {errors.mob && <span className="error">{errors.mob}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <span className="label-icon">
                    <FiLock />
                  </span>
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
                  <span className="label-icon">
                    <FiLock />
                  </span>
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
                <option value="farmer">{t.farmer || "Farmer"}</option>
                <option value="supplier">{t.supplier || "Supplier"}</option>
                <option value="drone_controller">
                  {t.droneController || "Drone Controller"}
                </option>
              </select>
            </div>

            {formData.role && (
              <div className={`role-badge ${formData.role}-badge`}>
                <span className="badge-icon">{selectedRoleConfig.icon}</span>
                {selectedRoleConfig.label}
              </div>
            )}
          </div>

          {formData.role && (
            <>
              <div className="section-divider"></div>
              {renderRoleFields()}
            </>
          )}

          {errors.submit && (
            <div className="error-alert">
              <span className="error-icon">!</span>
              {errors.submit}
            </div>
          )}

          <button type="submit" className="register-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="loading-spinner"></span>
                {t.registering || "Creating Account..."}
              </>
            ) : (
              <>
                <span className="btn-icon">
                  <FiCheckCircle />
                </span>
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
  );
};

export default Register;
