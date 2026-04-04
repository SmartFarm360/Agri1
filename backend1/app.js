const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/mongo");
const path = require("path");
const cors = require("cors");
const axios = require("axios");

dotenv.config();
connectDB();

const app = express();
const traceabilityRoutes = require('./modules/traceability/routes');
app.set("trust proxy", 1);

/* =========================
   🔥 CORS (FINAL – STABLE)
   ========================= */
const allowedOrigins = [
  "https://agri1-1.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* =========================
   BODY PARSERS
   ========================= */
// NOTE: traceability camera uploads can include base64 data URLs (large payloads).
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= LOCATION SEARCH ================= */
app.get("/api/location/search", async (req, res) => {
  const query = req.query.q;

  if (!query || query.length < 3) {
    return res.status(200).json([]);
  }

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          addressdetails: 1,
          limit: 5,
        },
        headers: {
          "User-Agent": "MaatiAI/1.0 (contact@maati.ai)",
          "Accept-Language": "en",
        },
        timeout: 8000,
      }
    );

    return res.status(200).json(response.data);
  } catch (err) {
    console.error("Nominatim error:", err.message);
    return res.status(200).json([]);
  }
});

/* ================= LOCATION REVERSE ================= */
app.get("/api/location/reverse", async (req, res) => {
  const lat = req.query.lat;
  const lon = req.query.lon;

  if (lat === undefined || lon === undefined) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
    return res.status(400).json({ error: "Invalid lat/lon" });
  }

  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          format: "jsonv2",
          lat: latNum,
          lon: lonNum,
          zoom: 18,
          addressdetails: 1,
        },
        headers: {
          "User-Agent": "MaatiAI/1.0 (contact@maati.ai)",
          "Accept-Language": "en",
        },
        timeout: 8000,
      }
    );

    return res.status(200).json({
      display_name: response.data?.display_name || "Address unavailable",
      raw: response.data || null,
    });
  } catch (err) {
    console.error("Nominatim reverse error:", err.message);
    return res.status(200).json({ display_name: "Address unavailable", raw: null });
  }
});

/* ================= ROUTES ================= */
app.use('/api/traceability', traceabilityRoutes);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/blogs", require("./routes/blogRoutes"));
app.use("/api/help", require("./routes/helpRoutes"));
app.use("/api", require("./routes/sensorRoutes"));
app.use("/api/ml", require("./routes/mlRoutes"));
app.use("/api/images", require("./routes/imageRoutes"));
app.use("/api/farmer", require("./routes/farmerRoutes"));

app.get("/", (req, res) => {
  res.status(200).json({ status: "API Running OK" });
});

module.exports = app;
