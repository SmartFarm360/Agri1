const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const authController = require("../controllers/authController");
const { registerDocumentUpload } = require("../middleware/backBlazeUpload");

/* ✅ FIX: allow preflight */
router.options("/register", (req, res) => {
  res.sendStatus(204);
});

/* REGISTER */
router.post(
  "/register",
  registerDocumentUpload.fields([
    { name: "landDocument", maxCount: 1 },
  ]),
  authController.register
);

/* LOGIN */
router.post("/login", authController.login);

/* LOGOUT */
router.post("/logout", authMiddleware, authController.logout);

/* OTP */
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

/* PROFILE */
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/profile", authMiddleware, authController.updateProfile);

module.exports = router;
