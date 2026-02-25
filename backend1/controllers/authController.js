const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pool = require("../config/db");
const { uploadToBackblaze } = require("../middleware/backBlazeUpload");
require("dotenv").config();

let blacklistedTokens = [];
exports.isTokenBlacklisted = (token) => blacklistedTokens.includes(token);
let cachedUserNameColumn = null;
let cachedDroneProfileTable = null;

const resolveUserNameColumn = async (db) => {
  if (cachedUserNameColumn) return cachedUserNameColumn;

  const result = await db.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name IN ('username', 'name')
    ORDER BY CASE WHEN column_name = 'username' THEN 0 ELSE 1 END
    LIMIT 1
    `
  );

  if (result.rows.length === 0) {
    throw new Error("Missing name column in users table");
  }

  cachedUserNameColumn = result.rows[0].column_name;
  return cachedUserNameColumn;
};

const resolveDroneProfileTable = async (db) => {
  if (cachedDroneProfileTable) return cachedDroneProfileTable;

  const result = await db.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('drone_controller_profiles', 'drone_profiles')
    ORDER BY CASE WHEN table_name = 'drone_controller_profiles' THEN 0 ELSE 1 END
    LIMIT 1
    `
  );

  if (result.rows.length === 0) {
    throw new Error("Missing drone profile table");
  }

  cachedDroneProfileTable = result.rows[0].table_name;
  return cachedDroneProfileTable;
};

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  let { name, email, mob: mobile, password, confirmPassword, role } = req.body;

  role = role?.trim().toLowerCase().replace(/\s+/g, "_");

  const allowedRoles = ["farmer", "admin", "drone_controller"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role provided." });
  }

  const client = await pool.connect();

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    await client.query("BEGIN");

    const hashedPassword = await bcrypt.hash(password, 10);
    const userNameColumn = await resolveUserNameColumn(client);

    const userResult = await client.query(
      `
      INSERT INTO users (${userNameColumn}, email, mob, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id
      `,
      [name, email, mobile, hashedPassword, role]
    );

    const userId = userResult.rows[0].user_id;

    if (role === "farmer") {
      const { landSize, location, experience, cropType, latitude, longitude } =
        req.body;

      if (!req.file) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Land document required" });
      }

      const fileName = `land-documents/${Date.now()}-${req.file.originalname}`;
      const backblazeUrl = await uploadToBackblaze(
        fileName,
        req.file.buffer,
        req.file.mimetype
      );

      await client.query(
        `
        INSERT INTO farmer_profiles
        (user_id, farm_location, latitude, longitude, land_size, crop_type, experience, land_document_url)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          userId,
          location,
          Number(latitude),
          Number(longitude),
          landSize,
          cropType,
          experience,
          backblazeUrl,
        ]
      );
    }

    if (role === "drone_controller") {
      const { licenseId, baseLocation, availableDrones, flightExperience } =
        req.body;
      const droneProfileTable = await resolveDroneProfileTable(client);

      await client.query(
        `
        INSERT INTO ${droneProfileTable}
        (user_id, license_id, base_location, available_drones, flight_experience)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [userId, licenseId, baseLocation, availableDrones, flightExperience]
      );
    }

    await client.query("COMMIT");

    const token = jwt.sign(
      { user_id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "User registered", token });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Registration Error:", err.message);
    res.status(500).json({ message: "Registration failed" });
  } finally {
    client.release();
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Login error" });
  }
};

/* ================= LOGOUT (FIXED) ================= */
exports.logout = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) blacklistedTokens.push(token);
  res.status(200).json({ message: "Logged out successfully" });
};

/* ================= OTP (FIXED) ================= */
exports.sendOTP = async (req, res) => {
  res.status(200).json({ message: "OTP sent (stub)" });
};

exports.verifyOTP = async (req, res) => {
  res.status(200).json({ message: "OTP verified (stub)" });
};

/* ================= PROFILE ================= */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userNameColumn = await resolveUserNameColumn(pool);

    const result = await pool.query(
      `SELECT ${userNameColumn} AS username, email, created_at FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    res.json({
      name: user.username,
      email: user.email,
      created_at: user.created_at,
    });
  } catch (err) {
    res.status(500).json({ message: "Profile fetch error" });
  }
};

/* ================= UPDATE PROFILE ================= */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, email, password } = req.body;
    const userNameColumn = await resolveUserNameColumn(pool);

    let query, values;

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query = `
        UPDATE users SET ${userNameColumn}=$1, email=$2, password_hash=$3
        WHERE user_id=$4 RETURNING ${userNameColumn} AS username,email,created_at
      `;
      values = [name, email, hash, userId];
    } else {
      query = `
        UPDATE users SET ${userNameColumn}=$1, email=$2
        WHERE user_id=$3 RETURNING ${userNameColumn} AS username,email,created_at
      `;
      values = [name, email, userId];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = result.rows[0];
    res.json({
      name: updatedUser.username,
      email: updatedUser.email,
      created_at: updatedUser.created_at,
    });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};
