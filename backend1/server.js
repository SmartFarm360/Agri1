const app = require("./app");
const multer = require("multer");
const exifr = require("exifr");

const farmRoutes = require("./routes/farmRoutes");


const upload = multer();

const PORT = process.env.PORT || 5000;

/* ================= IMAGE GPS ROUTE ================= */
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const gps = await exifr.gps(req.file.buffer);

    if (gps && gps.latitude && gps.longitude) {
      res.json({
        message: "GPS coordinates extracted",
        latitude: gps.latitude,
        longitude: gps.longitude,
      });
    } else {
      res.json({ message: "No GPS data found in image" });
    }
  } catch (err) {
    console.error("GPS extract error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= FARM ROUTES ================= */
app.use("/api/farm", farmRoutes);


/* ================= SERVER START ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
