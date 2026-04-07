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
let usersRoleConstraintReady = false;
let supplierProfileTableReady = false;

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  return String(value || "")
    .trim()
    .toLowerCase() === "true";
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeSupplierArea = (area = {}) => {
  const cropsHandled = Array.isArray(area.cropsHandled)
    ? area.cropsHandled
    : Array.isArray(area.crops_handled)
      ? area.crops_handled
      : [];

  return {
    village: String(area.village || "").trim(),
    district: String(area.district || "").trim(),
    state: String(area.state || "").trim(),
    pincode: String(area.pincode || "").trim(),
    cropsHandled: cropsHandled
      .map((crop) => String(crop || "").trim())
      .filter(Boolean),
    sourcingType: String(area.sourcingType || area.sourcing_type || "").trim(),
    avgDailyVolume: String(
      area.avgDailyVolume || area.avg_daily_volume || "",
    ).trim(),
  };
};

const isSupplierAreaValid = (area) =>
  Boolean(
    area.village &&
      area.district &&
      area.state &&
      area.pincode &&
      area.sourcingType &&
      area.avgDailyVolume &&
      area.cropsHandled.length > 0,
  );

const ensureUsersRoleConstraint = async (db) => {
  if (usersRoleConstraintReady) return;

  const expectedRoles = ["farmer", "admin", "drone_controller", "supplier"];
  const result = await db.query(`
    SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'users'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%role%'
  `);

  const existingConstraint = result.rows.find((row) =>
    expectedRoles.every((roleName) =>
      String(row.definition || "").toLowerCase().includes(`'${roleName}'`),
    ),
  );

  if (existingConstraint) {
    usersRoleConstraintReady = true;
    return;
  }

  for (const row of result.rows) {
    await db.query(
      `ALTER TABLE public.users DROP CONSTRAINT IF EXISTS "${row.conname}"`,
    );
  }

  await db.query(`
    ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('farmer', 'admin', 'drone_controller', 'supplier'))
  `);

  usersRoleConstraintReady = true;
};

