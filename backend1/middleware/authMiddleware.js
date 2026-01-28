const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { isTokenBlacklisted } = require("../controllers/authController");

module.exports = async function (req, res, next) {
  // ✅ ALWAYS allow CORS preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token provided, authorization denied",
    });
  }

  const token = authHeader.split(" ")[1];

  if (isTokenBlacklisted(token)) {
    return res.status(403).json({
      message: "Token is blacklisted. Please login again.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userResult = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [decoded.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
};
