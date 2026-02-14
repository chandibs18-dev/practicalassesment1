const express = require('express');
const mongoose = require('mongoose');
const app = express();

const User = require('./models/user');
const Course = require('./models/course');
const Enrollment = require('./models/enrollment');

const mongoURI = 'mongodb+srv://chandibs18_db_user:cbs%401992oCt10@cluster0.ph0qhw1.mongodb.net/db1';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use((req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  express.json()(req, res, next);
});

app.get('/api/v1/analytics/instructor-summary/:instructorId', async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(instructorId)) {
      return res.status(400).json({ message: 'Invalid instructorId' });
    }

    const summary = await Course.aggregate([
      { 
        $match: { instructorId: new mongoose.Types.ObjectId(instructorId) } 
      },
      {
        $lookup: {
          from: "users",
          localField: "instructorId",
          foreignField: "_id",
          as: "instructor"
        }
      },
      { $unwind: "$instructor" },
      {
        $lookup: {
          from: "enrollments",
          localField: "_id",
          foreignField: "courseId",
          as: "enrollments"
        }
      },
      {
        $addFields: {
          courseEnrollmentCount: { $size: "$enrollments" },
          courseRevenue: { $multiply: [{ $size: "$enrollments" }, "$price"] },
          courseRating: { $avg: "$enrollments.rating" }
        }
      },
      {
        $group: {
          _id: "$instructorId",
          instructorName: { $first: "$instructor.name" },
          totalStudents: { $sum: "$courseEnrollmentCount" },
          totalGross: { $sum: "$courseRevenue" },
          allCourses: {
            $push: {
              title: "$title",
              enrollments: "$courseEnrollmentCount",
              rating: "$courseRating"
            }
          }
        }
      },
      {
        $addFields: {
          platformFee: { $multiply: ["$totalGross", 0.10] },
          netTakeHome: { $subtract: ["$totalGross", { $multiply: ["$totalGross", 0.10] }] },
          averageCourseRating: { $avg: "$allCourses.rating" },
          topPerformingCourse: {
            $arrayElemAt: [
              { $sortArray: { input: "$allCourses", sortBy: { enrollments: -1 } } },
              0
            ]
          }
        }
      },
      {
        $project: {
          _id: 0,
          instructorName: 1,
          totalStudents: 1,
          averageCourseRating: { $round: ["$averageCourseRating", 1] },
          topPerformingCourse: "$topPerformingCourse.title",
          revenue: {
            totalGross: "$totalGross",
            platformFee: "$platformFee",
            netTakeHome: "$netTakeHome"
          }
        }
      }
    ]);

    if (summary.length === 0) {
      return res.status(404).json({ message: 'No data found' });
    }

    res.json(summary[0]);

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Port ${PORT}`));