const resolveUserNameColumn = async (db) => {
  if (cachedUserNameColumn) return cachedUserNameColumn;

  const result = await db.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name IN ('username', 'full_name', 'name')
    ORDER BY CASE
      WHEN column_name = 'username' THEN 0
      WHEN column_name = 'full_name' THEN 1
      ELSE 2
    END
    LIMIT 1
    `
  );

  if (result.rows.length === 0) {
    throw new Error("Missing username/full_name/name column in users table");
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

const ensureSupplierProfileTable = async (db) => {
  if (supplierProfileTableReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS public.supplier_profiles (
      supplier_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      supplier_type VARCHAR(100) NOT NULL,
      village VARCHAR(150),
      district VARCHAR(150),
      state VARCHAR(150),
      pincode VARCHAR(20),
      crops_handled TEXT[],
      sourcing_type VARCHAR(150),
      avg_daily_volume VARCHAR(50),
      has_transport BOOLEAN DEFAULT false,
      transport_type VARCHAR(100),
      storage_facility BOOLEAN DEFAULT false,
      storage_type VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT supplier_profiles_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users (user_id)
        ON DELETE CASCADE
    )
  `);

  await db.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'supplier_profiles'
          AND column_name = 'supplier_profile_id'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'supplier_profiles'
          AND column_name = 'supplier_id'
      ) THEN
        ALTER TABLE public.supplier_profiles
        RENAME COLUMN supplier_profile_id TO supplier_id;
      END IF;
    END $$;
  `);

  await db.query(`
    ALTER TABLE public.supplier_profiles
    ADD COLUMN IF NOT EXISTS supplier_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS village VARCHAR(150),
    ADD COLUMN IF NOT EXISTS district VARCHAR(150),
    ADD COLUMN IF NOT EXISTS state VARCHAR(150),
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
    ADD COLUMN IF NOT EXISTS crops_handled TEXT[],
    ADD COLUMN IF NOT EXISTS sourcing_type VARCHAR(150),
    ADD COLUMN IF NOT EXISTS avg_daily_volume VARCHAR(50),
    ADD COLUMN IF NOT EXISTS has_transport BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS transport_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS storage_facility BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS storage_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  await db.query(`
    DO $$
    DECLARE user_id_unique_constraint TEXT;
    BEGIN
      SELECT con.conname
      INTO user_id_unique_constraint
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      JOIN pg_attribute att
        ON att.attrelid = rel.oid
       AND att.attnum = con.conkey[1]
      WHERE nsp.nspname = 'public'
        AND rel.relname = 'supplier_profiles'
        AND con.contype = 'u'
        AND array_length(con.conkey, 1) = 1
        AND att.attname = 'user_id'
      LIMIT 1;

      IF user_id_unique_constraint IS NOT NULL THEN
        EXECUTE format(
          'ALTER TABLE public.supplier_profiles DROP CONSTRAINT %I',
          user_id_unique_constraint
        );
      END IF;
    END $$;
  `);

  await db.query(`
    ALTER TABLE public.supplier_profiles
    DROP COLUMN IF EXISTS aadhaar_number,
    DROP COLUMN IF EXISTS license_number,
    DROP COLUMN IF EXISTS document_urls,
    DROP COLUMN IF EXISTS is_verified
  `);

  supplierProfileTableReady = true;
};

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  let { name, email, mob: mobile, password, confirmPassword, role } = req.body;
  const landDocumentFile = req.files?.landDocument?.[0] || null;

  role = role?.trim().toLowerCase().replace(/\s+/g, "_");

  const allowedRoles = ["farmer", "admin", "drone_controller", "supplier"];
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
    await ensureUsersRoleConstraint(client);

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

      if (!landDocumentFile) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Land document required" });
      }

      const fileName = `land-documents/${Date.now()}-${landDocumentFile.originalname}`;
      const backblazeUrl = await uploadToBackblaze(
        fileName,
        landDocumentFile.buffer,
        landDocumentFile.mimetype
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

    if (role === "supplier") {
      const supplierType = String(
        req.body.supplierType || req.body.supplier_type || "",
      ).trim();
      const hasTransport =
        req.body.hasTransport ?? req.body.has_transport ?? false;
      const transportType = String(
        req.body.transportType || req.body.transport_type || "",
      ).trim();
      const storageFacility =
        req.body.storageFacility ?? req.body.storage_facility ?? false;
      const storageType = String(
        req.body.storageType || req.body.storage_type || "",
      ).trim();
      const parsedOperatingAreas = parseJsonArray(
        req.body.operatingAreas || req.body.operating_areas,
      ).map(normalizeSupplierArea);

      if (!supplierType) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Supplier type is required." });
      }

      if (!Array.isArray(parsedOperatingAreas) || parsedOperatingAreas.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Supplier operating areas are required." });
      }

      if (!parsedOperatingAreas.every(isSupplierAreaValid)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Each supplier operating area must include location, crops handled, sourcing type, and average daily volume.",
        });
      }

      await ensureSupplierProfileTable(client);

      for (const area of parsedOperatingAreas) {
        await client.query(
          `
          INSERT INTO public.supplier_profiles
          (
            user_id,
            supplier_type,
            village,
            district,
            state,
            pincode,
            crops_handled,
            sourcing_type,
            avg_daily_volume,
            has_transport,
            transport_type,
            storage_facility,
            storage_type
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          `,
          [
            userId,
            supplierType,
            area.village || null,
            area.district || null,
            area.state || null,
            area.pincode || null,
            area.cropsHandled,
            area.sourcingType || null,
            area.avgDailyVolume || null,
            parseBoolean(hasTransport),
            transportType || null,
            parseBoolean(storageFacility),
            storageType || null,
          ],
        );
      }
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
    console.error("Registration Error:", err);
    const message =
      err?.message === "Backblaze upload failed."
        ? "Document upload failed. Please try again."
        : "Registration failed";
    res.status(500).json({ message });
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
      `SELECT ${userNameColumn} AS username, email, role, created_at FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    res.json({
      user_id: userId,
      role: user.role,
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
