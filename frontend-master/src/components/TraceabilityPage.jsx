import React, { useEffect, useState } from "react";
import {
  Sprout,
  Menu,
  X,
  ArrowRight,
  Play,
  Wheat,
  CheckCircle,
  TrendingUp,
  Clock,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Github,
  Linkedin,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./TraceabilityPage.css";

const yieldData = [
  { name: "W1", yield: 400 },
  { name: "W2", yield: 300 },
  { name: "W3", yield: 600 },
  { name: "W4", yield: 800 },
  { name: "W5", yield: 500 },
  { name: "W6", yield: 900 },
];

export default function TraceabilityPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("traceability-page-active");
    document.getElementById("root")?.classList.add("traceability-root-active");

    return () => {
      document.body.classList.remove("traceability-page-active");
      document
        .getElementById("root")
        ?.classList.remove("traceability-root-active");
    };
  }, []);

  return (
    <div className="ta-page-wrapper">
      {/* Navbar */}
      <nav className="ta-navbar">
        <div className="ta-container ta-nav-inner">
          <div className="ta-logo">
            <div className="ta-logo-icon">
              <Sprout size={20} />
            </div>
            <span className="ta-logo-text">TraceAgri</span>
          </div>

          <div className={`ta-nav-links ${isMenuOpen ? "active" : ""}`}>
            <a href="#" className="ta-nav-link active">
              Summary
            </a>
            <a href="#" className="ta-nav-link">
              Features
            </a>
            <a href="#" className="ta-nav-link">
              Lifecycle
            </a>
            <a href="#" className="ta-nav-link">
              Analytics
            </a>
            <div className="ta-mobile-actions">
              <button className="ta-btn-text">Login</button>
              <button className="ta-btn-black">Get Started</button>
            </div>
          </div>

          <div className="ta-nav-actions">
            <button className="ta-btn-text">Login</button>
            <button className="ta-btn-black">Get Started</button>
          </div>

          <button
            className="ta-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="ta-hero">
        <div className="ta-container ta-hero-inner">
          <div className="ta-hero-content">
            <span className="ta-badge">Agricultural Lifecycle Management</span>
            <h1 className="ta-hero-title">
              Full Traceability <br />
              <span className="ta-text-green">From Seed to Batch</span>
            </h1>
            <p className="ta-hero-desc">
              A unified platform to track every stage of your agricultural
              production. Monitor crop health, field activity, and supply chain
              with total transparency.
            </p>
            <div className="ta-hero-btns">
              <button className="ta-btn-black ta-btn-lg">
                Start Monitoring <ArrowRight size={18} />
              </button>
              <button className="ta-btn-outline ta-btn-lg">
                Request a Demo
              </button>
            </div>
          </div>

          <div className="ta-hero-visual">
            <div className="ta-dashboard-card">
              <div className="ta-card-header">
                <div>
                  <h4 className="ta-card-title">Live Traceability</h4>
                  <p className="ta-card-subtitle">
                    Batch: #AG-7429 - Premium Wheat
                  </p>
                </div>
                <span className="ta-status-pill">In Progress</span>
              </div>
              <div className="ta-chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yieldData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="yield"
                      stroke="#14a236"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#14a236" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="ta-card-stats">
                <div className="ta-mini-stat">
                  <span className="ta-mini-label">Health</span>
                  <span className="ta-mini-val ta-text-green">98%</span>
                </div>
                <div className="ta-mini-stat">
                  <span className="ta-mini-label">Water</span>
                  <span className="ta-mini-val">Optimal</span>
                </div>
                <div className="ta-mini-stat">
                  <span className="ta-mini-label">ETA</span>
                  <span className="ta-mini-val">12 Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="ta-stats-bar">
        <div className="ta-container ta-stats-grid">
          <div className="ta-stat-item">
            <Wheat className="ta-stat-icon" />
            <h3 className="ta-stat-val">1,240</h3>
            <p className="ta-stat-label">Total Batches</p>
          </div>
          <div className="ta-stat-item">
            <CheckCircle className="ta-stat-icon" />
            <h3 className="ta-stat-val">99.8%</h3>
            <p className="ta-stat-label">Compliance</p>
          </div>
          <div className="ta-stat-item">
            <TrendingUp className="ta-stat-icon" />
            <h3 className="ta-stat-val">45.2k</h3>
            <p className="ta-stat-label">Metric Tons</p>
          </div>
          <div className="ta-stat-item">
            <Clock className="ta-stat-icon" />
            <h3 className="ta-stat-val">24/7</h3>
            <p className="ta-stat-label">Real-time Alerts</p>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="ta-video-section">
        <div className="ta-container ta-video-inner">
          <h2 className="ta-section-title">See TraceAgri in Action</h2>
          <p className="ta-section-desc">
            Watch how our platform transforms agricultural data into actionable
            insights.
          </p>
          <div className="ta-video-player">
            <img
              src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=1600"
              alt="Agri Tech"
            />
            <div className="ta-play-btn">
              <Play fill="white" size={32} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="ta-footer">
        <div className="ta-container">
          <div className="ta-footer-grid">
            <div className="ta-footer-brand">
              <div className="ta-logo">
                <div className="ta-logo-icon">
                  <Sprout size={18} />
                </div>
                <span className="ta-logo-text">TraceAgri</span>
              </div>
              <p className="ta-footer-tagline">
                Complete lifecycle management for modern agriculture.
              </p>
              <div className="ta-socials">
                <Twitter size={20} />
                <Github size={20} />
                <Linkedin size={20} />
              </div>
            </div>
            <div className="ta-footer-links">
              <h4>Product</h4>
              <a href="#">Summary</a>
              <a href="#">Features</a>
              <a href="#">Lifecycle</a>
            </div>
            <div className="ta-footer-contact">
              <h4>Contact</h4>
              <p>
                <MapPin size={14} /> 123 Agri Valley Way
              </p>
              <p>
                <Phone size={14} /> +1 (555) 123-4567
              </p>
              <p>
                <Mail size={14} /> hello@traceagri.ai
              </p>
            </div>
            <div className="ta-footer-news">
              <h4>Stay Updated</h4>
              <div className="ta-input-group">
                <input type="email" placeholder="Email" />
                <button>Join</button>
              </div>
            </div>
          </div>
          <div className="ta-footer-bottom">
            &copy; {new Date().getFullYear()} TraceAgri. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
