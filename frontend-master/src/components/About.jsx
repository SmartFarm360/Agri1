import { translations } from "../utils/translations"
import "./About.css"
import Farmer_Image from "../assets/Farmer_Image.jpg" // adjust path as needed
import logo from "../assets/smartFarm_logo.png" // adjust path as needed

const About = ({ currentLanguage }) => {
  const t = translations?.[currentLanguage] ?? translations["en"]

  return (
    <div className="about-container">
      {/* Top Section: Quotes + Hero Image */}
      <div className="about-hero">
        <div className="about-content">
          <h1>{t.aboutUs}</h1>
          <div className="inspiring-text">
            <p className="quote">"{t.inspiringQuote1 ?? "Empowering agriculture."}"</p>
            <p className="quote">"{t.inspiringQuote2 ?? "Technology meets tradition."}"</p>
            <p className="quote">"{t.inspiringQuote3 ?? "Farm smarter, not harder."}"</p>
          </div>
        </div>
        <div className="about-image">
          <img src={Farmer_Image || "/placeholder.svg"} alt="Farmers holding crops" className="farmer-image" />
        </div>
      </div>

      {/* New Product Info Section */}
      <div className="product-section">
        <div className="product-text">
          <h2>
            What is <span className="green-highlight">MAATI AI</span>?
          </h2>
          <p>
            <strong>MAATI AI</strong> is an AI-driven smart farming platform designed to empower farmers with
            real-time insights, crop health monitoring, and precision farming tools. It transforms data from drones,
            soil sensors, and satellite imagery into actionable guidance.
          </p>
          <p>
            🌀 Overall Shape — The CircleRepresents 360° — the full-cycle approach to farming.Symbolizes wholeness,
            connected systems, and smart integration — crop to drone to soil to analytics. It's not just farming—it's
            Smart Farming All Around.
          </p>
          <p>
            🟩 Green Segments (Top-left & Bottom-left)These symbolize natural growth, vegetation, sustainability.Likely
            represent crop fields, plants, or fertile land.It's the heart of farming, nurtured by tech.🧠
            Interpretation: "Tech must serve nature, not replace it."
          </p>
          <p>
            🟫 Brown Segment (Top-center-right)Brown = soil, earth, roots.This segment represents the foundation —
            literally, the ground-level of agriculture.Emphasizes soil quality, organic health, and possibly farm
            documentation like land ownership or location data.🧠 Hidden message: "Know your soil, know your farm."
          </p>
          <p>
            🔵 Blue Segments (Bottom-left, Bottom-right & Top-right)Blue = water, sky, technology, and innovation.This
            can represent:💧 Irrigation & water conservation☁️ Cloud-based AI systems🚁 Drone monitoringBlue in the top
            also may hint at the drone controller part of your system flying over the farm.🧠 Insight: Farming isn't
            grounded anymore. It's flying.
          </p>
          <p>
            🌿 Central Plant Inside the CircleThe green plant in the middle is the core focus: growing crops.It's
            sprouting from a geometric base that splits downward — almost looks like roots meeting tech.The surrounding
            shapes subtly mimic leaves, fields, and data flow.🧠 Message: "Every leaf is connected. Every crop is
            tracked. Every byte counts."
          </p>
          <p>
            <em>MAATI AI isn't just a tool—it's your farm's co-pilot.</em>
          </p>
        </div>
        <div className="product-image">
          <img src={logo || "/placeholder.svg"} alt="Smart Farm Dashboard" />
        </div>
      </div>

      {/* Mission Section */}
      <div className="mission-section">
        <h2>{t.ourMission ?? "Our Mission"}</h2>
        <p>{t.missionDescription ?? "To bring innovation and sustainability to every farm, big or small."}</p>
      </div>

      {/* Values Section */}
      <div className="values-section">
        <h2>{t.ourValues ?? "Our Core Values"}</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">🌱</div>
            <h3>{t.sustainability ?? "Sustainability"}</h3>
            <p>{t.sustainabilityDesc ?? "We believe in farming practices that nurture the planet and the future."}</p>
          </div>
          <div className="value-card">
            <div className="value-icon">💡</div>
            <h3>{t.innovation ?? "Innovation"}</h3>
            <p>{t.innovationDesc ?? "We bring cutting-edge tech to traditional farming challenges."}</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🤝</div>
            <h3>{t.community ?? "Community"}</h3>
            <p>{t.communityDesc ?? "We grow together—with our farmers, our team, and the planet."}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
