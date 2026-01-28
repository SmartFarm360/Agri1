const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/mongo");
const path = require("path");
const cors = require("cors");
const axios = require("axios");

dotenv.config();
connectDB();

const app = express();

/* =========================
   🔥 CORS
   ========================= */
app.set("trust proxy", 1);

const allowedOrigins = [
  "https://agri1-frontend.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
  }),
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= LOCATION SEARCH (FIXED) ================= */
app.get("/api/location/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const axios = require("axios");

    app.get("/api/location/search", async (req, res) => {
      try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const response = await axios.get(
          "https://nominatim.openstreetmap.org/search",
          {
            params: {
              format: "json",
              q: query,
            },
            headers: {
              "User-Agent": "MaatiAI/1.0 (contact@maati.ai)",
            },
            timeout: 5000,
          },
        );

        res.json(response.data.slice(0, 5));
      } catch (err) {
        console.error("Nominatim error:", err.message);
        res.status(500).json({ message: "Location fetch failed" });
      }
    });

    res.json(response.data.slice(0, 5));
  } catch (err) {
    console.error("Nominatim error:", err.message);
    res.status(500).json({ message: "Location fetch failed" });
  }
});

/* ================= ROUTES ================= */
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
