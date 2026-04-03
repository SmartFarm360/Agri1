import { useState, useEffect, useContext, createContext } from "react";
import { FiLock, FiCheckCircle } from "react-icons/fi";
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
    setToasts((t) => [{ id, type, message }, ...t]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 1500);
  };
  return { toasts, toast };
}

function Toasts({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
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
      <div className="modal-box">
        <h3>Confirm Delete</h3>
        <p className="muted">{message}</p>
        <div className="auth-actions">
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
        <button className="auth-close-btn" onClick={onClose} aria-label="Close">
          X
        </button>
        <div className="auth-tabs">
          <button className={mode === "signin" ? "auth-tab active" : "auth-tab"} onClick={() => setMode("signin")}>Sign In</button>
          <button className={mode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => setMode("signup")}>Sign Up</button>
        </div>
        {error && <div className="auth-error">{error}</div>}
        {mode === "signup" && <input className="input" placeholder="Full Name" value={form.name} onChange={(e) => set("name", e.target.value)} />}
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => set("password", e.target.value)} />
        {mode === "signup" && (
          <select className="input" value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="grower">Grower</option>
            <option value="supplier">Supplier</option>
          </select>
        )}
        <div className="auth-actions">
          <button className="btn btn-outline" onClick={signInWithGoogle} disabled={loading}>Continue with Google</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>{loading ? "Please wait..." : (mode === "signin" ? "Sign In" : "Create Account")}</button>
        </div>
      </div>
    </div>
  );
}

function HomePage({ navigate, toast }) {
  const [showAuth, setShowAuth] = useState(true);
  const { user } = useAuth();
  useEffect(() => { if (user) navigate(user.role === "grower" ? "/grower" : "/supplier"); }, [user, navigate]);
  return (
    <div className="auth-entry-page">
      {!showAuth && (
        <div className="auth-entry-card">
          <h2>Seed-to-Batch</h2>
          <p>Continue to login or create your account.</p>
          <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Open Sign In / Sign Up</button>
        </div>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} toast={toast} />}
    </div>
  );
}

