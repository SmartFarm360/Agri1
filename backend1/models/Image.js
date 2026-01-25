const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  user: {
    type: Number, // PostgreSQL user ID
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  cropType: {
    type: String,
    default: "",
  },
  gps: {
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    altitude: {
      type: Number,
    },
  },
  location: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Image', imageSchema);
