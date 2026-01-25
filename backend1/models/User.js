const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mob: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['farmer', 'admin', 'drone controller'], 
    required: true 
  },
}, { 
  timestamps: true,
  discriminatorKey: 'role' 
});

module.exports = mongoose.model('User', userSchema);
