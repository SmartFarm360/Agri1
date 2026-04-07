"use client"
import { useNavigate } from "react-router-dom"
import { translations } from "../utils/translations"
import TraceabilityPage from "./TraceabilityPage"
import "./Home.css"
import drone2 from "/src/assets/drone2.jpg"

const Home = ({
  currentLanguage,
  onTraceabilityClick,
  onGoToDashboard,
}) => {
  const navigate = useNavigate()
  const t = translations?.[currentLanguage] ?? translations["en"]

  const handleGetStarted = () => {
    navigate("/about")
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-background-elements">
          <div className="floating-element element-1"></div>
          <div className="floating-element element-2"></div>
          <div className="floating-element element-3"></div>
        </div>

        <div className="hero-content">


          <h1 className="hero-title">
            <span id="smart">Maati</span>
            <span id="farm">AI</span>
          </h1>

          <p className="hero-subtitle">{t.heroSubtitle ?? "Transforming agriculture with intelligence and care."}</p>

          <div className="hero-actions">
            <button className="get-started-btn primary" onClick={handleGetStarted}>
              <span className="btn-text">{t.getStarted ?? "Get Started"}</span>
            </button>
            <button className="get-started-btn secondary">
              <span className="btn-icon">▶</span>
              <span className="btn-text">Watch Demo</span>
            </button>
          </div>
        </div>

        <div className="hero-image-container">
          <div className="image-decoration">
            <div className="decoration-circle circle-1"></div>
            <div className="decoration-circle circle-2"></div>
            <div className="decoration-circle circle-3"></div>
          </div>
          <div className="image-wrapper">
            <img src={drone2 || "/placeholder.svg"} alt="Smart farming illustration" className="hero-image" />
            <div className="image-overlay">
    
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="features-header">
          <div className="section-badge">
            <span className="badge-icon">✨</span>
            <span className="badge-text">Our Features</span>
          </div>
          <h2 className="features-title">{t.whyChooseUs ?? "Why Choose Us?"}</h2>
          <p className="features-subtitle">
            Discover the powerful features that make MAATI AI the perfect choice for modern agriculture
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-header">
                <div className="feature-icon-container">
                  <div className="feature-icon">📊</div>
                  <div className="icon-glow"></div>
                </div>
                <h3 className="feature-title">{t.realTimeMonitoring ?? "Real-Time Monitoring"}</h3>
              </div>
              <p className="feature-description">
                {t.monitoringDesc ?? "Stay updated with instant data from drones, sensors, and satellites."}
              </p>
              <div className="feature-footer">
                <span className="feature-link">Learn More →</span>
              </div>
            </div>
            <div className="card-glow"></div>
          </div>

          <div className="feature-card featured">
            <div className="featured-badge">
              <span>Most Popular</span>
            </div>
            <div className="feature-card-inner">
              <div className="feature-header">
                <div className="feature-icon-container">
                  <div className="feature-icon">🤖</div>
                  <div className="icon-glow"></div>
                </div>
                <h3 className="feature-title">{t.aiPowered ?? "AI-Powered Decisions"}</h3>
              </div>
              <p className="feature-description">
                {t.aiDesc ?? "Get smart suggestions on fertilizers, irrigation, and pest control."}
              </p>
              <div className="feature-footer">
                <span className="feature-link">Learn More →</span>
              </div>
            </div>
            <div className="card-glow featured-glow"></div>
          </div>

          <div className="feature-card">
            <div className="feature-card-inner">
              <div className="feature-header">
                <div className="feature-icon-container">
                  <div className="feature-icon">📱</div>
                  <div className="icon-glow"></div>
                </div>
                <h3 className="feature-title">{t.easyToUse ?? "Easy to Use"}</h3>
              </div>
              <p className="feature-description">
                {t.easyDesc ?? "Simple, intuitive interface that works on any device for every farmer."}
              </p>
              <div className="feature-footer">
                <span className="feature-link">Learn More →</span>
              </div>
            </div>
            <div className="card-glow"></div>
          </div>
        </div> 
      </div>

      <TraceabilityPage
        embedded
        onStartMonitoring={onTraceabilityClick}
        onGoToDashboard={onGoToDashboard}
      />
    </div>
  )
}

export default Home
