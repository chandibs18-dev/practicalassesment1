const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  bio: { type: String },
  role: { type: String, enum: ['student', 'instructor'], default: 'student' }
});

module.exports = mongoose.model('User', userSchema);
