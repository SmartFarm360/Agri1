const mongoose = require('mongoose');
const User = require('./User');

const farmerSchema = new mongoose.Schema({
  landSize: { type: Number, required: true },
  location: { type: String, required: true },
  cropType: { type: String, required: true },
  experience: { type: Number, required: true },
  landDocumentUrl: { type: String },
  landDocumentHash: { type: String } 
});

module.exports = User.discriminator('farmer', farmerSchema);
