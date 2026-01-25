const app = require('./app');
const express = require('express');
const multer = require('multer');
const exifr = require('exifr');
const upload = multer();
 

const PORT = process.env.PORT || 5000;
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const gps = await exifr.gps(req.file.buffer); // Extract GPS from image buffer
    if (gps && gps.latitude && gps.longitude) {
      res.json({
        message: 'GPS coordinates extracted',
        latitude: gps.latitude,
        longitude: gps.longitude,
      });
    } else {
      res.json({ message: 'No GPS data found in image' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
