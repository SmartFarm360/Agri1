import { useState, useEffect, useContext, createContext } from "react";
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
  ],
  monitoring: [],
  verification: [],
  harvests: [],
  packings: [],
  batches: [],
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

  return (
    <DataContext.Provider value={{ plantations, crops, monitoring, verification, harvests, packings, batches, addPlantation, delPlantation, addCrop, delCrop, addMonitoring, delMonitoring, addVerification, delVerification, addHarvest, delHarvest, addPacking, delPacking, addBatch, delBatch }}>
      {children}
    </DataContext.Provider>
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const raw = localStorage.getItem("tc_user"); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });

  const signIn = (email, password) => new Promise((resolve, reject) => {
    const found = DUMMY_ACCOUNTS.find((a) => a.email === email && a.password === password);
    if (!found) { reject("Invalid email or password"); return; }
    const u = { id: found.id, name: found.name, email: found.email, role: found.role };
    setUser(u);
    localStorage.setItem("tc_user", JSON.stringify(u));
    resolve(u);
  });
  const signUp = (name, email, password, role) => new Promise((resolve, reject) => {
    if (DUMMY_ACCOUNTS.some((a) => a.email === email)) { reject("Email already exists"); return; }
    const newUser = { id: `u${Date.now()}`, name, email, password, role };
    DUMMY_ACCOUNTS.push(newUser);
    const u = { id: newUser.id, name, email, role };
    setUser(u);
    localStorage.setItem("tc_user", JSON.stringify(u));
    resolve(u);
  });
  const signOut = () => { setUser(null); localStorage.removeItem("tc_user"); };
  const signInWithGoogle = () => { const u = { id: "u_google", name: "Google User", email: "google@user.com", role: "grower" }; setUser(u); localStorage.setItem("tc_user", JSON.stringify(u)); };

  return <AuthContext.Provider value={{ user, signIn, signUp, signOut, signInWithGoogle }}>{children}</AuthContext.Provider>;
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
    const id = Date.now();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
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

function AuthModal({ onClose, toast }) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
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
          <button className="btn btn-outline" onClick={signInWithGoogle}>Continue with Google</button>
          <button className="btn btn-primary" onClick={submit}>{mode === "signin" ? "Sign In" : "Create Account"}</button>
        </div>
      </div>
    </div>
  );
}

