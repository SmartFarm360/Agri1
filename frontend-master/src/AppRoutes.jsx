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
import FarmBlog from "./components/Farm Blog";
import Help from "./components/Help";
import TraceabilityPage from "./components/TraceabilityPage";


import axios from "axios";

function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [userRole, setUserRole] = useState("");
  const [appLoaded, setAppLoaded] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    type: "success",
    message: "",
  });
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "https://agri1-32qq.onrender.com";

  const showToast = (message, type = "success") => {
    setToast({
      visible: true,
      type,
      message,
    });
  };

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const role = localStorage.getItem("userRole");
    const savedLang = localStorage.getItem("selectedLanguage");

    if (authStatus === "true") setIsAuthenticated(true);
    if (role) setUserRole(role);
    if (savedLang) setCurrentLanguage(savedLang);

    setAppLoaded(true);
  }, []);

  useEffect(() => {
    if (!toast.visible) return;

    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast.visible]);

  useEffect(() => {
    fetch(API_URL, { method: "GET", mode: "no-cors" }).catch(() => {});
  }, [API_URL]);

  const handleLogin = async (credentials) => {
    try {
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
        showToast("Logged in successfully.", "success");

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
    } catch (error) {
      showToast(
        error.response?.data?.message || error.message || "Login failed.",
        "error",
      );
      throw error;
    }
  };

  const handleRegister = async (formData) => {
    try {
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
        showToast("Registration successful. You can now login.", "success");
        navigate("/login");
      } else {
        showToast("Registration failed: Invalid response from server.", "error");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showToast(
        "Registration failed: " +
          (error.response?.data?.message || "Server error"),
        "error",
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
      <>
        {toast.visible && (
          <div
            style={{
              position: "fixed",
              top: "88px",
              right: "20px",
              zIndex: 2000,
              background: toast.type === "success" ? "#16a34a" : "#dc2626",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: "10px",
              boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
              fontWeight: 600,
              maxWidth: "320px",
            }}
          >
            {toast.message}
          </div>
        )}
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
                showGlobalToast={showToast}
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
              <FarmBlog currentLanguage={currentLanguage} />
            </MainLayout>
          }
        />

        {/* TRACEABILITY */}
        <Route path="/traceability" element={<TraceabilityPage />} />

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
      </>
    )
  );
}

export default AppRoutes;
