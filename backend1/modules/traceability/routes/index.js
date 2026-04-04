const express = require('express');
const router = express.Router();

// Ensure request bodies are parsed for this module even if the parent app
// registers body parsers after mounting `/api/traceability`.
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.use('/plantations', require('./plantationRoutes'));
router.use('/crops', require('./cropRoutes'));
router.use('/monitoring-records', require('./monitoringRecordRoutes'));
router.use('/verifications', require('./verificationRoutes'));
router.use('/harvests', require('./harvestRoutes'));
router.use('/packings', require('./packingRoutes'));
router.use('/patches', require('./patchRoutes'));
router.use('/process-images', require('./processImageRoutes'));
router.use('/user-roles', require('./userRoleRoutes'));
router.use('/trace', require('./traceRoutes'));

module.exports = router;
