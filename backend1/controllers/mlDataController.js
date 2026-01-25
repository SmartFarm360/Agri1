const pool = require('../config/db'); // PostgreSQL connection
const jwt = require('jsonwebtoken');

const storeMLData = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authorization token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user_id = decoded.user.id;

    const { grid_id, disease_detected, disease_type, ndvi_score } = req.body;

    if (!grid_id || disease_detected === undefined || !disease_type || ndvi_score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await pool.query(
      'UPDATE sensor_data SET disease_detected = $1, disease_type = $2, ndvi_score = $3 WHERE grid_id = $4 AND user_id = $5 RETURNING *',
      [disease_detected, disease_type, ndvi_score, grid_id, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Sensor data not found for this grid_id and user' });
    }

    res.status(200).json({ message: 'ML Data updated successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating ML data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getMLData = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT id, grid_id, latitude, longitude, disease_detected, disease_type, ndvi_score, created_at
             FROM sensor_data
             WHERE user_id = $1 AND disease_detected IS NOT NULL`,
            [userId]
        );

        res.status(200).json({
            message: 'ML analysis data fetched successfully',
            data: result.rows,
        });
    } catch (err) {
        console.error('Error fetching ML data:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { storeMLData, getMLData};