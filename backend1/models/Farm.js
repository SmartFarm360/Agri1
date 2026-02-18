const pool = require("../config/db");

const Farm = {

  // CREATE FARM
  async createFarm(farmData) {

    const query = `
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
    `;

    const values = [
      farmData.user_id,
      farmData.farm_name,
      farmData.latitude,
      farmData.longitude,
      farmData.area_hectares,
      farmData.boundary || null
    ];

    const result = await pool.query(query, values);

    return result.rows[0];

  },


  // GET FARMS OF USER
  async getFarmsByUser(user_id) {

    const query = `
      SELECT *
      FROM farms
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [user_id]);

    return result.rows;

  },


  // GET SINGLE FARM
  async getFarmById(farm_id) {

    const query = `
      SELECT *
      FROM farms
      WHERE farm_id = $1
    `;

    const result = await pool.query(query, [farm_id]);

    return result.rows[0];

  }

};

module.exports = Farm;
