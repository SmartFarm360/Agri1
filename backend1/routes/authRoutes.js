const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// ✅ FIX 1: Import controller as OBJECT (prevents undefined)
const authController = require("../controllers/authController");

// ✅ FIX 2: Proper destructuring from backBlazeUpload
const { landDocumentUpload } = require("../middleware/backBlazeUpload");

// ================= REGISTER =================
router.post(
  "/register",
  landDocumentUpload.single("landDocument"),
  authController.register
);

// ================= LOGIN / LOGOUT =================
router.post("/login", authController.login);
router.post("/logout", authMiddleware, authController.logout);

// ================= OTP =================
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

// ================= PROFILE =================
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);

module.exports = router;
