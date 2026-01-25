const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../config/db');

//  Route: Add Sensor Data (New)
router.post('/add-data', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const { grid_id, latitude, longitude, temperature, humidity, moisture, problem, recommendations } = req.body;

        if (!grid_id || !latitude || !longitude) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await pool.query(
            'INSERT INTO sensor_data (user_id, grid_id, latitude, longitude, temperature, humidity, moisture, problem, recommendations) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [userId, grid_id, latitude, longitude, temperature, humidity, moisture, problem, recommendations]
        );

        res.status(201).json({ message: 'Sensor data stored successfully', data: result.rows[0] });
    } catch (err) {
        console.error('Error storing sensor data:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

//  Route: Get Sensor Data for Logged-in User
router.get('/sensor-data', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query('SELECT * FROM sensor_data WHERE user_id = $1', [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching sensor data:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route: Get Case History for Logged-in User
router.get('/case-history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query('SELECT * FROM sensor_data WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        const cases = result.rows;

        let solved = 0, pending = 0, running = 0;

        const updatedCases = cases.map(item => {
            const createdAt = new Date(item.created_at);
            const today = new Date();
            const pendingDays = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));

            if (item.status === 'solved') solved++;
            if (item.status === 'pending') pending++;
            if (item.status === 'running') running++;

            return {
                caseId: item.case_id,
                gridId: item.grid_id,
                problem: item.problem,
                status: item.status,
                createdAt: item.created_at,
                pendingDays
            };
        });

        res.json({
            summary: { solved, pending, running },
            cases: updatedCases
        });

    } catch (err) {
        console.error('Error fetching case history:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;