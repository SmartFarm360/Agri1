const pool = require('../config/db');

// POST: Save farmer's location
exports.saveLocation = async (req, res) => {
  try {
    // ✅ Correct user ID from authMiddleware
    const userId = req.user.user_id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User ID missing' });
    }

    const { latitude, longitude } = req.body;

    const result = await pool.query(
      'UPDATE farmer_profiles SET latitude = $1, longitude = $2 WHERE user_id = $3',
      [latitude, longitude, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    return res.status(200).json({ message: 'Location saved successfully' });
  } catch (error) {
    console.error('Error saving farmer location:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
