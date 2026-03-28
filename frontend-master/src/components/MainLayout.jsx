// MainLayout.jsx
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  traceability: "Traceability",
  accountInfo: "Account Information",
  help: "Help",
  helpSupport: "Help & Support",
  sendFeedback: "Send Feedback",
  footerDescription:
    "Empowering farmers with smart technology for sustainable agriculture.",
  contactUs: "Contact Us",
  allRightsReserved: "All rights reserved.",
  heroSubtitle: "Grow smarter, not harder.",
};

const fallbackTranslations = {
  en: baseText,
  hi: {
    home: "\u0939\u094b\u092e",
    aboutUs: "\u0939\u092e\u093e\u0930\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902",
    dashboard: "\u0921\u0948\u0936\u092c\u094b\u0930\u094d\u0921",
    language: "\u092d\u093e\u0937\u093e",
    history: "\u0907\u0936\u094d\u092f\u0942 \u0932\u0949\u0917",
    login: "\u0932\u0949\u0917\u093f\u0928",
    logout: "\u0932\u0949\u0917\u0906\u0909\u091f",
    blog: "\u092c\u094d\u0932\u0949\u0917",
    traceability: "\u091f\u094d\u0930\u0947\u0938\u0947\u092c\u093f\u0932\u093f\u091f\u0940",
    accountInfo: "\u0916\u093e\u0924\u093e \u091c\u093e\u0928\u0915\u093e\u0930\u0940",
    help: "\u0938\u0939\u093e\u092f\u0924\u093e",
    helpSupport: "\u0938\u0939\u093e\u092f\u0924\u093e \u0914\u0930 \u0938\u092e\u0930\u094d\u0925\u0928",
    sendFeedback: "\u092b\u0940\u0921\u092c\u0948\u0915 \u092d\u0947\u091c\u0947\u0902",
    footerDescription:
      "\u0938\u0924\u0924 \u0915\u0943\u0937\u093f \u0915\u0947 \u0932\u093f\u090f \u0915\u093f\u0938\u093e\u0928\u094b\u0902 \u0915\u094b \u0938\u094d\u092e\u093e\u0930\u094d\u091f \u0924\u0915\u0928\u0940\u0915 \u0938\u0947 \u0938\u0936\u0915\u094d\u0924 \u092c\u0928\u093e\u0928\u093e\u0964",
    contactUs: "\u0938\u0902\u092a\u0930\u094d\u0915 \u0915\u0930\u0947\u0902",
    allRightsReserved: "\u0938\u0930\u094d\u0935\u093e\u0927\u093f\u0915\u093e\u0930 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924\u0964",
    heroSubtitle: "\u0938\u094d\u092e\u093e\u0930\u094d\u091f \u0924\u0930\u0940\u0915\u0947 \u0938\u0947 \u0916\u0947\u0924\u0940 \u0915\u0930\u0947\u0902\u0964",
  },
};

const languageLabels = {
  en: "English",
  hi: "\u0939\u093f\u0902\u0926\u0940",
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
  const navigate = useNavigate();
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
    const fallbackForLang = fallbackTranslations[targetLang] || baseText;

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
        translated[key] = res.data.translatedTexts[idx] || fallbackForLang[key];
      });

      setTranslatedText(translated);
    } catch (err) {
      console.error("Translation failed:", err.message);
      setTranslatedText(fallbackForLang);
    }
  };

  const handleLanguageChange = async (langCode) => {
    setCurrentLanguage(langCode);
    localStorage.setItem("selectedLanguage", langCode);
    setShowLangMenu(false);
    await translateUI(langCode);
  };

  useEffect(() => {
    translateUI(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    setShowProfileMenu(false);
  }, [location.pathname]);

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const t = new Proxy(translatedText, {
    get: (target, prop) => target[prop] || baseText[prop] || prop,
  });

  return (
    <div className="main-layout">
      <nav className="navbar">
        <div className="nav-left">
          <div className="product-name">
            <img src={navLogo} alt="Maati AI logo" className="navbar-logo" />
            <Link to="/" className="brand-name-link">
              <h3 id="smart_name">Maati AI</h3>
            </Link>
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
          <Link
            to="/traceability"
            className={location.pathname === "/traceability" ? "nav-link active" : "nav-link"}
          >
            {t.traceability}
          </Link>

          <div className="language-dropdown" ref={langRef}>
            <button
              type="button"
              className="language-toggle-btn"
              onClick={toggleLangMenu}
              aria-label="Change language"
              title="Change language"
            >
              <span className="language-icon" aria-hidden="true">ðŸŒ</span>
              <span className="language-caret" aria-hidden="true">â–¾</span>
            </button>
            {showLangMenu && (
              <div className="dropdown-menu">
                {Object.entries(languageLabels).map(([code, name]) => (
                  <button
                    key={code}
                    type="button"
                    className={`dropdown-item${currentLanguage === code ? " active" : ""}`}
                    onClick={() => handleLanguageChange(code)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/history" className={location.pathname === "/history" ? "nav-link active" : "nav-link"}>
            {t.history}
          </Link>

          {!isAuthenticated ? (
            <Link to="/login" className="nav-link login-btn">
              {t.login}
            </Link>
          ) : (
            <div className="profile-section">
              <div className="profile-circle" onClick={toggleProfileMenu}>ðŸ‘¤</div>
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

      <main className="main-content">
        {location.pathname !== "/" && (
          <button
            type="button"
            className="back-arrow-btn"
            onClick={handleBackClick}
            aria-label="Go back"
            title="Go back"
          >
            {"\u2190"}
          </button>
        )}
        {children}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>MAATI AI</h3>
            <p>{t.footerDescription}</p>
          </div>
          <div className="footer-section footer-links-section">
            <Link to="/about" className="footer-link">{t.aboutUs}</Link>
            <Link to="/help" className="footer-link">{t.helpSupport}</Link>
          </div>
          <div className="footer-section">
            <h4>{t.contactUs}</h4>
            <p>ðŸ“§ info.maatiai@gmail.com</p>
            <p>ðŸ“ž +91 xxxxxxxx</p>
            <p>ðŸ“ Bhubaneswar, India</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Â© 2025 MAATI AI. {t.allRightsReserved}</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;


