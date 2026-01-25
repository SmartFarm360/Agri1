import { useState, useEffect, useRef } from "react";
import "./Language.css";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
  { code: "kn", name: "ಕನ್ನಡ" },
  { code: "ml", name: "മലയാളം" },
  { code: "gu", name: "ગુજરાતી" },
  { code: "mr", name: "मराठी" },
  { code: "bn", name: "বাংলা" },
  { code: "pa", name: "ਪੰਜਾਬੀ" },
];

const Language = ({ currentLanguage, setCurrentLanguage }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const langRef = useRef(null);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  // Change language
  const handleChange = (code) => {
    setCurrentLanguage(code);
    localStorage.setItem("selectedLanguage", code);
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get the full name of the current language
  const selectedLanguageName =
    languages.find((lang) => lang.code === currentLanguage)?.name ||
    currentLanguage.toUpperCase();

  return (
    <div className="language-dropdown" ref={langRef}>
      <button onClick={toggleDropdown} className="lang-toggle-btn">
        🌐 {selectedLanguageName} ▾
      </button>

      {showDropdown && (
        <div className="dropdown-menu">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className="dropdown-item"
              onClick={() => handleChange(lang.code)}
            >
              {lang.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Language;
