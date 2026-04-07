"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { translations } from "../utils/translations";
import "../styles/Login.css";
import navLogo from "../assets/Maati AI.jpg";

const Login = ({ onLogin, currentLanguage }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Fallback to 'en' if currentLanguage is not defined or translation not found
  const t = translations[currentLanguage] || translations["en"];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await onLogin({
      email: formData.email,
      password: formData.password,
    });
  } catch (error) {
    // Toast is handled globally in AppRoutes.
  }
};


  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-section">
                        <img
              src={navLogo}
              alt="Maati AI logo"
              className="logo-image"
              draggable="false"
            />
            <h1>MAATI AI</h1>
          </div>
          <p className="tagline">{t.loginTagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">{t.email}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t.enterEmail}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t.password}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t.enterPassword}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            {t.login}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {t.noAccount}{" "}
            <Link to="/register" className="register-link">
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
