const express = require('express');
const router = express.Router();
const { storeMLData,getMLData } = require('../controllers/mlDataController');

router.post('/store-ml-data', storeMLData);
router.get('/store-ml-data',  getMLData);

module.exports = router;