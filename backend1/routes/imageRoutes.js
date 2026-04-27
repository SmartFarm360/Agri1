const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const { ensureMongoConnection } = require('../config/mongo');
const { cropImageUpload, landDocumentUpload, uploadToBackblaze } = require('../middleware/backBlazeUpload');
const { uploadImage, getImages } = require('../controllers/imageController');
const Farmer = require('../models/Farmer'); // Assuming you're still storing some farmer data in MongoDB

router.use(ensureMongoConnection);

// ✅ Upload Crop Image
router.post('/upload', authMiddleware, cropImageUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        const file = req.file;
        const fileName = `crop-images/${Date.now()}-${file.originalname}`;

        // Upload to Backblaze
        const fileUrl = await uploadToBackblaze(fileName, file.buffer, file.mimetype);

        // Attach Backblaze metadata to req.file
        req.file = {
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
            key: fileName,
            location: fileUrl
        };

        // Call the controller to save the image in MongoDB
        await uploadImage(req, res);

    } catch (err) {
        console.error('Backblaze Upload Error:', err);
        res.status(500).json({ message: 'Failed to upload image to Backblaze' });
    }
});

// ✅ Upload Land Document (PDF)
router.post('/upload-land-document', authMiddleware, landDocumentUpload.single('landDocument'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No land document provided' });
        }

        const file = req.file;
        const fileName = `land-documents/${Date.now()}-${file.originalname}`;

        // Upload to Backblaze
        const fileUrl = await uploadToBackblaze(fileName, file.buffer, file.mimetype);

        // Create file hash
        const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // Update farmer record in MongoDB
        const updatedFarmer = await Farmer.findOneAndUpdate(
            { _id: req.user.id },
            { landDocumentUrl: fileUrl, landDocumentHash: hash },
            { new: true }
        );

        if (!updatedFarmer) {
            return res.status(404).json({ message: 'Farmer not found' });
        }

        res.status(200).json({
            message: 'Land document uploaded successfully',
            farmer: updatedFarmer
        });

    } catch (err) {
        console.error('Land Document Upload Error:', err);
        res.status(500).json({ message: 'Failed to upload land document to Backblaze' });
    }
});

// ✅ Get All Uploaded Images
router.get('/', authMiddleware, getImages);

module.exports = router;
