const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  register, 
  login, 
  logout, 
  sendOTP, 
  verifyOTP, 
  getProfile,
  updateProfile
} = require('../controllers/authController');
const { cropImageUpload, landDocumentUpload } = require('../middleware/backBlazeUpload');

// Register Route
router.post('/register', landDocumentUpload.single('landDocument'), register);

// Login/Logout Routes
router.post('/login', login);
router.post('/logout', authMiddleware, logout);

// OTP Routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

//  Protected Route to Get Profile
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);


module.exports = router;
