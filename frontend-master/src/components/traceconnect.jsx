import { useState, useEffect, useContext, createContext, useRef } from "react";
import {
  FiLock, FiCheckCircle, FiUser, FiChevronDown, FiLogOut,
  FiHome, FiList, FiBarChart2, FiPackage, FiAlertTriangle,
  FiTrash2, FiEdit2, FiPlus, FiArrowRight, FiMapPin,
  FiCalendar, FiDroplet, FiVideo, FiCamera, FiCheck,
  FiX, FiMail, FiShield, FiStar, FiTrendingUp, FiGrid
} from "react-icons/fi";
import "./traceconnect.css";

const AuthContext = createContext(null);
const DataContext = createContext(null);
const TODAY = new Date().toISOString().split("T")[0];

const DUMMY_ACCOUNTS = [
  { id: "u1", name: "John Farmer", email: "john@farm.com", password: "password123", role: "grower" },
  { id: "u2", name: "Supply Corp", email: "supplier@batch.com", password: "password123", role: "supplier" },
];

const INITIAL_DATA = {
  plantations: [
    { id: "p1", userId: "u1", name: "Green Valley Farm", location: "Pune, Maharashtra", type: "crop", status: "Active", createdAt: "2026-01-10" },
    { id: "p2", userId: "u1", name: "Coastal Shrimp Farm", location: "Vizag, Andhra Pradesh", type: "shrimp", status: "Active", createdAt: "2026-01-12" },
  ],
  crops: [
    { id: "c1", plantationId: "p1", name: "Tomato", variety: "Hybrid-5", sowingDate: "2026-01-15", expectedHarvest: "2026-04-15" },
    { id: "c2", plantationId: "p1", name: "Spinach", variety: "Baby Leaf", sowingDate: "2026-02-01", expectedHarvest: "2026-03-20" },
  ],
  monitoring: [
    { id: "m1", plantationId: "p1", date: "2026-02-05", inputType: "Fertilizer", cropId: "c1", remarks: "Applied NPK 12-12-17" },
    { id: "m2", plantationId: "p1", date: "2026-02-20", inputType: "Irrigation", cropId: "c2", remarks: "Drip irrigation 30min" },
  ],
  verification: [
    { id: "v1", plantationId: "p1", inspectionDate: "2026-03-01", cropId: "c1", health: "Excellent", approved: true },
  ],
  harvests: [
    { id: "h1", plantationId: "p1", harvestDate: "2026-04-01", cropId: "c1", total: 500, unit: "kg", rejected: 20, accepted: 480 },
  ],
  packings: [
    {
      id: "pk1",
      plantationId: "p1",
      harvestId: "h1",
      packingDate: "2026-04-02",
      packingSize: "50kg bag",
      numPackages: 10,
      netWeight: 480,
      warehouse: "Green Warehouse",
      street: "MG Road",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      country: "India",
    },
  ],
  batches: [
    {
      id: "PATCH-ABC123",
      supplierId: "u2",
      packingIds: ["pk1"],
      description: "Premium Tomato Batch",
      totalWeight: 480,
      createdAt: "2026-04-03",
    },
  ],
  processImages: [],
};

