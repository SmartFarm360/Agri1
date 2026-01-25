const mongoose = require('mongoose');
const User = require('./User');

const droneControllerSchema = new mongoose.Schema({
  licenseId: { type: String, required: true },
  baseLocation: { type: String, required: true },
  availableDrones: { type: Number, required: true },
  flightExperience: { type: Number, required: true }
});

module.exports = User.discriminator('drone controller', droneControllerSchema);
