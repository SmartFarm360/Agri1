const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const farmerLocationController = require('../controllers/farmerLocationController');

//  POST: Save location
router.post('/location', authMiddleware, farmerLocationController.saveLocation);
//  GET: Fetch location
router.get('/location', authMiddleware, farmerLocationController.getLocation);

module.exports = router;
