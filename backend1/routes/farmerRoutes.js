const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const farmerLocationController = require("../controllers/farmerLocationController");

// 🔥 CORS HEADER MIDDLEWARE (route-level, minimal)
const allowCors = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
};

// POST: Save location
router.post(
  "/location",
  allowCors,
  authMiddleware,
  farmerLocationController.saveLocation,
);

// GET: Fetch location
router.get(
  "/location",
  allowCors,
  authMiddleware,
  farmerLocationController.getLocation,
);

module.exports = router;
