// MainLayout.jsx
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import navLogo from "../assets/Maati AI.jpg";
import "../styles/MainLayout.css";

const baseText = {
  home: "Home",
  aboutUs: "About Us",
  dashboard: "Dashboard",
  profile: "Profile",
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
    profile: "\u092a\u094d\u0930\u094b\u092b\u093e\u0907\u0932",
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
  onTraceabilityClick,
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

  const translateUI = (targetLang) => {
    const fallbackForLang = fallbackTranslations[targetLang] || baseText;
    setTranslatedText(fallbackForLang);
  };

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    localStorage.setItem("selectedLanguage", langCode);
    setShowLangMenu(false);
    translateUI(langCode);
  };

  useEffect(() => {
    translateUI(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    setShowProfileMenu(false);
  }, [location.pathname]);

  const t = new Proxy(translatedText, {
    get: (target, prop) => target[prop] || baseText[prop] || prop,
  });
  const storedUserRole =
    typeof window !== "undefined"
      ? window.localStorage.getItem("userRole") || ""
      : "";
  const isSupplierUser = isAuthenticated && storedUserRole === "supplier";
  const dashboardPath =
    isAuthenticated && storedUserRole === "drone_controller"
      ? "/drone-dashboard"
      : "/dashboard";
  const isDashboardActive =
    location.pathname === "/dashboard" || location.pathname === "/drone-dashboard";
  const isTraceabilityActive =
    location.pathname === "/traceability" || location.pathname === "/traceconnect";

  return (
    <div className="main-layout">
      <nav className="navbar">
        <div className="nav-left">
          <div className="product-name">
            <img src={navLogo} alt="Maati AI logo" className="navbar-logo" />
            <Link to="/" className="brand-link">
              <h3 id="smart_name">Maati AI</h3>
            </Link>
          </div>
        </div>

        <div className="nav-right">
          {!isSupplierUser && (
            <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>
              {t.home}
            </Link>
          )}
          <Link to={dashboardPath} className={isDashboardActive ? "nav-link active" : "nav-link"}>
            {t.dashboard}
          </Link>
          {!isSupplierUser && (
            <>
              <Link to="/blog" className={location.pathname === "/blog" ? "nav-link active" : "nav-link"}>
                {t.blog}
              </Link>
              <Link
                to="/traceconnect"
                className={isTraceabilityActive ? "nav-link active" : "nav-link"}
                onClick={(event) => {
                  if (!onTraceabilityClick) return;
                  event.preventDefault();
                  onTraceabilityClick();
                }}
              >
                {t.traceability}
              </Link>
            </>
          )}

          <div className="language-dropdown" ref={langRef}>
            <button
              type="button"
              className="language-toggle-btn"
              onClick={toggleLangMenu}
              aria-label="Change language"
              title="Change language"
            >
              <span className="language-icon" aria-hidden="true">{"\uD83C\uDF10"}</span>
              <span className="language-caret" aria-hidden="true">{"\u25BE"}</span>
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

          {!isSupplierUser && (
            <Link to="/history" className={location.pathname === "/history" ? "nav-link active" : "nav-link"}>
              {t.history}
            </Link>
          )}

          {!isAuthenticated ? (
            <Link to="/login" className="nav-link login-btn">
              {t.login}
            </Link>
          ) : (
            <div className="profile-section">
              <div className="profile-circle" onClick={toggleProfileMenu}>{"\uD83D\uDC64"}</div>
              {showProfileMenu && (
                <div className="profile-menu">
                  <Link to="/profile" className="profile-menu-item">
                    {isSupplierUser ? t.profile : t.accountInfo}
                  </Link>
                  {!isSupplierUser && (
                    <Link to="/help" className="profile-menu-item">{t.help}</Link>
                  )}
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
          <div className="footer-section footer-links-section">
            <Link to="/about" className="footer-link">{t.aboutUs}</Link>
            <Link to="/help" className="footer-link">{t.helpSupport}</Link>
          </div>
          <div className="footer-section">
            <h4>{t.contactUs}</h4>
            <p>info.maatiai@gmail.com</p>
            <p>+91 xxxxxxxx</p>
            <p>Bhubaneswar, India</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{"\u00A9"} 2025 MAATI AI. {t.allRightsReserved}</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;


