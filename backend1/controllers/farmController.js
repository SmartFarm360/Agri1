const pool = require("../config/db");

// CREATE NEW FARM
exports.createFarm = async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { farm_name, latitude, longitude, area_hectares, boundary } =
      req.body;

    // validation
    if (
      !farm_name ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      typeof area_hectares !== "number"
    ) {
      return res.status(400).json({
        message: "Missing or invalid farm data",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO farms
      (
        user_id,
        farm_name,
        latitude,
        longitude,
        area_hectares,
        boundary
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,

      [userId, farm_name, latitude, longitude, area_hectares, boundary || null],
    );

    res.status(201).json({
      message: "Farm created successfully",
      farm: result.rows[0],
    });
  } catch (error) {
    console.error("Create Farm Error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// GET ALL FARMS OF LOGGED USER
exports.getMyFarms = async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM farms
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,

      [userId],
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get Farms Error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// GET SINGLE FARM
exports.getFarmById = async (req, res) => {
  try {
    const farmId = req.params.id;

    const result = await pool.query(
      `
      SELECT *
      FROM farms
      WHERE farm_id = $1
      `,

      [farmId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Farm not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Get Farm Error:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
