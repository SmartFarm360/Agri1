import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import MainLayout from "./components/MainLayout";
import About from "./components/About";
import Dashboard from "./components/Dashboard";
import DroneDashboard from "./components/DroneDashboard";
import History from "./components/History";
import Language from "./components/Language";
import Profile from "./components/Profile";
import Blog from "./components/Blog";
import Help from "./components/Help";

import axios from "axios";

function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [userRole, setUserRole] = useState("");
  const [appLoaded, setAppLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const role = localStorage.getItem("userRole");
    const savedLang = localStorage.getItem("selectedLanguage");

    if (authStatus === "true") setIsAuthenticated(true);
    if (role) setUserRole(role);
    if (savedLang) setCurrentLanguage(savedLang);

    setAppLoaded(true);
  }, []);

  const handleLogin = async (credentials) => {
    const API_URL = import.meta.env.VITE_API_URL;

    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      credentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data?.token && response.data?.role) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", response.data.role);
      localStorage.setItem("token", response.data.token);

      setIsAuthenticated(true);
      setUserRole(response.data.role);

      if (response.data.role === "farmer") {
        navigate("/dashboard");
      } else if (response.data.role === "drone_controller") {
        navigate("/drone-dashboard");
      } else {
        navigate("/");
      }
    } else {
      throw new Error("Invalid login response");
    }
  };

  const handleRegister = async (formData) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data?.message) {
        alert("Registration successful. You can now login.");
        navigate("/login");
      } else {
        alert("Registration failed: Invalid response from server.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(
        "Registration failed: " +
          (error.response?.data?.message || "Server error"),
      );
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole("");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    appLoaded && (
      <Routes>
        {/* ✅ HOME PAGE - always show */}
        <Route
          path="/"
          element={
            <MainLayout
              isAuthenticated={isAuthenticated}
              onLogout={handleLogout}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
            >
              <Home currentLanguage={currentLanguage} />
            </MainLayout>
          }
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <Login onLogin={handleLogin} currentLanguage={currentLanguage} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* REGISTER */}
        <Route
          path="/register"
          element={
            !isAuthenticated ? (
              <Register
                onRegister={handleRegister}
                currentLanguage={currentLanguage}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* LANGUAGE */}
        <Route
          path="/language"
          element={
            <Language
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
              onClose={() => {}}
            />
          }
        />

        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <MainLayout
                isAuthenticated={isAuthenticated}
                onLogout={handleLogout}
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
              >
                <Profile currentLanguage={currentLanguage} />
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* BLOG */}
        <Route
          path="/blog"
          element={
            <MainLayout
              isAuthenticated={isAuthenticated}
              onLogout={handleLogout}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
            >
              <Blog currentLanguage={currentLanguage} />
            </MainLayout>
          }
        />

        {/* FARMER DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated && userRole === "farmer" ? (
              <MainLayout
                isAuthenticated={isAuthenticated}
                onLogout={handleLogout}
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
              >
                <Dashboard currentLanguage={currentLanguage} />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* DRONE CONTROLLER DASHBOARD */}
        <Route
          path="/drone-dashboard"
          element={
            isAuthenticated && userRole === "drone_controller" ? (
              <MainLayout
                isAuthenticated={isAuthenticated}
                onLogout={handleLogout}
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
              >
                <DroneDashboard currentLanguage={currentLanguage} />
              </MainLayout>
            ) : (
              <div style={{ padding: "2rem", color: "red" }}>
                Not authorized for Drone Dashboard. Your role: {userRole}
              </div>
            )
          }
        />

        {/* DEV TEST */}
        <Route
          path="/drone-dashboard-test"
          element={<DroneDashboard currentLanguage={currentLanguage} />}
        />

        {/* ABOUT */}
        <Route
          path="/about"
          element={
            <MainLayout
              isAuthenticated={isAuthenticated}
              onLogout={handleLogout}
              currentLanguage={currentLanguage}
              setCurrentLanguage={setCurrentLanguage}
            >
              <About currentLanguage={currentLanguage} />
            </MainLayout>
          }
        />

        {/* HISTORY */}
        <Route
          path="/history"
          element={
            isAuthenticated && userRole === "farmer" ? (
              <MainLayout
                isAuthenticated={isAuthenticated}
                onLogout={handleLogout}
                currentLanguage={currentLanguage}
                setCurrentLanguage={setCurrentLanguage}
              >
                <History currentLanguage={currentLanguage} />
              </MainLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="/help" element={<Help />} />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    )
  );
}

export default AppRoutes;