function HomePage({ navigate, toast }) {
  const [showAuth, setShowAuth] = useState(false);
  const { user } = useAuth();
  useEffect(() => { if (user) navigate(user.role === "grower" ? "/grower" : "/supplier"); }, [user, navigate]);
  return (
    <div className="home-page">
      <div className="home-nav">
        <div className="brand">Seed-to-Batch</div>
        <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Sign In</button>
      </div>
      <div className="hero">
        <h1>From Seed to Batch</h1>
        <p>Complete agricultural lifecycle management and traceability.</p>
        <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Get Started</button>
      </div>
      <div className="features-grid">
        <div className="card"><h3>Crop Lifecycle</h3><p>Track from sowing to harvest.</p></div>
        <div className="card"><h3>Batch Management</h3><p>Create traceable supplier batches.</p></div>
        <div className="card"><h3>Analytics</h3><p>Get actionable operational insights.</p></div>
      </div>
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

  return (
    <div className="page-container">
      <h1>Grower Dashboard</h1>
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
            <div className="actions">
              <button className="btn btn-outline" onClick={() => navigate(`/plantation/${p.id}`)}>Open</button>
              <button className="btn btn-danger" onClick={() => { delPlantation(p.id); toast("Deleted", "success"); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowStep({ title, children }) {
  return <div className="card"><h3>{title}</h3>{children}</div>;
}

function PlantationDetail({ plantationId, toast }) {
  const { plantations, crops, monitoring, verification, harvests, packings, addCrop, delCrop, addMonitoring, delMonitoring, addVerification, delVerification, addHarvest, delHarvest, addPacking, delPacking } = useData();
  const [step, setStep] = useState(0);
  const plantation = plantations.find((p) => p.id === plantationId);
  const pCrops = crops.filter((c) => c.plantationId === plantationId);
  const pMon = monitoring.filter((m) => m.plantationId === plantationId);
  const pVer = verification.filter((v) => v.plantationId === plantationId);
  const pHar = harvests.filter((h) => h.plantationId === plantationId);
  const pPack = packings.filter((pk) => pk.plantationId === plantationId);
  const unlocked = [true, pCrops.length > 0, pMon.length > 0, pVer.length > 0, pHar.length > 0];
  const names = ["Crops", "Monitoring", "Verification", "Harvest", "Packing"];
  if (!plantation) return <div className="page-container">Plantation not found.</div>;

  return (
    <div className="page-container">
      <h1>{plantation.name}</h1>
      <div className="step-bar">
        {names.map((n, i) => (
          <button key={n} className={step === i ? "step active" : "step"} onClick={() => unlocked[i] ? setStep(i) : toast(`Complete ${names[i - 1]} first`, "error")}>{n}</button>
        ))}
      </div>
      {step === 0 && <CropsStep pCrops={pCrops} addCrop={addCrop} delCrop={delCrop} plantationId={plantationId} />}
      {step === 1 && <MonitoringStep pMon={pMon} addMonitoring={addMonitoring} delMonitoring={delMonitoring} pCrops={pCrops} plantationId={plantationId} />}
      {step === 2 && <VerificationStep pVer={pVer} addVerification={addVerification} delVerification={delVerification} pCrops={pCrops} plantationId={plantationId} />}
      {step === 3 && <HarvestStep pHar={pHar} addHarvest={addHarvest} delHarvest={delHarvest} pCrops={pCrops} plantationId={plantationId} />}
      {step === 4 && <PackingStep pPack={pPack} pHar={pHar} addPacking={addPacking} delPacking={delPacking} plantationId={plantationId} />}
    </div>
  );
}

function CropsStep({ pCrops, addCrop, delCrop, plantationId }) {
  const [f, setF] = useState({ name: "", variety: "", sowingDate: TODAY, expectedHarvest: "" });
  return (
    <WorkflowStep title="Add Crop">
      <div className="form-row">
        <input className="input" placeholder="Crop Name" value={f.name} onChange={(e) => setF((x) => ({ ...x, name: e.target.value }))} />
        <input className="input" placeholder="Variety" value={f.variety} onChange={(e) => setF((x) => ({ ...x, variety: e.target.value }))} />
        <input className="input" type="date" value={f.sowingDate} onChange={(e) => setF((x) => ({ ...x, sowingDate: e.target.value }))} />
        <input className="input" type="date" value={f.expectedHarvest} onChange={(e) => setF((x) => ({ ...x, expectedHarvest: e.target.value }))} />
        <button className="btn btn-primary" onClick={() => { if (!f.name || !f.variety) return; addCrop({ plantationId, ...f }); setF({ name: "", variety: "", sowingDate: TODAY, expectedHarvest: "" }); }}>Add</button>
      </div>
      <ul className="records">{pCrops.map((c) => <li key={c.id}>{c.name} ({c.variety}) <button className="link-danger" onClick={() => delCrop(c.id)}>Delete</button></li>)}</ul>
    </WorkflowStep>
  );
}

function MonitoringStep({ pMon, addMonitoring, delMonitoring, pCrops, plantationId }) {
  const [f, setF] = useState({ date: TODAY, inputType: "", cropId: "", remarks: "" });
  return (
    <WorkflowStep title="Add Monitoring Record">
      <div className="form-row">
        <input className="input" type="date" value={f.date} onChange={(e) => setF((x) => ({ ...x, date: e.target.value }))} />
        <input className="input" placeholder="Input Type" value={f.inputType} onChange={(e) => setF((x) => ({ ...x, inputType: e.target.value }))} />
        <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
          <option value="">Select Crop</option>
          {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="input" placeholder="Remarks" value={f.remarks} onChange={(e) => setF((x) => ({ ...x, remarks: e.target.value }))} />
        <button className="btn btn-primary" onClick={() => { if (!f.inputType || !f.cropId) return; addMonitoring({ plantationId, ...f }); setF({ date: TODAY, inputType: "", cropId: "", remarks: "" }); }}>Add</button>
      </div>
      <ul className="records">{pMon.map((m) => <li key={m.id}>{m.inputType} - {m.date} <button className="link-danger" onClick={() => delMonitoring(m.id)}>Delete</button></li>)}</ul>
    </WorkflowStep>
  );
}

function VerificationStep({ pVer, addVerification, delVerification, pCrops, plantationId }) {
  const [f, setF] = useState({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true });
  return (
    <WorkflowStep title="Add Verification">
      <div className="form-row">
        <input className="input" type="date" value={f.inspectionDate} onChange={(e) => setF((x) => ({ ...x, inspectionDate: e.target.value }))} />
        <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
          <option value="">Select Crop</option>
          {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={f.health} onChange={(e) => setF((x) => ({ ...x, health: e.target.value }))}>
          <option>Excellent</option><option>Good</option><option>Moderate</option><option>Poor</option>
        </select>
        <select className="input" value={f.approved ? "yes" : "no"} onChange={(e) => setF((x) => ({ ...x, approved: e.target.value === "yes" }))}>
          <option value="yes">Approved</option><option value="no">Not Approved</option>
        </select>
        <button className="btn btn-primary" onClick={() => { if (!f.cropId) return; addVerification({ plantationId, ...f }); setF({ inspectionDate: TODAY, cropId: "", health: "Good", approved: true }); }}>Add</button>
      </div>
      <ul className="records">{pVer.map((v) => <li key={v.id}>{v.health} ({v.approved ? "Approved" : "Not Approved"}) <button className="link-danger" onClick={() => delVerification(v.id)}>Delete</button></li>)}</ul>
    </WorkflowStep>
  );
}

function HarvestStep({ pHar, addHarvest, delHarvest, pCrops, plantationId }) {
  const [f, setF] = useState({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" });
  const accepted = Math.max(0, (Number(f.total) || 0) - (Number(f.rejected) || 0));
  return (
    <WorkflowStep title="Record Harvest">
      <div className="form-row">
        <input className="input" type="date" value={f.harvestDate} onChange={(e) => setF((x) => ({ ...x, harvestDate: e.target.value }))} />
        <select className="input" value={f.cropId} onChange={(e) => setF((x) => ({ ...x, cropId: e.target.value }))}>
          <option value="">Select Crop</option>
          {pCrops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="input" type="number" placeholder="Total" value={f.total} onChange={(e) => setF((x) => ({ ...x, total: e.target.value }))} />
        <input className="input" type="number" placeholder="Rejected" value={f.rejected} onChange={(e) => setF((x) => ({ ...x, rejected: e.target.value }))} />
        <div className="accepted-box">Accepted: {accepted} {f.unit}</div>
        <button className="btn btn-primary" onClick={() => { if (!f.cropId || !f.total) return; addHarvest({ plantationId, ...f, total: Number(f.total), rejected: Number(f.rejected) || 0, accepted }); setF({ harvestDate: TODAY, cropId: "", total: "", unit: "kg", rejected: "" }); }}>Add</button>
      </div>
      <ul className="records">{pHar.map((h) => <li key={h.id}>{h.harvestDate} - {h.accepted} {h.unit} <button className="link-danger" onClick={() => delHarvest(h.id)}>Delete</button></li>)}</ul>
    </WorkflowStep>
  );
}

function PackingStep({ pPack, pHar, addPacking, delPacking, plantationId }) {
  const [f, setF] = useState({ packingDate: TODAY, harvestId: "", packingSize: "", numPackages: "", netWeight: "", warehouse: "", city: "", state: "" });
  return (
    <WorkflowStep title="Record Packing">
      <div className="form-row">
        <input className="input" type="date" value={f.packingDate} onChange={(e) => setF((x) => ({ ...x, packingDate: e.target.value }))} />
        <select className="input" value={f.harvestId} onChange={(e) => setF((x) => ({ ...x, harvestId: e.target.value }))}>
          <option value="">Select Harvest</option>
          {pHar.map((h) => <option key={h.id} value={h.id}>{h.harvestDate} ({h.accepted} {h.unit})</option>)}
        </select>
        <input className="input" placeholder="Packing Size" value={f.packingSize} onChange={(e) => setF((x) => ({ ...x, packingSize: e.target.value }))} />
        <input className="input" type="number" placeholder="Packages" value={f.numPackages} onChange={(e) => setF((x) => ({ ...x, numPackages: e.target.value }))} />
        <input className="input" type="number" placeholder="Net Weight" value={f.netWeight} onChange={(e) => setF((x) => ({ ...x, netWeight: e.target.value }))} />
        <button className="btn btn-primary" onClick={() => { if (!f.harvestId || !f.packingSize || !f.netWeight) return; addPacking({ plantationId, ...f, numPackages: Number(f.numPackages) || 0, netWeight: Number(f.netWeight) }); setF({ packingDate: TODAY, harvestId: "", packingSize: "", numPackages: "", netWeight: "", warehouse: "", city: "", state: "" }); }}>Add</button>
      </div>
      <ul className="records">{pPack.map((pk) => <li key={pk.id}>{pk.packingDate} - {pk.netWeight} kg <button className="link-danger" onClick={() => delPacking(pk.id)}>Delete</button></li>)}</ul>
    </WorkflowStep>
  );
}

function SupplierDashboard({ navigate, toast }) {
  const { user } = useAuth();
  const { packings, batches, addBatch, delBatch } = useData();
  const [selected, setSelected] = useState([]);
  const [desc, setDesc] = useState("");
  const mine = batches.filter((b) => b.supplierId === user?.id);
  const used = batches.flatMap((b) => b.packingIds);
  const available = packings.filter((p) => !used.includes(p.id));
  const total = selected.reduce((s, id) => s + (packings.find((p) => p.id === id)?.netWeight || 0), 0);

  return (
    <div className="page-container">
      <h1>Supplier Dashboard</h1>
      <div className="card">
        <h3>Select Packings</h3>
        <div className="records">
          {available.map((pk) => (
            <label key={pk.id} className="check-row">
              <input type="checkbox" checked={selected.includes(pk.id)} onChange={() => setSelected((s) => s.includes(pk.id) ? s.filter((x) => x !== pk.id) : [...s, pk.id])} />
              {pk.packingDate} - {pk.netWeight} kg - {pk.city || "-"}
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="form-row">
            <input className="input" placeholder="Batch description" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <button className="btn btn-primary" onClick={() => {
              const id = `PATCH-${Date.now().toString(36).toUpperCase()}`;
              addBatch({ id, supplierId: user.id, packingIds: selected, description: desc, totalWeight: total, createdAt: TODAY });
              setSelected([]); setDesc(""); toast("Batch created!", "success");
            }}>Create Batch</button>
          </div>
        )}
      </div>
      <div className="card-grid">
        {mine.map((b) => (
          <div key={b.id} className="batch-card">
            <h4>{b.id}</h4>
            <p>{b.totalWeight} kg · {b.createdAt}</p>
            <div className="actions">
              <button className="btn btn-outline" onClick={() => navigate(`/patch/${b.id}`)}>View Trace Page</button>
              <button className="btn btn-danger" onClick={() => { delBatch(b.id); toast("Deleted", "success"); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsPage() {
  const { plantations, crops, harvests } = useData();
  return (
    <div className="page-container">
      <h1>Reports</h1>
      <div className="card"><h3>Plantations</h3><div>{plantations.length}</div></div>
      <div className="card"><h3>Crops</h3><div>{crops.length}</div></div>
      <div className="card"><h3>Harvests</h3><div>{harvests.length}</div></div>
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="page-container">
      <h1>Profile</h1>
      <div className="card">
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>
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
  return (
    <div className="trace-page">
      <div className="trace-card"><h2>{crop?.name || "Agricultural Product"}</h2><p>Batch ID: {batch.id}</p></div>
      <div className="trace-card"><h3>Origin</h3><p>{plantation?.name || "-"} · {plantation?.location || "-"}</p></div>
      <div className="trace-card"><h3>Harvest</h3><p>{har?.harvestDate || "-"} · {har?.accepted || 0} {har?.unit || "kg"}</p></div>
      <div className="trace-card"><h3>Packing</h3><p>{pk?.packingDate || "-"} · {pk?.netWeight || 0} kg</p></div>
      <div className="trace-card"><h3>Batch Summary</h3><p>{batch.description || "-"} · {batch.totalWeight} kg · {batch.createdAt}</p></div>
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
  else if (route === "/plantations") page = <GrowerDashboard navigate={navigate} toast={toast} />;
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
