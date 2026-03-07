const User = require("../models/user.model"); // Aapka naya user schema wala model
const Feedback = require("../models/feedback.model");

// Rating ko numbers mein convert karne ke liye map
const ratingMap = {
  very_good: 5,
  good: 4,
  average: 3,
  bad: 2,
  very_bad: 1,
};

exports.createFeedback = async (req, res) => {
  try {
  
    const { userDataId, type, message } = req.body;
    if (!userDataId || !type) {
      return res.status(400).json({
        success: false,
        message: "userDataId and type are required",
      });
    }
    if (!ratingMap[type]) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback type. Options: very_good, good, average, bad, very_bad",
      });
    }

   
    const user = await User.findById(userDataId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this ID",
      });
    }

  
    const feedback = await Feedback.create({
      userDataId: user._id, // User ki unique ID
      type: type,           // e.g., "good"
      rating: ratingMap[type], // e.g., 4
      message: message || "", // User ka comment
    });

    // 6. Success Response
    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        feedbackId: feedback._id,
        userName: user.name, // Aapke model se user ka naam bhi return kar sakte hain
        email: user.email,
        rating: feedback.rating
      },
    });

  } catch (error) {
    console.error("createFeedback error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing feedback",
      error: error.message
    });
  }
};


exports.getFeedbackStats = async (req, res) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalResponses: { $sum: 1 },
          avgRating: { $avg: "$rating" },

          // rating distribution
          rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },

          // sentiment
          positive: { $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] } },
          neutral: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          negative: { $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalResponses: 1,
          avgRating: { $round: ["$avgRating", 1] },

          positive: 1,
          neutral: 1,
          negative: 1,

          ratingDistribution: {
            1: "$rating1",
            2: "$rating2",
            3: "$rating3",
            4: "$rating4",
            5: "$rating5",
          },

          positivePercent: {
            $cond: [
              { $eq: ["$totalResponses", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$positive", "$totalResponses"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
            ],
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Feedback stats fetched successfully",
      data: stats[0] || {
        totalResponses: 0,
        avgRating: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        positivePercent: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    });
  } catch (error) {
    console.log("getFeedbackStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};