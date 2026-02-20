// MainLayout.jsx
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import navLogo from "../assets/Maati AI.jpg";
import "./MainLayout.css";

const baseText = {
  home: "Home",
  aboutUs: "About Us",
  dashboard: "Dashboard",
  language: "Language",
  history: "Issue Log",
  login: "Login",
  logout: "Logout",
  blog: "Blog",
  accountInfo: "Account Information",
  help: "Help",
  sendFeedback: "Send Feedback",
  footerDescription:
    "Empowering farmers with smart technology for sustainable agriculture.",
  contactUs: "Contact Us",
  allRightsReserved: "All rights reserved.",
  heroSubtitle: "Grow smarter, not harder.",
};

const languageLabels = {
  en: "English",
  hi: "हिन्दी",
};

const MainLayout = ({
  children,
  onLogout,
  currentLanguage = "en",
  setCurrentLanguage,
  isAuthenticated,
}) => {
  const [translatedText, setTranslatedText] = useState(baseText);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const location = useLocation();
  const langRef = useRef(null);

  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);
  const toggleLangMenu = () => setShowLangMenu(!showLangMenu);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const translateUI = async (targetLang) => {
    try {
      const res = await axios.post(
        "https://frontend-k-backend.onrender.com/translations",
        {
          q: Object.values(baseText),
          source: "en",
          target: targetLang,
        },
      );

      const translated = {};
      Object.keys(baseText).forEach((key, idx) => {
        translated[key] = res.data.translatedTexts[idx] || baseText[key];
      });

      setTranslatedText(translated);
    } catch (err) {
      console.error("Translation failed:", err.message);
      setTranslatedText(baseText);
    }
  };

  const handleLanguageChange = async (langCode) => {
    setCurrentLanguage(langCode);
    setShowLangMenu(false);
    await translateUI(langCode);
  };

  useEffect(() => {
    translateUI(currentLanguage);
  }, [currentLanguage]);

  const t = new Proxy(translatedText, {
    get: (target, prop) => target[prop] || baseText[prop] || prop,
  });

  return (
    <div className="main-layout">
      <nav className="navbar">
        <div className="nav-left">
          <div className="product-name">
            <img src={navLogo} alt="Maati AI logo" className="logo" />
            <h3 id="smart_name">Maati AI</h3>
          </div>
        </div>

        <div className="nav-right">
          <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>
            {t.home}
          </Link>
          <Link to="/dashboard" className={location.pathname === "/dashboard" ? "nav-link active" : "nav-link"}>
            {t.dashboard}
          </Link>
          <Link to="/blog" className={location.pathname === "/blog" ? "nav-link active" : "nav-link"}>
            {t.blog}
          </Link>

          <button
            type="button"
            className="language-dropdown"
            onClick={toggleLangMenu}
            ref={langRef}
          >
            🌐 {languageLabels[currentLanguage]} ▾
            {showLangMenu && (
              <div className="dropdown-menu">
                {Object.entries(languageLabels).map(([code, name]) => (
                  <div
                    key={code}
                    className="dropdown-item"
                    onClick={() => handleLanguageChange(code)}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </button>

          <Link to="/history" className={location.pathname === "/history" ? "nav-link active" : "nav-link"}>
            {t.history}
          </Link>

          {!isAuthenticated ? (
            <Link to="/login" className="nav-link login-btn">
              {t.login}
            </Link>
          ) : (
            <div className="profile-section">
              <div className="profile-circle" onClick={toggleProfileMenu}>👤</div>
              {showProfileMenu && (
                <div className="profile-menu">
                  <Link to="/profile" className="profile-menu-item">{t.accountInfo}</Link>
                  <Link to="/help" className="profile-menu-item">{t.help}</Link>
                  <div className="profile-menu-item-logout" onClick={onLogout}>
                    {t.logout}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>MAATI AI</h3>
            <p>{t.footerDescription}</p>
          </div>
          <div className="footer-section">
            <Link to="/about" className="footer-link">{t.aboutUs}</Link>
          </div>
          <div className="footer-section">
            <h4>{t.contactUs}</h4>
            <p>📧 info.maatiai@gmail.com</p>
            <p>📞 +91 xxxxxxxx</p>
            <p>📍 Bhubaneswar, India</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 MAATI AI. {t.allRightsReserved}</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