function DataProvider({ children }) {
  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(`tc_${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };
  const save = (key, value) => localStorage.setItem(`tc_${key}`, JSON.stringify(value));
  const id = (prefix) => `${prefix}${Math.random().toString(36).slice(2, 10)}`;

  const [plantations, setPlantations] = useState(() => load("plantations", INITIAL_DATA.plantations));
  const [crops, setCrops] = useState(() => load("crops", INITIAL_DATA.crops));
  const [monitoring, setMonitoring] = useState(() => load("monitoring", INITIAL_DATA.monitoring));
  const [verification, setVerification] = useState(() => load("verification", INITIAL_DATA.verification));
  const [harvests, setHarvests] = useState(() => load("harvests", INITIAL_DATA.harvests));
  const [packings, setPackings] = useState(() => load("packings", INITIAL_DATA.packings));
  const [batches, setBatches] = useState(() => load("batches", INITIAL_DATA.batches));
  const [processImages, setProcessImages] = useState(() => load("processImages", INITIAL_DATA.processImages));

  const addPlantation = (p) => { const n = [...plantations, { ...p, id: id("p"), createdAt: TODAY }]; setPlantations(n); save("plantations", n); };
  const delPlantation = (pid) => { const n = plantations.filter((p) => p.id !== pid); setPlantations(n); save("plantations", n); };
  const addCrop = (c) => { const n = [...crops, { ...c, id: id("c") }]; setCrops(n); save("crops", n); };
  const delCrop = (cid) => { const n = crops.filter((c) => c.id !== cid); setCrops(n); save("crops", n); };
  const addMonitoring = (m) => { const n = [...monitoring, { ...m, id: id("m") }]; setMonitoring(n); save("monitoring", n); };
  const delMonitoring = (mid) => { const n = monitoring.filter((m) => m.id !== mid); setMonitoring(n); save("monitoring", n); };
  const addVerification = (v) => { const n = [...verification, { ...v, id: id("v") }]; setVerification(n); save("verification", n); };
  const delVerification = (vid) => { const n = verification.filter((v) => v.id !== vid); setVerification(n); save("verification", n); };
  const addHarvest = (h) => { const n = [...harvests, { ...h, id: id("h") }]; setHarvests(n); save("harvests", n); };
  const delHarvest = (hid) => { const n = harvests.filter((h) => h.id !== hid); setHarvests(n); save("harvests", n); };
  const addPacking = (pk) => { const n = [...packings, { ...pk, id: id("pk") }]; setPackings(n); save("packings", n); };
  const delPacking = (pkid) => { const n = packings.filter((pk) => pk.id !== pkid); setPackings(n); save("packings", n); };
  const addBatch = (b) => { const n = [...batches, b]; setBatches(n); save("batches", n); };
  const delBatch = (bid) => { const n = batches.filter((b) => b.id !== bid); setBatches(n); save("batches", n); };
  const addProcessImage = (img) => { const n = [...processImages, { ...img, id: id("img") }]; setProcessImages(n); save("processImages", n); };
  const delProcessImage = (iid) => { const n = processImages.filter((i) => i.id !== iid); setProcessImages(n); save("processImages", n); };

  return (
    <DataContext.Provider
      value={{
        plantations,
        crops,
        monitoring,
        verification,
        harvests,
        packings,
        batches,
        processImages,
        addPlantation,
        delPlantation,
        addCrop,
        delCrop,
        addMonitoring,
        delMonitoring,
        addVerification,
        delVerification,
        addHarvest,
        delHarvest,
        addPacking,
        delPacking,
        addBatch,
        delBatch,
        addProcessImage,
        delProcessImage,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const raw = localStorage.getItem("tc_user"); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const signIn = (email, password) => new Promise((resolve, reject) => {
    setLoading(true);
    const found = DUMMY_ACCOUNTS.find((a) => a.email === email && a.password === password);
    if (!found) { setLoading(false); reject("Invalid email or password"); return; }
    const u = { id: found.id, name: found.name, email: found.email, role: found.role };
    setUser(u);
    localStorage.setItem("tc_user", JSON.stringify(u));
    setLoading(false);
    resolve(u);
  });
  const signUp = (name, email, password, role) => new Promise((resolve, reject) => {
    setLoading(true);
    if (DUMMY_ACCOUNTS.some((a) => a.email === email)) { setLoading(false); reject("Email already exists"); return; }
    const newUser = { id: `u${Date.now()}`, name, email, password, role };
    DUMMY_ACCOUNTS.push(newUser);
    const u = { id: newUser.id, name, email, role };
    setUser(u);
    localStorage.setItem("tc_user", JSON.stringify(u));
    setLoading(false);
    resolve(u);
  });
  const signOut = () => { setUser(null); localStorage.removeItem("tc_user"); };
  const signInWithGoogle = () => { const u = { id: "u_google", name: "Google User", email: "google@user.com", role: "grower" }; setUser(u); localStorage.setItem("tc_user", JSON.stringify(u)); };

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}>{children}</AuthContext.Provider>;
}

const useAuth = () => useContext(AuthContext);
const useData = () => useContext(DataContext);

function useRouter() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");
  useEffect(() => {
    const fn = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  const navigate = (path) => { window.location.hash = path; };
  return { route, navigate };
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (message, type = "success") => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  return { toasts, toast };
}

function Toasts({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span className="toast-icon">{t.type === "success" ? <FiCheck /> : <FiAlertTriangle />}</span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

const CROP_OPTIONS = [
  "Wheat",
  "Rice",
  "Lettuce",
  "Corn",
  "Tomato",
  "Brinjal",
  "Spinach",
  "Green Gram",
  "Cabbage",
  "Cauliflower",
  "Carrot",
  "Beetroot",
  "Okra",
  "French Beans",
  "Coriander",
  "Fenugreek",
  "Capsicum",
  "Other",
];
const SHRIMP_OPTIONS = ["Vannamei Shrimp", "Tiger Prawn", "Scampi", "Giant Freshwater Prawn", "Other"];
const MONITORING_TYPES = ["Fertilizer", "Pesticide", "Irrigation", "Organic Compost", "Biofertilizer", "Soil Treatment", "Other"];
const SHRIMP_MONITORING = ["Water Quality", "Feed", "Disease Check", "Aeration", "Salinity Check", "Oxygen Level", "Other"];
const HEALTH_OPTIONS = ["Excellent", "Good", "Moderate", "Poor"];
const UNIT_OPTIONS = ["kg", "ton", "count"];

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="confirm-box">
        <div className="confirm-icon"><FiAlertTriangle /></div>
        <h3>Confirm Delete</h3>
        <p className="muted">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = (message) => new Promise((resolve) => setState({ message, resolve }));
  const dialog = state ? (
    <ConfirmDialog
      message={state.message}
      onConfirm={() => { state.resolve(true); setState(null); }}
      onCancel={() => { state.resolve(false); setState(null); }}
    />
  ) : null;
  return { confirm, dialog };
}

function AuthModal({ onClose, toast }) {
  const { signIn, signUp, signInWithGoogle, loading } = useAuth();
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "John Farmer", email: "john@farm.com", password: "password123", role: "grower" });
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async () => {
    setError("");
    try {
      if (mode === "signin") await signIn(form.email, form.password);
      else await signUp(form.name, form.email, form.password, form.role);
      toast(mode === "signin" ? "Welcome back!" : "Account created!", "success");
      onClose();
    } catch (e) {
      setError(e);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box auth-modal">
        {/* Close btn on left panel */}
        <button className="auth-close-btn" onClick={onClose} aria-label="Close">✕</button>

        {/* LEFT PANEL */}
        <div className="auth-left-panel">
          <div className="auth-illustration">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Ground */}
              <ellipse cx="80" cy="130" rx="55" ry="10" fill="rgba(255,255,255,0.08)" />
              {/* Clock/compass circle */}
              <circle cx="48" cy="112" r="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
              <circle cx="48" cy="112" r="16" fill="rgba(255,255,255,0.08)" />
              <line x1="48" y1="112" x2="48" y2="100" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
              <line x1="48" y1="112" x2="58" y2="116" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
              {/* Big tree */}
              <ellipse cx="100" cy="72" rx="28" ry="34" fill="#1f8a43" />
              <ellipse cx="100" cy="60" rx="20" ry="26" fill="#2ecc71" />
              <rect x="96" y="98" width="8" height="30" fill="#5d4037" rx="3" />
              {/* Small pink circle accent */}
              <circle cx="82" cy="45" r="10" fill="#f87171" opacity="0.7" />
              {/* Farmer figure */}
              <circle cx="80" cy="88" r="7" fill="#fcd34d" />
              <rect x="75" y="96" width="10" height="18" rx="4" fill="#1e3a5f" />
              <line x1="75" y1="100" x2="68" y2="110" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
              <line x1="85" y1="100" x2="87" y2="112" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
              <line x1="77" y1="114" x2="75" y2="128" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
              <line x1="83" y1="114" x2="85" y2="128" stroke="#1e3a5f" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="auth-left-tagline">
            Trace every seed<br />to the final batch
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right-panel">
          <h2>{mode === "signin" ? "Log In" : "Create Account"}</h2>

          {/* Tabs */}
          <div className="auth-modal-tabs">
            <button className={`auth-modal-tab ${mode === "signin" ? "active" : ""}`} onClick={() => setMode("signin")}>Sign In</button>
            <button className={`auth-modal-tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>Sign Up</button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {mode === "signup" && (
            <div className="auth-input-wrap">
              <label className="auth-field-label">Full Name</label>
              <input className="input" placeholder="John Farmer" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
          )}

          <div className="auth-input-wrap">
            <label className="auth-field-label">Email</label>
            <input className="input" type="email" placeholder="you@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>

          <div className="auth-input-wrap" style={{ position: "relative" }}>
            <label className="auth-field-label">Password</label>
            {mode === "signin" && (
              <button className="auth-forgot" tabIndex={-1} type="button">Forgot Password?</button>
            )}
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={(e) => set("password", e.target.value)} />
          </div>

          {mode === "signup" && (
            <div className="auth-input-wrap">
              <label className="auth-field-label">Role</label>
              <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
                <option value="grower">Grower</option>
                <option value="supplier">Supplier</option>
              </select>
            </div>
          )}

          {mode === "signin" && (
            <div className="auth-remember-row">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} id="rem" />
              <label htmlFor="rem"><span>Remember me</span></label>
            </div>
          )}

          <button className="auth-submit-btn" onClick={submit} disabled={loading}>
            {loading ? "Please wait…" : (mode === "signin" ? "Login" : "Create Account")}
          </button>

          <div className="auth-or">Or login with</div>

          <div className="auth-social-row">
            <button className="auth-social-btn google" onClick={signInWithGoogle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button className="auth-social-btn facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
            <button className="auth-social-btn github">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              Github
            </button>
          </div>

          <div className="auth-switch-text">
            {mode === "signin"
              ? <>New user? <button onClick={() => setMode("signup")}>Sign up</button></>
              : <>Already have an account? <button onClick={() => setMode("signin")}>Sign in</button></>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage({ navigate, toast }) {
  const [showAuth, setShowAuth] = useState(true);
  const { user } = useAuth();
  useEffect(() => { if (user) navigate(user.role === "grower" ? "/grower" : "/supplier"); }, [user]);
  return (
    <div className="auth-entry-page">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} toast={toast} />}
    </div>
  );
}

function Header({ route, navigate }) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!user) return null;
  const links = user.role === "grower"
    ? [{ label: "Dashboard", path: "/grower", icon: <FiHome /> }, { label: "Plantations", path: "/plantations", icon: <FiList /> }, { label: "Reports", path: "/reports", icon: <FiBarChart2 /> }]
    : [{ label: "Dashboard", path: "/supplier", icon: <FiHome /> }, { label: "Reports", path: "/reports", icon: <FiBarChart2 /> }];
  return (
    <header className="app-header">
      <button className="brand" onClick={() => navigate(user.role === "grower" ? "/grower" : "/supplier")}>
        <span className="brand-icon">🌱</span>
        <span>Seed-to-Batch</span>
      </button>
      <nav className="header-nav">
        {links.map((l) => (
          <button key={l.path} className={`nav-pill ${route === l.path ? "active" : ""}`} onClick={() => navigate(l.path)}>
            {l.icon} {l.label}
          </button>
        ))}
        <div className="profile-menu-wrap" ref={menuRef}>
          <button className={`profile-trigger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen((x) => !x)}>
            <span className="profile-avatar"><FiUser /></span>
            <span className="profile-short">{(user?.name || "User").split(" ")[0]}</span>
            <FiChevronDown className="chevron" />
          </button>
          {menuOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user-info">
                <span className="dropdown-name">{user.name}</span>
                <span className="dropdown-role badge-chip">{user.role}</span>
              </div>
              <div className="dropdown-divider" />
              <button className="profile-item" onClick={() => { setMenuOpen(false); navigate("/profile"); }}>
                <FiUser /> Profile
              </button>
              <button className="profile-item danger" onClick={() => { setMenuOpen(false); signOut(); navigate("/"); }}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrap ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function GrowerDashboard({ navigate, toast }) {
  const { user } = useAuth();
  const { plantations, crops, harvests, packings, addPlantation, delPlantation } = useData();
  const { confirm, dialog } = useConfirm();
  const [form, setForm] = useState({ type: "crop", name: "", location: "" });
  const mine = plantations.filter((p) => p.userId === user?.id);
  const mineIds = mine.map((p) => p.id);
  const totalHarvested = harvests.filter((h) => mineIds.includes(h.plantationId)).reduce((s, h) => s + (h.accepted || 0), 0);

  const create = () => {
    if (!form.name || !form.location) { toast("Please fill in plantation name and location", "error"); return; }
    addPlantation({ ...form, userId: user.id, status: "Active" });
    setForm({ type: "crop", name: "", location: "" });
    toast("Plantation created successfully!", "success");
  };

  const remove = async (id) => {
    const ok = await confirm("Delete this plantation and all its associated data?");
    if (!ok) return;
    delPlantation(id);
    toast("Plantation deleted", "success");
  };

  return (
    <div className="page-container">
      {dialog}
      <div className="page-header">
        <div>
          <h1>Grower Dashboard</h1>
          <p className="page-subtitle">Welcome back, <strong>{user?.name}</strong> — manage your plantations below</p>
        </div>
      </div>

      <div className="stats-row">
        <StatCard icon={<FiGrid />} label="Plantations" value={mine.length} color="green" />
        <StatCard icon={<FiStar />} label="Crops" value={crops.filter((c) => mineIds.includes(c.plantationId)).length} color="amber" />
        <StatCard icon={<FiTrendingUp />} label="Harvested (kg)" value={totalHarvested} color="blue" />
        <StatCard icon={<FiPackage />} label="Packings" value={packings.filter((p) => mineIds.includes(p.plantationId)).length} color="purple" />
      </div>

      <div className="card">
        <div className="card-title"><FiPlus /> Add New Plantation</div>
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Production Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="crop">🌾 Crop Farming</option>
              <option value="shrimp">🦐 Shrimp / Prawn Aquaculture</option>
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Plantation Name</label>
            <input className="input" placeholder={form.type === "shrimp" ? "e.g. Coastal Prawn Farm" : "e.g. Green Valley Farm"} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Location</label>
            <input className="input" placeholder="e.g. Pune, Maharashtra" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={create}><FiPlus /> Create</button>
          </div>
        </div>
      </div>

      {mine.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌾</div>
          <p>No plantations yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="card-grid">
          {mine.map((p) => (
            <div key={p.id} className="plantation-card">
              <div className="plantation-card-top">
                <span className={`type-badge ${p.type === "shrimp" ? "shrimp" : "crop"}`}>
                  {p.type === "shrimp" ? "🦐 Aquaculture" : "🌾 Crop Farming"}
                </span>
                <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); remove(p.id); }} title="Delete"><FiTrash2 /></button>
              </div>
              <h4>{p.name}</h4>
              <p className="plantation-location"><FiMapPin /> {p.location}</p>
              <p className="plantation-date"><FiCalendar /> Created {p.createdAt}</p>
              <button className="btn btn-outline full-width mt" onClick={() => navigate(`/plantation/${p.id}`)}>
                Open Plantation <FiArrowRight />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlantationsPage({ navigate, toast }) {
  const { user } = useAuth();
  const { plantations, delPlantation } = useData();
  const { confirm, dialog } = useConfirm();
  const mine = plantations.filter((p) => p.userId === user?.id);

  const remove = async (id) => {
    const ok = await confirm("Delete this plantation?");
    if (!ok) return;
    delPlantation(id);
    toast("Deleted", "success");
  };

  return (
    <div className="page-container">
      {dialog}
      <div className="page-header">
        <div><h1>All Plantations</h1><p className="page-subtitle">Manage all your registered plantations</p></div>
        <button className="btn btn-primary" onClick={() => navigate("/grower")}><FiPlus /> New Plantation</button>
      </div>
      {mine.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🌾</div><p>No plantations yet.</p></div>
      ) : (
        <div className="card-grid">
          {mine.map((p) => (
            <div key={p.id} className="plantation-card">
              <div className="plantation-card-top">
                <span className={`type-badge ${p.type === "shrimp" ? "shrimp" : "crop"}`}>{p.type === "shrimp" ? "🦐 Aquaculture" : "🌾 Crop Farming"}</span>
                <button className="icon-btn danger" onClick={() => remove(p.id)} title="Delete"><FiTrash2 /></button>
              </div>
              <h4>{p.name}</h4>
              <p className="plantation-location"><FiMapPin /> {p.location}</p>
              <p className="plantation-date"><FiCalendar /> {p.createdAt}</p>
              <button className="btn btn-outline full-width mt" onClick={() => navigate(`/plantation/${p.id}`)}>Open <FiArrowRight /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkflowSection({ title, children }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {children}
    </div>
  );
}

function PlantationDetail({ plantationId, toast }) {
  const { plantations, crops, monitoring, verification, harvests, packings, processImages, addCrop, delCrop, addMonitoring, delMonitoring, addVerification, delVerification, addHarvest, delHarvest, addPacking, delPacking, addProcessImage, delProcessImage } = useData();
  const { confirm, dialog } = useConfirm();
  const [step, setStep] = useState(0);
  const plantation = plantations.find((p) => p.id === plantationId);
  const pCrops = crops.filter((c) => c.plantationId === plantationId);
  const pMon = monitoring.filter((m) => m.plantationId === plantationId);
  const pVer = verification.filter((v) => v.plantationId === plantationId);
  const pHar = harvests.filter((h) => h.plantationId === plantationId);
  const pPack = packings.filter((pk) => pk.plantationId === plantationId);
  const pImgs = processImages.filter((img) => img.plantationId === plantationId);
  if (!plantation) return <div className="page-container"><div className="empty-state">Plantation not found.</div></div>;
  const isShrimp = plantation.type === "shrimp";
  const L = { crop: isShrimp ? "Pond" : "Crop", crops: isShrimp ? "Ponds" : "Crops", variety: isShrimp ? "Hatchery / Seed Batch" : "Variety", options: isShrimp ? SHRIMP_OPTIONS : CROP_OPTIONS, monitoring: isShrimp ? SHRIMP_MONITORING : MONITORING_TYPES };
  const unlocked = [true, pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0];
  const done = [pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0, pPack.length > 0];
  const names = [L.crops, "Monitoring", "Verification", "Harvest", "Packing"];
  const openStep = (i) => { if (!unlocked[i]) { toast(`Complete ${names[i - 1]} first`, "error"); return; } setStep(i); };

  return (
    <div className="page-container">
      {dialog}
      <div className="page-header">
        <div>
          <h1>{plantation.name}</h1>
          <p className="page-subtitle"><FiMapPin /> {plantation.location} &nbsp;·&nbsp; <span className="status-chip active">● {plantation.status}</span></p>
        </div>
      </div>

      <div className="step-bar">
        {names.map((n, i) => (
          <button key={n} className={`step-btn ${step === i ? "active" : ""} ${done[i] ? "done" : ""} ${!unlocked[i] ? "locked" : ""}`} onClick={() => openStep(i)}>
            <span className="step-indicator">
              {done[i] ? <FiCheckCircle /> : !unlocked[i] ? <FiLock /> : <span className="step-num">{i + 1}</span>}
            </span>
            <span>{n}</span>
          </button>
        ))}
      </div>

      {step === 0 && (
        <CropsStep
          L={L}
          pCrops={pCrops}
          addCrop={addCrop}
          delCrop={delCrop}
          confirm={confirm}
          plantationId={plantationId}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
        />
      )}
      {step === 1 && (
        <MonitoringStep
          L={L}
          pMon={pMon}
          pCrops={pCrops}
          addMonitoring={addMonitoring}
          delMonitoring={delMonitoring}
          confirm={confirm}
          plantationId={plantationId}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
        />
      )}
      {step === 2 && (
        <VerificationStep
          pVer={pVer}
          pCrops={pCrops}
          addVerification={addVerification}
          delVerification={delVerification}
          confirm={confirm}
          plantationId={plantationId}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
          L={L}
        />
      )}
      {step === 3 && (
        <HarvestStep
          pHar={pHar}
          pCrops={pCrops}
          addHarvest={addHarvest}
          delHarvest={delHarvest}
          confirm={confirm}
          plantationId={plantationId}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
          L={L}
        />
      )}
      {step === 4 && (
        <PackingStep
          pPack={pPack}
          pHar={pHar}
          addPacking={addPacking}
          delPacking={delPacking}
          confirm={confirm}
          plantationId={plantationId}
          pImgs={pImgs}
          addProcessImage={addProcessImage}
          delProcessImage={delProcessImage}
          toast={toast}
        />
      )}

      {step < 4 && done[step] && (
        <div className="next-btn-wrap">
          <button className="btn btn-primary" onClick={() => openStep(step + 1)}>Next: {names[step + 1]} <FiArrowRight /></button>
        </div>
      )}

      {done[4] && (
        <div className="card video-card">
          <div className="video-card-left">
            <div className="video-icon"><FiVideo /></div>
            <div>
              <div className="card-title" style={{ margin: 0 }}>Generate Traceability Video</div>
              <p className="muted">Create a lifecycle video for this farm to share with customers.</p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={async () => {
            try {
              await fetch("https://maatiaivideogenerator.onrender.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logo: "", intro_logo: "", farmer_img: "", farm_img: "", process_images: pImgs.map((x) => x.imageUrl).filter(Boolean), certificate_img: "", end_img: "" }) });
              toast("Video generation initiated!", "success");
            } catch { toast("Video service unavailable right now.", "error"); }
          }}>Generate</button>
        </div>
      )}
    </div>
  );
}

function ProcessEntries({ stage, plantationId, pImgs, addProcessImage, delProcessImage, confirm, toast }) {
  const [name, setName] = useState("");
  const list = pImgs.filter((x) => x.stage === stage);
  const add = () => {
    if (!name.trim()) { toast("Enter a process name", "error"); return; }
    addProcessImage({ plantationId, stage, name: name.trim(), date: TODAY, imageUrl: "" });
    setName("");
    toast("Entry added", "success");
  };
  const remove = async (id) => { const ok = await confirm("Delete this process entry?"); if (!ok) return; delProcessImage(id); };
  return (
    <div className="card process-card">
      <div className="card-title"><FiCamera /> Process Entries — {stage}</div>
      <div className="form-grid two-col">
        <div className="field-wrap">
          <input className="input" placeholder={`Describe this ${stage.toLowerCase()} process step…`} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="btn btn-outline" onClick={add}><FiCamera /> Capture</button>
      </div>
      {list.length > 0 && (
        <div className="record-list">
          {list.map((it) => (
            <div key={it.id} className="record-row">
              <span className="record-text"><FiCheck /> {it.name} <span className="muted">({it.date})</span></span>
              <button className="icon-btn danger" onClick={() => remove(it.id)}><FiTrash2 /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CropsStep({ L, pCrops, addCrop, delCrop, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({ name: "", customName: "", variety: "", sowingDate: TODAY, expectedHarvest: "" });
  const add = () => {
    const name = f.name === "Other" ? f.customName : f.name;
    if (!name || !f.variety || !f.sowingDate) { toast("Fill all required fields", "error"); return; }
    addCrop({ plantationId, name, variety: f.variety, sowingDate: f.sowingDate, expectedHarvest: f.expectedHarvest });
    setF({ name: "", customName: "", variety: "", sowingDate: TODAY, expectedHarvest: "" });
    toast(`${L.crop} added!`, "success");
  };
  const remove = async (id) => { const ok = await confirm(`Delete this ${L.crop.toLowerCase()}?`); if (!ok) return; delCrop(id); };
  return (
    <>
      <WorkflowSection title={`🌱 Add ${L.crop}`}>
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">{L.crop} Type *</label>
            <select className="input" value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))}>
              <option value="">Select {L.crop}…</option>
              {L.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          {f.name === "Other" && (
            <div className="field-wrap">
              <label className="field-label">Custom Name *</label>
              <input className="input" placeholder="Enter custom crop name" value={f.customName} onChange={(e) => setF((x) => ({ ...x, customName: e.target.value }))} />
            </div>
          )}
          <div className="field-wrap">
            <label className="field-label">{L.variety} *</label>
            <input className="input" placeholder={L.variety === "Variety" ? "e.g. Hybrid-5, Baby Leaf" : "e.g. SIS Hatchery Batch-22"} value={f.variety} onChange={(e) => setF((x) => ({ ...x, variety: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Sowing / Stocking Date *</label>
            <input className="input" type="date" value={f.sowingDate} onChange={(e) => setF((x) => ({ ...x, sowingDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Expected Harvest Date</label>
            <input className="input" type="date" value={f.expectedHarvest} onChange={(e) => setF((x) => ({ ...x, expectedHarvest: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Add {L.crop}</button>
          </div>
        </div>
        {pCrops.length > 0 && (
          <div className="record-list mt">
            {pCrops.map((c) => (
              <div key={c.id} className="record-row">
                <span className="record-text"><FiStar style={{ color: "#f59e0b" }} /> <strong>{c.name}</strong> · {c.variety} · <span className="muted">Sown {c.sowingDate}</span></span>
                <button className="icon-btn danger" onClick={() => remove(c.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Crops" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function MonitoringStep({ L, pMon, addMonitoring, delMonitoring, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({ date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" });
  const add = () => {
    const inputType = f.inputType === "Other" ? f.customType : f.inputType;
    if (!inputType || !f.cropId) { toast("Select input type and crop", "error"); return; }
    addMonitoring({ plantationId, date: f.date, inputType, cropId: f.cropId, remarks: f.remarks });
    setF({ date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" });
    toast("Monitoring record added!", "success");
  };
  const remove = async (id) => { const ok = await confirm("Delete this monitoring record?"); if (!ok) return; delMonitoring(id); };
  return (
    <>
      <WorkflowSection title="📋 Add Monitoring Record">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Date *</label>
            <input className="input" type="date" value={f.date} onChange={(e) => setF((x) => ({ ...x, date: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Input Type *</label>
            <select className="input" value={f.inputType} onChange={(e) => setF((x) => ({ ...x, inputType: e.target.value }))}>
              <option value="">Select input type…</option>
              {L.monitoring.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          {f.inputType === "Other" && (
            <div className="field-wrap">
              <label className="field-label">Custom Type *</label>
              <input className="input" placeholder="Describe the input type" value={f.customType} onChange={(e) => setF((x) => ({ ...x, customType: e.target.value }))} />
            </div>
          )}
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}…</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.variety})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Remarks / Notes</label>
            <input className="input" placeholder="e.g. Applied NPK 12-12-17 at 50kg/acre" value={f.remarks} onChange={(e) => setF((x) => ({ ...x, remarks: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Add Record</button>
          </div>
        </div>
        {pMon.length > 0 && (
          <div className="record-list mt">
            {pMon.map((m) => (
              <div key={m.id} className="record-row">
                <span className="record-text"><FiDroplet style={{ color: "#2563eb" }} /> <strong>{m.inputType}</strong> · <span className="muted">{m.date}</span>{m.remarks && <> · {m.remarks}</>}</span>
                <button className="icon-btn danger" onClick={() => remove(m.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Monitoring" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function VerificationStep({ pVer, addVerification, delVerification, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, L }) {
  const [f, setF] = useState({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
  const add = () => {
    if (!f.cropId) { toast("Select a crop", "error"); return; }
    addVerification({ plantationId, ...f });
    setF({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
    toast("Verification added!", "success");
  };
  const remove = async (id) => { const ok = await confirm("Delete this verification?"); if (!ok) return; delVerification(id); };
  return (
    <>
      <WorkflowSection title="✅ Add Verification">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Inspection Date *</label>
            <input className="input" type="date" value={f.inspectionDate} onChange={(e) => setF((x) => ({ ...x, inspectionDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}…</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.variety})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Crop Health *</label>
            <select className="input" value={f.health} onChange={(e) => setF((x) => ({ ...x, health: e.target.value }))}>
              {HEALTH_OPTIONS.map((h) => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Harvest Approval *</label>
            <select className="input" value={f.approved ? "yes" : "no"} onChange={(e) => setF((x) => ({ ...x, approved: e.target.value === "yes" }))}>
              <option value="yes">✅ Approved for Harvest</option>
              <option value="no">❌ Not Approved</option>
            </select>
          </div>
          <div className="field-wrap field-btn-wrap btn-row">
            <button className="btn btn-outline"><FiCamera /> Capture Certificate</button>
            <button className="btn btn-primary" onClick={add}><FiPlus /> Add</button>
          </div>
        </div>
        {pVer.length > 0 && (
          <div className="record-list mt">
            {pVer.map((v) => (
              <div key={v.id} className="record-row">
                <span className="record-text">
                  <FiCheckCircle style={{ color: v.approved ? "#1f8a43" : "#c0392b" }} />
                  <strong>{v.health}</strong> · {v.approved ? "Approved ✓" : "Not Approved ✗"} · <span className="muted">{v.inspectionDate}</span>
                </span>
                <button className="icon-btn danger" onClick={() => remove(v.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Verification" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function HarvestStep({ pHar, addHarvest, delHarvest, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, L }) {
  const [f, setF] = useState({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
  const accepted = Math.max(0, (Number(f.total) || 0) - (Number(f.rejected) || 0));
  const add = () => {
    if (!f.cropId || !f.total) { toast("Select crop and enter total quantity", "error"); return; }
    addHarvest({ plantationId, ...f, total: Number(f.total), rejected: Number(f.rejected) || 0, accepted });
    setF({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
    toast("Harvest recorded!", "success");
  };
  const remove = async (id) => { const ok = await confirm("Delete this harvest record?"); if (!ok) return; delHarvest(id); };
  return (
    <>
      <WorkflowSection title="🌾 Record Harvest">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Harvest Date *</label>
            <input className="input" type="date" value={f.harvestDate} onChange={(e) => setF((x) => ({ ...x, harvestDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Select {L.crop} *</label>
            <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
              <option value="">Choose {L.crop.toLowerCase()}…</option>
              {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.variety})</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Total Quantity *</label>
            <input className="input" type="number" placeholder="e.g. 500" value={f.total} onChange={(e) => setF((x) => ({ ...x, total: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Unit *</label>
            <select className="input" value={f.unit} onChange={(e) => setF((x) => ({ ...x, unit: e.target.value }))}>
              {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Rejected Quantity</label>
            <input className="input" type="number" placeholder="e.g. 20 (damaged / substandard)" value={f.rejected} onChange={(e) => setF((x) => ({ ...x, rejected: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Accepted (auto-calculated)</label>
            <div className="accepted-box">{accepted} {f.unit} accepted</div>
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Record Harvest</button>
          </div>
        </div>
        {pHar.length > 0 && (
          <div className="record-list mt">
            {pHar.map((h) => (
              <div key={h.id} className="record-row">
                <span className="record-text">
                  <FiTrendingUp style={{ color: "#1f8a43" }} />
                  <strong>{h.harvestDate}</strong> · Accepted: <strong style={{ color: "#1f8a43" }}>{h.accepted} {h.unit}</strong>
                  {h.rejected > 0 && <> · Rejected: <strong style={{ color: "#c0392b" }}>{h.rejected} {h.unit}</strong></>}
                </span>
                <button className="icon-btn danger" onClick={() => remove(h.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Harvest" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function PackingStep({ pPack, pHar, addPacking, delPacking, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({
    packingDate: TODAY,
    harvestId: "",
    packingSize: "",
    numPackages: "",
    netWeight: "",
    warehouse: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const add = () => {
    if (!f.harvestId || !f.packingSize || !f.netWeight) { toast("Fill all required fields", "error"); return; }
    addPacking({ plantationId, ...f, numPackages: Number(f.numPackages) || 0, netWeight: Number(f.netWeight) });
    setF({ packingDate: TODAY, harvestId: "", packingSize: "", numPackages: "", netWeight: "", warehouse: "", street: "", city: "", state: "", pincode: "", country: "India" });
    toast("Packing recorded!", "success");
  };
  const remove = async (id) => { const ok = await confirm("Delete this packing record?"); if (!ok) return; delPacking(id); };
  return (
    <>
      <WorkflowSection title="📦 Record Packing">
        <div className="form-grid">
          <div className="field-wrap">
            <label className="field-label">Packing Date *</label>
            <input className="input" type="date" value={f.packingDate} onChange={(e) => setF((x) => ({ ...x, packingDate: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Link to Harvest *</label>
            <select className="input" value={f.harvestId} onChange={(e) => setF((x) => ({ ...x, harvestId: e.target.value }))}>
              <option value="">Select harvest batch…</option>
              {pHar.map((h) => <option key={h.id} value={h.id}>{h.harvestDate} — {h.accepted} {h.unit} accepted</option>)}
            </select>
          </div>
          <div className="field-wrap">
            <label className="field-label">Package Size *</label>
            <input className="input" placeholder="e.g. 50kg bag, 25kg sack" value={f.packingSize} onChange={(e) => setF((x) => ({ ...x, packingSize: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Number of Packages</label>
            <input className="input" type="number" placeholder="e.g. 10" value={f.numPackages} onChange={(e) => setF((x) => ({ ...x, numPackages: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Net Weight (kg) *</label>
            <input className="input" type="number" placeholder="Total net weight in kg" value={f.netWeight} onChange={(e) => setF((x) => ({ ...x, netWeight: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Warehouse Name</label>
            <input className="input" placeholder="e.g. Green Cold Storage" value={f.warehouse} onChange={(e) => setF((x) => ({ ...x, warehouse: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Street Address</label>
            <input className="input" placeholder="e.g. MG Road, Sector 5" value={f.street} onChange={(e) => setF((x) => ({ ...x, street: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">City</label>
            <input className="input" placeholder="e.g. Pune" value={f.city} onChange={(e) => setF((x) => ({ ...x, city: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">State</label>
            <input className="input" placeholder="e.g. Maharashtra" value={f.state} onChange={(e) => setF((x) => ({ ...x, state: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Pincode</label>
            <input className="input" placeholder="6-digit PIN" value={f.pincode} onChange={(e) => setF((x) => ({ ...x, pincode: e.target.value }))} />
          </div>
          <div className="field-wrap">
            <label className="field-label">Country</label>
            <input className="input" placeholder="Country name" value={f.country} onChange={(e) => setF((x) => ({ ...x, country: e.target.value }))} />
          </div>
          <div className="field-wrap field-btn-wrap">
            <button className="btn btn-primary" onClick={add}><FiPlus /> Record Packing</button>
          </div>
        </div>
        {pPack.length > 0 && (
          <div className="record-list mt">
            {pPack.map((pk) => (
              <div key={pk.id} className="record-row">
                <span className="record-text">
                  <FiPackage style={{ color: "#7c3aed" }} />
                  <strong>{pk.packingDate}</strong> · {pk.numPackages} × {pk.packingSize} · <strong>{pk.netWeight} kg</strong> · <span className="muted">{pk.city}, {pk.state}</span>
                </span>
                <button className="icon-btn danger" onClick={() => remove(pk.id)}><FiTrash2 /></button>
              </div>
            ))}
          </div>
        )}
      </WorkflowSection>
      <ProcessEntries stage="Packing" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function SupplierDashboard({ navigate, toast }) {
  const { user } = useAuth();
  const { packings, batches, addBatch, delBatch } = useData();
  const { confirm, dialog } = useConfirm();
  const [selected, setSelected] = useState([]);
  const [desc, setDesc] = useState("");
  const [batchModal, setBatchModal] = useState(null);
  const mine = batches.filter((b) => b.supplierId === user?.id);
  const used = batches.flatMap((b) => b.packingIds);
  const available = packings.filter((p) => !used.includes(p.id));
  const total = selected.reduce((s, id) => s + (packings.find((p) => p.id === id)?.netWeight || 0), 0);
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const create = () => {
    if (!selected.length) { toast("Select at least one packing unit", "error"); return; }
    const id = `PATCH-${Date.now().toString(36).toUpperCase()}`;
    const batch = { id, supplierId: user.id, packingIds: selected, description: desc, totalWeight: total, createdAt: TODAY };
    addBatch(batch); setBatchModal(batch); setSelected([]); setDesc("");
    toast("Batch created!", "success");
  };

  const removeBatch = async (id) => {
    const ok = await confirm("Delete this batch?");
    if (!ok) return;
    delBatch(id);
    toast("Deleted", "success");
  };

  return (
    <div className="page-container">
      {dialog}
      <div className="page-header">
        <div><h1>Supplier Dashboard</h1><p className="page-subtitle">Select packings and create traceable batches with QR codes</p></div>
      </div>
      <div className="stats-row">
        <StatCard icon={<FiPackage />} label="Available Packings" value={available.length} color="green" />
        <StatCard icon={<FiGrid />} label="Batches Created" value={mine.length} color="blue" />
      </div>
      <div className="card">
        <div className="card-title"><FiPackage /> Select Packings to Bundle</div>
        {available.length === 0 ? (
          <div className="empty-state small"><p>No available packings. Growers need to complete their packing step first.</p></div>
        ) : (
          <div className="packing-list">
            {available.map((pk) => (
              <div key={pk.id} className={`packing-row ${selected.includes(pk.id) ? "selected" : ""}`} onClick={() => toggle(pk.id)}>
                <input type="checkbox" checked={selected.includes(pk.id)} readOnly />
                <div className="packing-info">
                  <span className="packing-main">{pk.numPackages || 0} packages × {pk.packingSize || "—"}</span>
                  <span className="packing-sub">{pk.netWeight} kg · {pk.packingDate} · {pk.city}, {pk.state}</span>
                </div>
                <span className="packing-weight">{pk.netWeight} kg</span>
              </div>
            ))}
          </div>
        )}
        {selected.length > 0 && (
          <div className="batch-create-panel">
            <div className="batch-summary">Selected: <strong>{selected.length} packings</strong> · Total: <strong>{total} kg</strong></div>
            <div className="form-grid two-col">
              <div className="field-wrap">
                <label className="field-label">Batch Description</label>
                <input className="input" placeholder="e.g. Premium Tomato Batch — Export Quality" value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <div className="field-wrap field-btn-wrap">
                <button className="btn btn-primary" onClick={create}><FiPlus /> Create Batch ({selected.length})</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {mine.length > 0 && (
        <div className="card">
          <div className="card-title"><FiGrid /> My Batches</div>
          <div className="card-grid">
            {mine.map((b) => (
              <div key={b.id} className="batch-card" onClick={() => setBatchModal(b)}>
                <div className="batch-card-top">
                  <code className="batch-id">{b.id}</code>
                  <button className="icon-btn danger" onClick={(e) => { e.stopPropagation(); removeBatch(b.id); }}><FiTrash2 /></button>
                </div>
                <div className="batch-weight">{b.totalWeight} kg total</div>
                <p className="muted">{b.description || "No description"} · {b.createdAt}</p>
                <button className="btn btn-outline full-width mt" onClick={(e) => { e.stopPropagation(); navigate(`/patch/${b.id}`); }}>
                  View Trace Page <FiArrowRight />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {batchModal && <BatchModal batch={batchModal} onClose={() => setBatchModal(null)} navigate={navigate} />}
    </div>
  );
}

function BatchModal({ batch, onClose, navigate }) {
  const qrValue = `${window.location.origin}/patch/${batch.id}`;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box batch-modal">
        <button className="modal-close" onClick={onClose}><FiX /></button>
        <div className="batch-modal-header">
          <div className="batch-modal-icon">🎉</div>
          <h3>Batch Created!</h3>
        </div>
        <div className="qr-box"><QRCode value={qrValue} size={180} /></div>
        <div className="batch-modal-info">
          <div className="kv-pair"><span>Batch ID</span><code>{batch.id}</code></div>
          <div className="kv-pair"><span>Total Weight</span><strong>{batch.totalWeight} kg</strong></div>
          <div className="kv-pair"><span>Description</span><strong>{batch.description || "—"}</strong></div>
          <div className="kv-pair"><span>Created</span><strong>{batch.createdAt}</strong></div>
          <div className="kv-pair"><span>Items</span><strong>{batch.packingIds.length} packings</strong></div>
        </div>
        <button className="btn btn-primary full-width" onClick={() => { onClose(); navigate(`/patch/${batch.id}`); }}>
          View Public Trace Page <FiArrowRight />
        </button>
      </div>
    </div>
  );
}

function QRCode({ value, size = 160 }) {
  const cells = 21;
  const cell = Math.floor(size / cells);
  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
    return h >>> 0;
  };
  const grid = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      if ((r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)) return true;
      return ((hash(value + r * 100 + c) >> (c % 30)) & 1) === 1;
    }),
  );
  return (
    <svg width={cells * cell} height={cells * cell}>
      {grid.map((row, r) => row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#111" /> : null)))}
    </svg>
  );
}

function ReportsPage() {
  const { plantations, crops, harvests } = useData();
  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>Reports</h1><p className="page-subtitle">Overview of all plantations, crops, and harvest data</p></div>
      </div>
      <div className="card">
        <div className="card-title"><FiGrid /> Plantations</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Location</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {plantations.length === 0 ? <tr><td colSpan={4} className="table-empty">No data</td></tr>
                : plantations.map((p) => <tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.location}</td><td><span className="status-chip active">● {p.status}</span></td><td>{p.createdAt}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FiStar /> Crops</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Crop</th><th>Variety</th><th>Sowing Date</th><th>Expected Harvest</th></tr></thead>
            <tbody>
              {crops.length === 0 ? <tr><td colSpan={4} className="table-empty">No data</td></tr>
                : crops.map((c) => <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.variety || "—"}</td><td>{c.sowingDate}</td><td>{c.expectedHarvest || "—"}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><FiTrendingUp /> Harvests</div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Total</th><th>Rejected</th><th>Accepted</th><th>Unit</th></tr></thead>
            <tbody>
              {harvests.length === 0 ? <tr><td colSpan={5} className="table-empty">No data</td></tr>
                : harvests.map((h) => <tr key={h.id}><td>{h.harvestDate}</td><td>{h.total}</td><td><span style={{ color: "#c0392b" }}>{h.rejected || 0}</span></td><td><span style={{ color: "#1f8a43" }}><strong>{h.accepted}</strong></span></td><td>{h.unit}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  const { plantations, crops, harvests, packings, batches, processImages, delProcessImage } = useData();
  const { confirm, dialog } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const mine = plantations.filter((p) => p.userId === user?.id);
  const mineIds = mine.map((p) => p.id);
  const mineCrops = crops.filter((c) => mineIds.includes(c.plantationId));
  const mineHarvests = harvests.filter((h) => mineIds.includes(h.plantationId));
  const minePackings = packings.filter((p) => mineIds.includes(p.plantationId));
  const mineBatches = batches.filter((b) => b.supplierId === user?.id);
  const mineImages = processImages.filter((i) => mineIds.includes(i.plantationId));
  const stages = ["Crops", "Monitoring", "Verification", "Harvest", "Packing", "Certificate"];

  const removeImage = async (id) => { const ok = await confirm("Delete this entry?"); if (!ok) return; delProcessImage(id); };

  return (
    <div className="page-container">
      {dialog}
      <div className="profile-banner">
        <div className="profile-avatar-lg"><FiUser /></div>
        <div className="profile-banner-info">
          <h1>{name}</h1>
          <span className="badge-chip capitalize">{user?.role}</span>
        </div>
        {!editing ? (
          <button className="btn btn-ghost profile-edit-btn" onClick={() => setEditing(true)}><FiEdit2 /> Edit Profile</button>
        ) : (
          <div className="profile-edit-row">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            <button className="btn btn-primary" onClick={() => setEditing(false)}><FiCheck /> Save</button>
            <button className="btn btn-ghost" onClick={() => { setName(user?.name || ""); setEditing(false); }}><FiX /></button>
          </div>
        )}
      </div>

      <div className="info-grid">
        <div className="info-item"><FiMail className="info-icon" /><span>Email</span><strong>{user?.email}</strong></div>
        <div className="info-item"><FiShield className="info-icon" /><span>Role</span><strong className="capitalize">{user?.role}</strong></div>
        <div className="info-item"><FiCalendar className="info-icon" /><span>Platform</span><strong>Seed-to-Batch</strong></div>
        <div className="info-item"><FiCheck className="info-icon" /><span>Status</span><strong style={{ color: "#1f8a43" }}>Active ✓</strong></div>
      </div>

      <div className="stats-row">
        {user?.role === "grower" ? (
          <>
            <StatCard icon={<FiGrid />} label="Plantations" value={mine.length} color="green" />
            <StatCard icon={<FiStar />} label="Crops" value={mineCrops.length} color="amber" />
            <StatCard icon={<FiTrendingUp />} label="Harvests" value={mineHarvests.length} color="blue" />
            <StatCard icon={<FiPackage />} label="Packings" value={minePackings.length} color="purple" />
          </>
        ) : (
          <>
            <StatCard icon={<FiGrid />} label="Batches Created" value={mineBatches.length} color="blue" />
            <StatCard icon={<FiPackage />} label="Packings Managed" value={minePackings.length} color="green" />
          </>
        )}
      </div>

      {mineImages.length > 0 && (
        <div className="card">
          <div className="card-title"><FiCamera /> Process Image Gallery</div>
          {stages.map((stage) => {
            const list = mineImages.filter((img) => img.stage === stage);
            if (!list.length) return null;
            return (
              <div key={stage} className="gallery-group">
                <div className="gallery-stage-label">{stage}</div>
                <div className="record-list">
                  {list.map((img) => (
                    <div key={img.id} className="record-row">
                      <span className="record-text"><FiCamera /> {img.name} <span className="muted">({img.date})</span></span>
                      <button className="icon-btn danger" onClick={() => removeImage(img.id)}><FiTrash2 /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TracePage({ patchId }) {
  const { batches, packings, harvests, crops, plantations } = useData();
  const batch = batches.find((b) => b.id === patchId);

  if (!batch) {
    return (
      <div className="trace-page trace-public">
        <div className="trace-card" style={{ textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 40 }}>🔍</div>
          <h2>Batch Not Found</h2>
          <p className="muted">Batch ID: <code>{patchId}</code> does not exist.</p>
        </div>
      </div>
    );
  }

  const firstPacking = packings.find((p) => p.id === batch.packingIds[0]);
  const harvestRecord = firstPacking ? harvests.find((h) => h.id === firstPacking.harvestId) : null;
  const cropRecord = harvestRecord ? crops.find((c) => c.id === harvestRecord.cropId) : null;
  const plantation = firstPacking ? plantations.find((p) => p.id === firstPacking.plantationId) : null;
  const isShrimp = plantation?.type === "shrimp";

  const cropKey = (cropRecord?.name || "").toLowerCase();
  const xfactorMap = {
    tomato: [{ label: "Fruit Firmness", val: "7.2 N" }, { label: "Brix Sweetness", val: "4.8 °Bx" }, { label: "Lycopene", val: "85 mg/kg" }, { label: "Pest Resistance", val: "0.89" }],
    brinjal: [{ label: "Glossiness", val: "92%" }, { label: "Anthocyanin", val: "120 mg/kg" }, { label: "Pest Resistance", val: "0.82" }],
    spinach: [{ label: "Iron", val: "27 mg/kg" }, { label: "Nitrate", val: "1800 mg/kg" }, { label: "Chlorophyll", val: "48 SPAD" }],
    palak: [{ label: "Iron", val: "27 mg/kg" }, { label: "Nitrate", val: "1800 mg/kg" }, { label: "Chlorophyll", val: "48 SPAD" }],
    "green gram": [{ label: "Protein", val: "24.5%" }, { label: "Germination", val: "95%" }, { label: "Moisture", val: "10.2%" }],
    moong: [{ label: "Protein", val: "24.5%" }, { label: "Germination", val: "95%" }, { label: "Moisture", val: "10.2%" }],
    lettuce: [{ label: "Crispness", val: "8.4 N" }, { label: "Nutrient Efficiency", val: "92%" }, { label: "Chlorophyll", val: "42 SPAD" }],
    cabbage: [{ label: "Head Density", val: "1.05 g/cm³" }, { label: "Compactness", val: "88%" }, { label: "Vitamin C", val: "36 mg/100g" }],
    cauliflower: [{ label: "Curd Compactness", val: "91%" }, { label: "Whiteness", val: "85" }, { label: "Vitamin C", val: "48 mg/100g" }],
    carrot: [{ label: "Beta Carotene", val: "8.3 mg/100g" }, { label: "Root Length", val: "18 cm" }, { label: "Sugar", val: "6.2 °Bx" }],
    beetroot: [{ label: "Betanin", val: "95 mg/100g" }, { label: "Diameter", val: "7.5 cm" }, { label: "Sugar", val: "8.1 °Bx" }],
    okra: [{ label: "Tenderness", val: "6.8 N" }, { label: "Fiber", val: "3.2 g/100g" }, { label: "Mucilage", val: "18 mL/100g" }],
    bhindi: [{ label: "Tenderness", val: "6.8 N" }, { label: "Fiber", val: "3.2 g/100g" }, { label: "Mucilage", val: "18 mL/100g" }],
    "french beans": [{ label: "Pod Length", val: "14 cm" }, { label: "Protein", val: "7.1 g/100g" }, { label: "Fiber", val: "3.4 g/100g" }],
    coriander: [{ label: "Essential Oil", val: "0.8%" }, { label: "Aroma", val: "8.5/10" }, { label: "Chlorophyll", val: "45 SPAD" }],
    fenugreek: [{ label: "Trigonelline", val: "0.36%" }, { label: "Bitterness", val: "4.2/10" }, { label: "Protein", val: "23 g/100g" }],
    methi: [{ label: "Trigonelline", val: "0.36%" }, { label: "Bitterness", val: "4.2/10" }, { label: "Protein", val: "23 g/100g" }],
    capsicum: [{ label: "Capsanthin", val: "125 mg/kg" }, { label: "Thickness", val: "6.5 mm" }, { label: "Vitamin C", val: "128 mg/100g" }],
    default: [{ label: "Quality Score", val: "A+" }, { label: "Pest Resistance", val: "0.85" }],
  };
  const xfactor = isShrimp ? [{ label: "Avg Size", val: "30-40 count/kg" }, { label: "FCR", val: "1.4:1" }, { label: "Culture Period", val: "90-120 days" }, { label: "Survival Rate", val: "80-85%" }] : (xfactorMap[cropKey] || xfactorMap.default);

  const retailSizes = {
    tomato: 1, spinach: 0.5, palak: 0.5, coriander: 0.25, lettuce: 0.3, cabbage: 1, cauliflower: 1,
    carrot: 0.5, beetroot: 0.5, capsicum: 0.5, okra: 0.5, bhindi: 0.5, brinjal: 0.5, "french beans": 0.5,
    "green gram": 1, moong: 1, shrimp: 1,
  };
  const retailSize = isShrimp ? 1 : (retailSizes[cropKey] || 1);
  const totalRetail = Math.floor((batch.totalWeight || 0) / retailSize);

  const timeline = [
    { label: "Crop Planted", date: cropRecord?.sowingDate, done: !!cropRecord },
    { label: "Harvested", date: harvestRecord?.harvestDate, done: !!harvestRecord },
    { label: "Bulk Packed", date: firstPacking?.packingDate, done: !!firstPacking },
    { label: "Supplier Packing", date: batch.createdAt, done: true },
    { label: "Transported", date: batch.createdAt, done: true },
    { label: "Delivered", date: null, done: false },
  ];

  return (
    <div className="trace-page trace-public">
      <div className="trace-hero">
        <div className="trace-hero-img">
          <div className="trace-hero-overlay">
            <h2 className="trace-product-name">{cropRecord?.name || "Agricultural Product"}</h2>
          </div>
          <div className="trace-info-bar">
            <div className="trace-info-item"><span className="amber-dot">●</span><span>Variety</span><strong>{cropRecord?.variety || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">●</span><span>Harvested</span><strong>{harvestRecord?.harvestDate || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">●</span><span>Origin</span><strong>{plantation?.location || "-"}</strong></div>
            <div className="trace-info-item"><span className="amber-dot">●</span><span>Batch ID</span><strong className="mono">{batch.id}</strong></div>
          </div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">👨‍🌾 Farmer Information</div>
        <div className="farmer-row">
          <div className="farmer-avatar">{isShrimp ? "🦐" : "🌾"}</div>
          <div>
            <div className="farmer-name">{plantation?.name || "Unknown Farm"}</div>
            <div className="farmer-sub">{isShrimp ? "Aquaculture Farm" : "Organic Farming Cooperative"}</div>
            <div className="farmer-badges">
              <span className="badge badge-green">{isShrimp ? "MPEDA Registered" : "Certified Organic Farmer"}</span>
              <span className="badge badge-blue">{isShrimp ? "Aquaculture Expert" : "Experienced Farmer"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">📍 Farm Location</div>
        <div className="location-row">
          <div>
            <div className="location-name">{plantation?.location || "-"}</div>
            <div className="location-meta">Area: 2.5 hectares · <span className="badge badge-green">Active</span></div>
          </div>
        </div>
        <div style={{ padding: "0 16px 14px" }}>
          <button className="btn btn-dark">🎬 View Farm Media</button>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header" style={{ background: isShrimp ? "#1a5276" : "#2d6a2e" }}>
          {isShrimp ? "💧 Water & Environment Data" : "🌱 Sustainability Data"}
        </div>
        {isShrimp ? (
          <div className="sustain-grid">
            {[{ l: "Water Quality", v: "pH 7.5-8.5" }, { l: "Water Temp", v: "28-32°C" }, { l: "Dissolved O₂", v: "≥ 5 mg/L" }, { l: "Ammonia", v: "< 0.1 mg/L" }, { l: "Antibiotic Test", v: "Passed ✓" }, { l: "Salinity", v: "15-25 ppt" }].map((i) => (
              <div key={i.l} className="sustain-item"><div className="sustain-label">{i.l}</div><div className="sustain-val">{i.v}</div></div>
            ))}
          </div>
        ) : (
          <div className="sustain-grid">
            {[{ l: "Water Used", v: "1100 L/kg" }, { l: "Soil Health", v: "pH 6.8" }, { l: "Organic Carbon", v: "1.2%" }, { l: "NPK", v: "N:45 P:30 K:35 kg/ha" }, { l: "NDVI Score", v: "0.78" }, { l: "CO₂ Footprint", v: "0.4 kg CO₂e" }].map((i) => (
              <div key={i.l} className="sustain-item"><div className="sustain-label">{i.l}</div><div className="sustain-val">{i.v}</div></div>
            ))}
          </div>
        )}
      </div>

      <div className="trace-card">
        <div className="trace-section-header">{isShrimp ? "🦐 Shrimp Product Details" : "⭐ Crop-Specific Quality X-Factor"}</div>
        <div className="xfactor-grid">
          {xfactor.map((x) => (
            <div key={x.label} className="xfactor-item">
              <span className="star">★★★★★</span>
              <div className="xfactor-label">{x.label}</div>
              <div className="xfactor-val">{x.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">🏅 Certifications</div>
        <div className="cert-row">
          <span className="cert-badge">🌿</span>
          <div>
            <div style={{ fontWeight: 600 }}>{isShrimp ? "MPEDA / BAP Certified" : "India Organic Certified"}</div>
            <div style={{ fontSize: 13 }} className="muted">Valid Until: Dec 2025</div>
          </div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">🚚 Harvest & Supply Chain</div>
        <div className="supply-chain">
          {["Harvested", "Bulk Packed", "Supplier Packing", "Transported", "At Store"].map((s, i) => (
            <div key={s} className="chain-item">
              <div className={`chain-dot ${i < 4 ? "chain-active" : "chain-inactive"}`}>{i < 4 ? "✓" : "○"}</div>
              <div className={`chain-label ${i < 4 ? "" : "muted"}`}>{s}</div>
              {i < 4 && <div className="chain-line" />}
            </div>
          ))}
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">🌾 Harvest Data</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Harvest Date</span><strong>{harvestRecord?.harvestDate || "-"}</strong></div>
          <div className="kv-item"><span>Total Quantity</span><strong>{harvestRecord?.total || 0} {harvestRecord?.unit || "kg"}</strong></div>
          <div className="kv-item"><span>Accepted</span><strong style={{ color: "#2d6a2e" }}>{harvestRecord?.accepted || 0} {harvestRecord?.unit || "kg"}</strong></div>
          {harvestRecord?.rejected > 0 && <div className="kv-item"><span>Rejected</span><strong style={{ color: "#e53935" }}>{harvestRecord.rejected} {harvestRecord.unit}</strong></div>}
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">📦 Bulk Packing Details</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Packed On</span><strong>{firstPacking?.packingDate || "-"}</strong></div>
          <div className="kv-item"><span>Packages</span><strong>{firstPacking?.numPackages || 0} × {firstPacking?.packingSize || "-"}</strong></div>
          <div className="kv-item"><span>Net Weight</span><strong>{firstPacking?.netWeight || 0} kg</strong></div>
          <div className="kv-item"><span>Warehouse</span><strong>{firstPacking?.warehouse || "-"}</strong></div>
          <div className="kv-item"><span>Location</span><strong>{firstPacking ? `${firstPacking.city}, ${firstPacking.state}` : "-"}</strong></div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header" style={{ background: "linear-gradient(90deg, #1a5276, #2980b9)" }}>🏪 Supplier Packing (Retail)</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Batch ID</span><code className="mono">{batch.id}</code></div>
          <div className="kv-item"><span>Bulk Weight</span><strong>{batch.totalWeight} kg</strong></div>
          <div className="kv-item"><span>Retail Packet Size</span><strong>{retailSize} kg</strong></div>
          <div className="kv-item"><span>Total Retail Packets</span><strong>{totalRetail} pcs</strong></div>
          <div className="kv-item"><span>Packaging Type</span><strong>{isShrimp ? "IQF / Frozen Pack" : "Consumer Ready"}</strong></div>
          <div className="kv-item"><span>QC Status</span><strong style={{ color: "#2d6a2e" }}>Passed ✓</strong></div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">📅 Traceability Timeline</div>
        <div className="v-timeline">
          {timeline.map((t, i) => (
            <div key={t.label} className="v-tl-item">
              <div className={`v-tl-dot ${t.done ? "v-tl-done" : "v-tl-pending"}`} />
              {i < timeline.length - 1 && <div className={`v-tl-line ${t.done ? "v-tl-line-done" : ""}`} />}
              <div className="v-tl-content">
                <span className="v-tl-label">{t.label}</span>
                <span className="v-tl-date">{t.date || "Pending"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">📋 Batch Summary</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Batch ID</span><code className="mono">{batch.id}</code></div>
          <div className="kv-item"><span>Total Weight</span><strong>{batch.totalWeight} kg</strong></div>
          <div className="kv-item"><span>Description</span><strong>{batch.description || "-"}</strong></div>
          <div className="kv-item"><span>Created</span><strong>{batch.createdAt}</strong></div>
          <div className="kv-item"><span>Items</span><strong>{batch.packingIds.length}</strong></div>
        </div>
      </div>

      <div className="trace-card">
        <div className="trace-section-header">✅ Data Verification</div>
        <div className="kv-grid">
          <div className="kv-item"><span>Verified By</span><strong>MaatiAI System</strong></div>
          <div className="kv-item"><span>Last Updated</span><strong>{new Date().toLocaleString()}</strong></div>
          <div className="kv-item"><span>Status</span><strong style={{ color: "#2d6a2e" }}>Verified ✓</strong></div>
        </div>
      </div>

      <div className="trace-actions">
        <button className="btn btn-primary">📸 View Harvest Photos</button>
        <button className="btn btn-outline">▶ Watch Farmer Story</button>
      </div>

      <div className="trace-footer">Powered by <strong>MaatiAI</strong> Traceability</div>
    </div>
  );
}
function AppShell() {
  const { user } = useAuth();
  const { route, navigate } = useRouter();
  const { toast, toasts } = useToast();
  const plantationMatch = route.match(/^\/plantation\/(.+)$/);
  const patchMatch = route.match(/^\/patch\/(.+)$/);

  useEffect(() => { if (!user && route !== "/" && !patchMatch) navigate("/"); }, [user, route, patchMatch, navigate]);

  let page = null;
  if (patchMatch) page = <TracePage patchId={patchMatch[1]} />;
  else if (!user) page = <HomePage navigate={navigate} toast={toast} />;
  else if (plantationMatch) page = <PlantationDetail plantationId={plantationMatch[1]} toast={toast} />;
  else if (route === "/grower") page = user.role === "grower" ? <GrowerDashboard navigate={navigate} toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/supplier") page = user.role === "supplier" ? <SupplierDashboard navigate={navigate} toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/plantations") page = user.role === "grower" ? <PlantationsPage navigate={navigate} toast={toast} /> : <div className="page-container">Access denied</div>;
  else if (route === "/reports") page = <ReportsPage />;
  else if (route === "/profile") page = <ProfilePage />;
  else page = user.role === "grower" ? <GrowerDashboard navigate={navigate} toast={toast} /> : <SupplierDashboard navigate={navigate} toast={toast} />;

  return (
    <div className="app-root">
      <Toasts toasts={toasts} />
      {user && !patchMatch && <Header route={route} navigate={navigate} />}
      <main>{page}</main>
    </div>
  );
}

export default function TraceConnect() {
  return (
    <div className="tc-root">
      <AuthProvider>
        <DataProvider>
          <AppShell />
        </DataProvider>
      </AuthProvider>
    </div>
  );
}



