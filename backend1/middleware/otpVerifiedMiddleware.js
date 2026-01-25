const pool = require('../config/db');

const otpVerifiedCheck = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required for OTP verification." });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM otp_codes WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      return res.status(403).json({ message: 'Please verify your OTP before registering.' });
    }

    // Proceed if no OTP is pending (i.e. OTP has been verified and deleted)
    next();
  } catch (error) {
    console.error("OTP check failed:", error.message);
    return res.status(500).json({ message: 'Internal server error during OTP check.' });
  }
};

module.exports = otpVerifiedCheck;
