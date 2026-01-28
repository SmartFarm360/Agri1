const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const farmerLocationController = require("../controllers/farmerLocationController");

// ✅ HANDLE CORS PREFLIGHT (CRITICAL)
router.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  return res.sendStatus(204);
});

// POST: Save location
router.post(
  "/location",
  authMiddleware,
  farmerLocationController.saveLocation
);

// GET: Fetch location
router.get(
  "/location",
  authMiddleware,
  farmerLocationController.getLocation
);

module.exports = router;
