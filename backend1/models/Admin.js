const mongoose = require('mongoose');
const User = require('./User');

const adminSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  adminArea: { type: String, required: true },
  accessLevel: { 
    type: String, 
    enum: ['basic', 'moderator', 'super admin'], 
    required: true 
  }
});

module.exports = User.discriminator('admin', adminSchema);
