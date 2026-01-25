const exifr = require('exifr');
const Image = require('../models/Image'); // MongoDB model

// Upload and Save Image to MongoDB
const uploadImage = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Destructure file metadata from req.file
    const { key, location, buffer } = req.file;

    // Validate file metadata
    if (!key || !location || !buffer) {
      return res.status(400).json({ message: 'Backblaze metadata missing from req.file' });
    }

    // Extract GPS metadata from the in-memory buffer
    let gpsData = {};
    try {
      gpsData = await exifr.gps(buffer);
    } catch (gpsError) {
      console.warn('GPS extraction failed:', gpsError.message);
    }

    // Create a new image document
    const image = new Image({
      user: req.user.user_id, // Corrected here
      filename: key,
      imageUrl: location,
      cropType: req.body.cropType,
      location: req.body.location,
      gps: {
        latitude: gpsData?.latitude || null,
        longitude: gpsData?.longitude || null,
        altitude: gpsData?.altitude || null,
      },
    });

    // Save the image to the database
    await image.save();

    // Send success response
    res.status(201).json({
      message: 'Image uploaded and saved to MongoDB with GPS',
      image,
    });

  } catch (error) {
    console.error('MongoDB save error:', error);
    res.status(500).json({ message: 'Server error during image save', error: error.message });
  }
};

// Get All Uploaded Images for a User
const getImages = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const images = await Image.find({ user: req.user.user_id });

    res.status(200).json(images);

  } catch (error) {
    console.error('MongoDB fetch error:', error);
    res.status(500).json({ message: 'Server error fetching images', error: error.message });
  }
};

module.exports = { uploadImage, getImages };
