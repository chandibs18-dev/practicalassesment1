const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Models
const User = require('./models/user');
const Course = require('./models/course');
const Enrollment = require('./models/enrollment');

// MongoDB Atlas connection string
const mongoURI = 'mongodb+srv://chandibs18_db_user:cbs%401992oCt10@cluster0.ph0qhw1.mongodb.net/db1';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log(' MongoDB connected (Atlas)'))
  .catch(err => console.error(' MongoDB connection error:', err));


// --------------------------------------
// Optional: parse JSON only for POST/PUT requests
// Prevents JSON parse error for GET requests
app.use((req, res, next) => {
  if (['POST','PUT','PATCH'].includes(req.method)) {
    express.json()(req, res, next);
  } else {
    next();
  }
});


// --------------------------------------
// GET Instructor Summary using aggregation
// GET /api/v1/analytics/instructor-summary/:instructorId
// --------------------------------------
app.get('/api/v1/analytics/instructor-summary/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ message: 'Invalid instructorId' });
    }

    const objectId = new mongoose.Types.ObjectId(instructorId);

    const summary = await User.aggregate([
      // Match the instructor
      { $match: { _id: objectId, role: 'instructor' } },

      // Lookup courses taught by instructor
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'instructorId',
          as: 'courses'
        }
      },

      // Lookup enrollments for the instructor's courses
      {
        $lookup: {
          from: 'enrollments',
          let: { courseIds: '$courses._id' },
          pipeline: [
            { $match: { $expr: { $in: ['$courseId', '$$courseIds'] } } }
          ],
          as: 'enrollments'
        }
      },

      // Add totalCourses and totalEnrollments fields
      {
        $addFields: {
          totalCourses: { $size: '$courses' },
          totalEnrollments: { $size: '$enrollments' }
        }
      },

      // Project only required fields
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          bio: 1,
          totalCourses: 1,
          totalEnrollments: 1,
          courses: {
            $map: {
              input: '$courses',
              as: 'c',
              in: {
                id: '$$c._id',
                title: '$$c.title',
                price: '$$c.price',
                category: '$$c.category'
              }
            }
          }
        }
      }
    ]);

    if (summary.length === 0) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    res.json(summary[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// --------------------------------------
// Start server
// --------------------------------------
const PORT = 5000;
app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
