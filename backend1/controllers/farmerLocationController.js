const pool = require('../config/db');

// POST: Save farmer's location
exports.saveLocation = async (req, res) => {
  try {
    const userId = req.user.user_id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { latitude, longitude } = req.body;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      return res.status(400).json({
        message: 'Invalid or missing latitude/longitude',
      });
    }

    await pool.query(
      `
      INSERT INTO farmer_profiles (user_id, latitude, longitude)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude
      `,
      [userId, latitude, longitude]
    );

    res.status(200).json({ message: 'Location saved successfully' });
  } catch (error) {
    console.error('Error saving farmer location:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET: Get farmer's location
exports.getLocation = async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }

    const result = await pool.query(
      'SELECT latitude, longitude FROM farmer_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Get Location Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