function Header({ route, navigate }) {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const links = user.role === "grower"
    ? [{ label: "Dashboard", path: "/grower" }, { label: "Plantations", path: "/plantations" }, { label: "Reports", path: "/reports" }, { label: "Profile", path: "/profile" }]
    : [{ label: "Dashboard", path: "/supplier" }, { label: "Reports", path: "/reports" }, { label: "Profile", path: "/profile" }];
  return (
    <header className="app-header">
      <button className="brand" onClick={() => navigate(user.role === "grower" ? "/grower" : "/supplier")}>Seed-to-Batch</button>
      <nav>
        {links.map((l) => <button key={l.path} className={route === l.path ? "nav-pill active" : "nav-pill"} onClick={() => navigate(l.path)}>{l.label}</button>)}
        <button className="btn btn-ghost" onClick={() => { signOut(); navigate("/"); }}>Logout</button>
      </nav>
    </header>
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
    if (!form.name || !form.location) { toast("Fill in all fields", "error"); return; }
    addPlantation({ ...form, userId: user.id, status: "Active" });
    setForm({ type: "crop", name: "", location: "" });
    toast("Plantation created!", "success");
  };

  const remove = async (id) => {
    const ok = await confirm("Delete this plantation and related data?");
    if (!ok) return;
    delPlantation(id);
    toast("Deleted", "success");
  };

  return (
    <div className="page-container">
      {dialog}
      <h1>Grower Dashboard</h1>
      <p className="muted">Welcome back, {user?.name}</p>
      <div className="stats-grid">
        <div className="stat">Plantations: {mine.length}</div>
        <div className="stat">Crops: {crops.filter((c) => mineIds.includes(c.plantationId)).length}</div>
        <div className="stat">Harvested: {totalHarvested} kg</div>
        <div className="stat">Packings: {packings.filter((p) => mineIds.includes(p.plantationId)).length}</div>
      </div>
      <div className="card">
        <h3>Create New Plantation</h3>
        <div className="form-row">
          <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="crop">Crop Farming</option>
            <option value="shrimp">Shrimp / Prawn Farming</option>
          </select>
          <input className="input" placeholder="Plantation Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <button className="btn btn-primary" onClick={create}>Create</button>
        </div>
      </div>
      <div className="card-grid">
        {mine.map((p) => (
          <div key={p.id} className="plantation-card">
            <h4>{p.name}</h4>
            <p>{p.location}</p>
            <p className="muted">Type: {p.type === "shrimp" ? "Shrimp / Prawn Farming" : "Crop Farming"} | Created: {p.createdAt}</p>
            <div className="actions">
              <button className="btn btn-outline" onClick={() => navigate(`/plantation/${p.id}`)}>Open</button>
              <button className="btn btn-danger" onClick={() => remove(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
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
      <div className="row-between">
        <h1>All Plantations</h1>
        <button className="btn btn-primary" onClick={() => navigate("/grower")}>+ New</button>
      </div>
      {mine.length === 0 ? (
        <div className="empty-state">No plantations yet.</div>
      ) : (
        <div className="card-grid">
          {mine.map((p) => (
            <div key={p.id} className="plantation-card">
              <h4>{p.name}</h4>
              <p>{p.location}</p>
              <p className="muted">{p.createdAt}</p>
              <div className="actions">
                <button className="btn btn-outline" onClick={() => navigate(`/plantation/${p.id}`)}>Open</button>
                <button className="btn btn-danger" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkflowStep({ title, children }) {
  return <div className="card"><h3>{title}</h3>{children}</div>;
}

function PlantationDetail({ plantationId, toast }) {
  const {
    plantations,
    crops,
    monitoring,
    verification,
    harvests,
    packings,
    processImages,
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
    addProcessImage,
    delProcessImage,
  } = useData();
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
  const L = {
    crop: isShrimp ? "Pond" : "Crop",
    crops: isShrimp ? "Ponds" : "Crops",
    sowDate: isShrimp ? "Stocking Date" : "Sowing Date",
    variety: isShrimp ? "Hatchery / Seed Batch" : "Variety",
    options: isShrimp ? SHRIMP_OPTIONS : CROP_OPTIONS,
    monitoring: isShrimp ? SHRIMP_MONITORING : MONITORING_TYPES,
  };
  const unlocked = [true, pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0];
  const done = [pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0, pPack.length > 0];
  const names = [L.crops, "Monitoring", "Verification", "Harvest", "Packing"];

  const openStep = (i) => {
    if (!unlocked[i]) {
      toast(`Complete ${names[i - 1]} first`, "error");
      return;
    }
    setStep(i);
  };

  return (
    <div className="page-container">
      {dialog}
      <h1>{plantation.name}</h1>
      <p className="muted">{plantation.location} | {plantation.status}</p>
      <div className="step-bar">
        {names.map((n, i) => (
          <button key={n} className={`step ${step === i ? "active" : ""} ${done[i] ? "done" : ""} ${!unlocked[i] ? "locked" : ""}`} onClick={() => openStep(i)}>
            {done[i] ? <FiCheckCircle className="step-icon" /> : !unlocked[i] ? <FiLock className="step-icon" /> : <span className="step-index">{i + 1}</span>}
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
        <div className="actions right">
          <button className="btn btn-primary" onClick={() => openStep(step + 1)}>Next: {names[step + 1]} {"->"}</button>
        </div>
      )}

      {done[4] && (
        <div className="card video-card">
          <h3>Generate Traceability Video</h3>
          <p className="muted">Create lifecycle video for this farm.</p>
          <button
            className="btn btn-outline"
            onClick={async () => {
              try {
                await fetch("https://maatiaivideogenerator.onrender.com", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    logo: "",
                    intro_logo: "",
                    farmer_img: "",
                    farm_img: "",
                    process_images: pImgs.map((x) => x.imageUrl).filter(Boolean),
                    certificate_img: "",
                    end_img: "",
                  }),
                });
                toast("Video generation initiated!", "success");
              } catch {
                toast("Video service unavailable right now.", "error");
              }
            }}
          >
            Generate
          </button>
        </div>
      )}
    </div>
  );
}

function ProcessEntries({ stage, plantationId, pImgs, addProcessImage, delProcessImage, confirm, toast }) {
  const [name, setName] = useState("");
  const list = pImgs.filter((x) => x.stage === stage);
  const add = () => {
    if (!name.trim()) {
      toast("Enter process name", "error");
      return;
    }
    addProcessImage({ plantationId, stage, name: name.trim(), date: TODAY, imageUrl: "" });
    setName("");
    toast("Entry added", "success");
  };
  const remove = async (id) => {
    const ok = await confirm("Delete this process entry?");
    if (!ok) return;
    delProcessImage(id);
  };
  return (
    <div className="card process-card">
      <h4>Process Entries - {stage}</h4>
      <div className="form-row">
        <input className="input" placeholder="Enter process / field name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-outline" onClick={add}>Capture</button>
      </div>
      {list.length > 0 && (
        <ul className="records">
          {list.map((it) => (
            <li key={it.id}>
              {it.name} ({it.date})
              <button className="link-danger" onClick={() => remove(it.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CropsStep({ L, pCrops, addCrop, delCrop, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({ name: "", customName: "", variety: "", sowingDate: TODAY, expectedHarvest: "" });
  const add = () => {
    const name = f.name === "Other" ? f.customName : f.name;
    if (!name || !f.variety || !f.sowingDate) return;
    addCrop({ plantationId, name, variety: f.variety, sowingDate: f.sowingDate, expectedHarvest: f.expectedHarvest });
    setF({ name: "", customName: "", variety: "", sowingDate: TODAY, expectedHarvest: "" });
  };
  const remove = async (id) => {
    const ok = await confirm(`Delete this ${L.crop.toLowerCase()}?`);
    if (!ok) return;
    delCrop(id);
  };
  return (
    <>
      <WorkflowStep title={`Add ${L.crop}`}>
        <div className="form-row">
          <select className="input" value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))}>
            <option value="">Select {L.crop}</option>
            {L.options.map((o) => <option key={o}>{o}</option>)}
          </select>
          {f.name === "Other" && <input className="input" placeholder="Custom Name" value={f.customName} onChange={(e) => setF((x) => ({ ...x, customName: e.target.value }))} />}
          <input className="input" placeholder={L.variety} value={f.variety} onChange={(e) => setF((x) => ({ ...x, variety: e.target.value }))} />
          <input className="input" type="date" value={f.sowingDate} onChange={(e) => setF((x) => ({ ...x, sowingDate: e.target.value }))} />
          <input className="input" type="date" value={f.expectedHarvest} onChange={(e) => setF((x) => ({ ...x, expectedHarvest: e.target.value }))} />
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
        <ul className="records">{pCrops.map((c) => <li key={c.id}>{c.name} ({c.variety}) <button className="link-danger" onClick={() => remove(c.id)}>Delete</button></li>)}</ul>
      </WorkflowStep>
      <ProcessEntries stage="Crops" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function MonitoringStep({ L, pMon, addMonitoring, delMonitoring, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast }) {
  const [f, setF] = useState({ date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" });
  const add = () => {
    const inputType = f.inputType === "Other" ? f.customType : f.inputType;
    if (!inputType || !f.cropId) return;
    addMonitoring({ plantationId, date: f.date, inputType, cropId: f.cropId, remarks: f.remarks });
    setF({ date: TODAY, inputType: "", customType: "", cropId: "", remarks: "" });
  };
  const remove = async (id) => {
    const ok = await confirm("Delete this record?");
    if (!ok) return;
    delMonitoring(id);
  };
  return (
    <>
      <WorkflowStep title="Add Monitoring Record">
        <div className="form-row">
          <input className="input" type="date" value={f.date} onChange={(e) => setF((x) => ({ ...x, date: e.target.value }))} />
          <select className="input" value={f.inputType} onChange={(e) => setF((x) => ({ ...x, inputType: e.target.value }))}>
            <option value="">Input Type</option>
            {L.monitoring.map((o) => <option key={o}>{o}</option>)}
          </select>
          {f.inputType === "Other" && <input className="input" placeholder="Custom type" value={f.customType} onChange={(e) => setF((x) => ({ ...x, customType: e.target.value }))} />}
          <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
            <option value="">Select {L.crop}</option>
            {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="input" placeholder="Remarks" value={f.remarks} onChange={(e) => setF((x) => ({ ...x, remarks: e.target.value }))} />
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
        <ul className="records">{pMon.map((m) => <li key={m.id}>{m.inputType} - {m.date} <button className="link-danger" onClick={() => remove(m.id)}>Delete</button></li>)}</ul>
      </WorkflowStep>
      <ProcessEntries stage="Monitoring" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function VerificationStep({ pVer, addVerification, delVerification, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, L }) {
  const [f, setF] = useState({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
  const add = () => {
    if (!f.cropId) return;
    addVerification({ plantationId, ...f });
    setF({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
  };
  const remove = async (id) => {
    const ok = await confirm("Delete verification?");
    if (!ok) return;
    delVerification(id);
  };
  return (
    <>
      <WorkflowStep title="Add Verification">
        <div className="form-row">
          <input className="input" type="date" value={f.inspectionDate} onChange={(e) => setF((x) => ({ ...x, inspectionDate: e.target.value }))} />
          <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
            <option value="">Select {L.crop}</option>
            {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" value={f.health} onChange={(e) => setF((x) => ({ ...x, health: e.target.value }))}>
            {HEALTH_OPTIONS.map((h) => <option key={h}>{h}</option>)}
          </select>
          <select className="input" value={f.approved ? "yes" : "no"} onChange={(e) => setF((x) => ({ ...x, approved: e.target.value === "yes" }))}>
            <option value="yes">Approved</option>
            <option value="no">Not Approved</option>
          </select>
          <button className="btn btn-outline">Capture Certificate</button>
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
        <ul className="records">{pVer.map((v) => <li key={v.id}>{v.health} ({v.approved ? "Approved" : "Not Approved"}) <button className="link-danger" onClick={() => remove(v.id)}>Delete</button></li>)}</ul>
      </WorkflowStep>
      <ProcessEntries stage="Verification" plantationId={plantationId} pImgs={pImgs} addProcessImage={addProcessImage} delProcessImage={delProcessImage} confirm={confirm} toast={toast} />
    </>
  );
}

function HarvestStep({ pHar, addHarvest, delHarvest, pCrops, confirm, plantationId, pImgs, addProcessImage, delProcessImage, toast, L }) {
  const [f, setF] = useState({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
  const accepted = Math.max(0, (Number(f.total) || 0) - (Number(f.rejected) || 0));
  const add = () => {
    if (!f.cropId || !f.total) return;
    addHarvest({ plantationId, ...f, total: Number(f.total), rejected: Number(f.rejected) || 0, accepted });
    setF({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
  };
  const remove = async (id) => {
    const ok = await confirm("Delete harvest?");
    if (!ok) return;
    delHarvest(id);
  };
  return (
    <>
      <WorkflowStep title="Record Harvest">
        <div className="form-row">
          <input className="input" type="date" value={f.harvestDate} onChange={(e) => setF((x) => ({ ...x, harvestDate: e.target.value }))} />
          <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
            <option value="">Select {L.crop}</option>
            {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="input" type="number" placeholder="Total" value={f.total} onChange={(e) => setF((x) => ({ ...x, total: e.target.value }))} />
          <select className="input" value={f.unit} onChange={(e) => setF((x) => ({ ...x, unit: e.target.value }))}>
            {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
          </select>
          <input className="input" type="number" placeholder="Rejected" value={f.rejected} onChange={(e) => setF((x) => ({ ...x, rejected: e.target.value }))} />
          <div className="accepted-box">Accepted: {accepted} {f.unit}</div>
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
        <ul className="records">{pHar.map((h) => <li key={h.id}>{h.harvestDate} - Accepted: {h.accepted} {h.unit} <button className="link-danger" onClick={() => remove(h.id)}>Delete</button></li>)}</ul>
      </WorkflowStep>
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
    if (!f.harvestId || !f.packingSize || !f.netWeight) return;
    addPacking({ plantationId, ...f, numPackages: Number(f.numPackages) || 0, netWeight: Number(f.netWeight) });
    setF({ packingDate: TODAY, harvestId: "", packingSize: "", numPackages: "", netWeight: "", warehouse: "", street: "", city: "", state: "", pincode: "", country: "India" });
  };
  const remove = async (id) => {
    const ok = await confirm("Delete packing?");
    if (!ok) return;
    delPacking(id);
  };
  return (
    <>
      <WorkflowStep title="Record Packing">
        <div className="form-row">
          <input className="input" type="date" value={f.packingDate} onChange={(e) => setF((x) => ({ ...x, packingDate: e.target.value }))} />
          <select className="input" value={f.harvestId} onChange={(e) => setF((x) => ({ ...x, harvestId: e.target.value }))}>
            <option value="">Select Harvest</option>
            {pHar.map((h) => <option key={h.id} value={h.id}>{h.harvestDate} ({h.accepted} {h.unit})</option>)}
          </select>
          <input className="input" placeholder="Packing Size" value={f.packingSize} onChange={(e) => setF((x) => ({ ...x, packingSize: e.target.value }))} />
          <input className="input" type="number" placeholder="No. of Packages" value={f.numPackages} onChange={(e) => setF((x) => ({ ...x, numPackages: e.target.value }))} />
          <input className="input" type="number" placeholder="Net Weight (kg)" value={f.netWeight} onChange={(e) => setF((x) => ({ ...x, netWeight: e.target.value }))} />
          <input className="input" placeholder="Warehouse" value={f.warehouse} onChange={(e) => setF((x) => ({ ...x, warehouse: e.target.value }))} />
          <input className="input" placeholder="Street" value={f.street} onChange={(e) => setF((x) => ({ ...x, street: e.target.value }))} />
          <input className="input" placeholder="City" value={f.city} onChange={(e) => setF((x) => ({ ...x, city: e.target.value }))} />
          <input className="input" placeholder="State" value={f.state} onChange={(e) => setF((x) => ({ ...x, state: e.target.value }))} />
          <input className="input" placeholder="Pincode" value={f.pincode} onChange={(e) => setF((x) => ({ ...x, pincode: e.target.value }))} />
          <input className="input" placeholder="Country" value={f.country} onChange={(e) => setF((x) => ({ ...x, country: e.target.value }))} />
          <button className="btn btn-primary" onClick={add}>Add</button>
        </div>
        <ul className="records">{pPack.map((pk) => <li key={pk.id}>{pk.packingDate} - {pk.numPackages} x {pk.packingSize} ({pk.netWeight} kg) <button className="link-danger" onClick={() => remove(pk.id)}>Delete</button></li>)}</ul>
      </WorkflowStep>
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
    if (!selected.length) {
      toast("Select at least one packing", "error");
      return;
    }
    const id = `PATCH-${Date.now().toString(36).toUpperCase()}`;
    const batch = { id, supplierId: user.id, packingIds: selected, description: desc, totalWeight: total, createdAt: TODAY };
    addBatch(batch);
    setBatchModal(batch);
    setSelected([]);
    setDesc("");
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
      <h1>Supplier Dashboard</h1>
      <div className="stats-grid">
        <div className="stat">Available Packings: {available.length}</div>
        <div className="stat">Batches Created: {mine.length}</div>
      </div>
      <div className="card">
        <h3>Select Packings</h3>
        <div className="records">
          {available.map((pk) => (
            <div key={pk.id} className={`check-row ${selected.includes(pk.id) ? "packing-selected" : ""}`} onClick={() => toggle(pk.id)}>
              <input type="checkbox" checked={selected.includes(pk.id)} readOnly />
              <span>{pk.numPackages || 0} packages x {pk.packingSize || "-"} | {pk.netWeight} kg | {pk.packingDate}</span>
            </div>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="form-row">
            <input className="input" placeholder="Batch description" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <button className="btn btn-primary" onClick={create}>Create Batch ({selected.length} items)</button>
          </div>
        )}
      </div>
      <div className="card-grid">
        {mine.map((b) => (
          <div key={b.id} className="batch-card" onClick={() => setBatchModal(b)}>
            <h4>{b.id}</h4>
            <p>{b.totalWeight} kg | {b.createdAt}</p>
            <div className="actions">
              <button className="btn btn-outline" onClick={() => navigate(`/patch/${b.id}`)}>View Trace Page</button>
              <button className="btn btn-danger" onClick={(e) => { e.stopPropagation(); removeBatch(b.id); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {batchModal && <BatchModal batch={batchModal} onClose={() => setBatchModal(null)} navigate={navigate} />}
    </div>
  );
}

function BatchModal({ batch, onClose, navigate }) {
  const qrValue = `${window.location.origin}/patch/${batch.id}`;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="auth-close-btn" onClick={onClose} aria-label="Close">X</button>
        <h3>Batch Created</h3>
        <div className="qr-box"><QRCode value={qrValue} size={180} /></div>
        <p><strong>Batch ID:</strong> <code>{batch.id}</code></p>
        <p><strong>Total Weight:</strong> {batch.totalWeight} kg</p>
        <p><strong>Description:</strong> {batch.description || "-"}</p>
        <p><strong>Created:</strong> {batch.createdAt}</p>
        <p><strong>Items:</strong> {batch.packingIds.length}</p>
        <button className="btn btn-primary" onClick={() => { onClose(); navigate(`/patch/${batch.id}`); }}>View Public Trace Page</button>
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
      <h1>Reports</h1>
      <div className="card">
        <h3>Plantations</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Location</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {plantations.length === 0 ? <tr><td colSpan={4}>No data</td></tr> : plantations.map((p) => <tr key={p.id}><td>{p.name}</td><td>{p.location}</td><td>{p.status}</td><td>{p.createdAt}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>Crops</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Crop</th><th>Variety</th><th>Sowing Date</th><th>Expected Harvest</th></tr></thead>
            <tbody>
              {crops.length === 0 ? <tr><td colSpan={4}>No data</td></tr> : crops.map((c) => <tr key={c.id}><td>{c.name}</td><td>{c.variety || "-"}</td><td>{c.sowingDate}</td><td>{c.expectedHarvest || "-"}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h3>Harvests</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Total</th><th>Rejected</th><th>Accepted</th><th>Unit</th></tr></thead>
            <tbody>
              {harvests.length === 0 ? <tr><td colSpan={5}>No data</td></tr> : harvests.map((h) => <tr key={h.id}><td>{h.harvestDate}</td><td>{h.total}</td><td>{h.rejected || 0}</td><td>{h.accepted}</td><td>{h.unit}</td></tr>)}
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

  const removeImage = async (id) => {
    const ok = await confirm("Delete this image entry?");
    if (!ok) return;
    delProcessImage(id);
  };

  return (
    <div className="page-container">
      {dialog}
      <h1>Profile</h1>
      <div className="card">
        <p><strong>Name:</strong> {name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        {!editing ? (
          <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit</button>
        ) : (
          <div className="actions">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-primary" onClick={() => setEditing(false)}>Save</button>
            <button className="btn btn-ghost" onClick={() => { setName(user?.name || ""); setEditing(false); }}>Cancel</button>
          </div>
        )}
      </div>
      <div className="stats-grid">
        {user?.role === "grower" ? (
          <>
            <div className="stat">Plantations: {mine.length}</div>
            <div className="stat">Crops: {mineCrops.length}</div>
            <div className="stat">Harvests: {mineHarvests.length}</div>
            <div className="stat">Packings: {minePackings.length}</div>
          </>
        ) : (
          <>
            <div className="stat">Batches Created: {mineBatches.length}</div>
            <div className="stat">Packings Managed: {minePackings.length}</div>
          </>
        )}
      </div>
      {mineImages.length > 0 && (
        <div className="card">
          <h3>Process Image Gallery</h3>
          {stages.map((stage) => {
            const list = mineImages.filter((img) => img.stage === stage);
            if (!list.length) return null;
            return (
              <div key={stage} className="gallery-group">
                <h4>{stage}</h4>
                <ul className="records">
                  {list.map((img) => <li key={img.id}>{img.name} ({img.date}) <button className="link-danger" onClick={() => removeImage(img.id)}>Delete</button></li>)}
                </ul>
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
  if (!batch) return <div className="page-container"><h1>Batch Not Found</h1></div>;
  const pk = packings.find((p) => p.id === batch.packingIds[0]);
  const har = pk ? harvests.find((h) => h.id === pk.harvestId) : null;
  const crop = har ? crops.find((c) => c.id === har.cropId) : null;
  const plantation = pk ? plantations.find((p) => p.id === pk.plantationId) : null;
  const isShrimp = plantation?.type === "shrimp";
  const retailSizeMap = { Tomato: 1, Spinach: 0.5, Coriander: 0.25, Lettuce: 0.3, Cabbage: 1, Cauliflower: 1, Carrot: 0.5, Beetroot: 0.5, Capsicum: 0.5, Okra: 0.5, Brinjal: 0.5, "French Beans": 0.5, "Green Gram": 1 };
  const retailSize = isShrimp ? 1 : (retailSizeMap[crop?.name] || 1);
  const totalRetail = Math.floor((batch.totalWeight || 0) / retailSize);
  const xMap = {
    Tomato: ["Fruit Firmness: 7.2 N", "Brix Sweetness: 4.8 Bx", "Lycopene: 85 mg/kg", "Pest Resistance: 0.89"],
    Brinjal: ["Glossiness: 92%", "Anthocyanin: 120 mg/kg", "Pest Resistance: 0.82"],
    Spinach: ["Iron: 27 mg/kg", "Nitrate: 1800 mg/kg", "Chlorophyll: 48 SPAD"],
    "Green Gram": ["Protein: 24.5%", "Germination: 95%", "Moisture: 10.2%"],
  };
  const xfactor = isShrimp ? ["Avg Size: 30-40 count/kg", "FCR: 1.4:1", "Culture Period: 90-120 days", "Survival Rate: 80-85%"] : (xMap[crop?.name] || ["Quality Score: A+", "Pest Resistance: 0.85"]);

  return (
    <div className="trace-page trace-public">
      <div className="trace-card hero-card">
        <h2>{crop?.name || "Agricultural Product"}</h2>
        <p>Variety: {crop?.variety || "-"} | Harvested: {har?.harvestDate || "-"} | Origin: {plantation?.location || "-"} | Batch: {batch.id}</p>
      </div>
      <div className="trace-card"><h3>Farmer Information</h3><p>{plantation?.name || "Unknown Farm"} | {isShrimp ? "Aquaculture Farm" : "Organic Farming Cooperative"}</p></div>
      <div className="trace-card"><h3>Farm Location</h3><p>{plantation?.location || "-"} | Area: 2.5 hectares | Active</p></div>
      <div className="trace-card"><h3>{isShrimp ? "Water & Environment Data" : "Sustainability Data"}</h3><p>{isShrimp ? "pH 7.5-8.5, O2 >= 5mg/L, Salinity 15-25ppt, Antibiotic: Passed" : "Water 1100 L/kg, Soil pH 6.8, Organic Carbon 1.2%, NDVI 0.78, CO2 0.4 kg CO2e"}</p></div>
      <div className="trace-card"><h3>Crop-Specific X-Factor</h3><ul className="records">{xfactor.map((x) => <li key={x}>{x}</li>)}</ul></div>
      <div className="trace-card"><h3>Certifications</h3><p>{isShrimp ? "MPEDA / BAP Certified" : "India Organic Certified"} | Valid Until: Dec 2025</p></div>
      <div className="trace-card"><h3>Harvest Data</h3><p>{har?.harvestDate || "-"} | Total: {har?.total || 0} {har?.unit || "kg"} | Accepted: {har?.accepted || 0} | Rejected: {har?.rejected || 0}</p></div>
      <div className="trace-card"><h3>Bulk Packing Details</h3><p>{pk?.packingDate || "-"} | {pk?.numPackages || 0} x {pk?.packingSize || "-"} | Net: {pk?.netWeight || 0} kg | {pk?.warehouse || "-"}</p></div>
      <div className="trace-card"><h3>Supplier Packing (Retail)</h3><p>Batch: {batch.id} | Bulk: {batch.totalWeight} kg | Packet Size: {retailSize} kg | Total Retail Packets: {totalRetail} | Type: {isShrimp ? "IQF / Frozen Pack" : "Consumer Ready"} | QC: Passed</p></div>
      <div className="trace-card"><h3>Traceability Timeline</h3><p>Crop Planted: {crop?.sowingDate || "Pending"} | Harvested: {har?.harvestDate || "Pending"} | Bulk Packed: {pk?.packingDate || "Pending"} | Supplier Packing: {batch.createdAt} | Transported: {batch.createdAt} | Delivered: Pending</p></div>
      <div className="trace-card"><h3>Batch Summary</h3><p>{batch.id} | {batch.totalWeight} kg | {batch.description || "-"} | {batch.createdAt} | Items: {batch.packingIds.length}</p></div>
      <div className="trace-card"><h3>Data Verification</h3><p>Verified By: MaatiAI System | Last Updated: {new Date().toLocaleString()} | Status: Verified</p></div>
      <div className="actions"><button className="btn btn-primary">View Harvest Photos</button><button className="btn btn-outline">Watch Farmer Story</button></div>
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


