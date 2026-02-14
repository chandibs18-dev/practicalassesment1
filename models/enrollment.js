const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  enrollmentDate: { type: Date, default: Date.now },
  rating: { type: Number, min: 1, max: 5 }
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
