const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    progress: { type: Number, default: 0 },
    enrollmentDate: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5 }
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema);