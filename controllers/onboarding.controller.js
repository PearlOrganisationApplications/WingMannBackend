const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");
const Quiz = require("../models/user.quiz");
const transporter = require("../config/mail");
const { welcomeTemplate } = require("../utils/emailTemplates");
const matchProfileSchema = require("../models/admin.photoupload");
const callRequest = require("../models/callRequest");
const DateRequest = require("../models/dateRequest");
const Notification = require("../models/notification");
const axios = require("axios");
const mongoose = require("mongoose");
// ✅ CREATE (Onboarding)
const onboarding = async (req, res, next) => {
  try {
    console.log("req.body:", req.body);

    const { fcmToken, ...rest } = req.body;

    const user = await User.create({
      ...rest,
      // ✅ convert to array
      fcmTokens: fcmToken ? [fcmToken] : [],
    });

    res.status(201).json({
      success: true,
      _id: user._id,
      user,
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log("enmail : ", email);

    // 1️⃣ Check if email & password provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3️⃣ Compare password

    // 4️⃣ Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 5️⃣ Remove password before sending user data

    // 6️⃣ Send response
    res.status(200).json({
      success: true,
      token,
      user: user,
    });
  } catch (error) {
    next(error);
  }
};

const sendEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("user Id :", userId);

    const user = await User.findById({ _id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Example update
    user.isOnboarded = true;
    await user.save();

    // ✅ Prepare Email
    const template = welcomeTemplate(user.name);

    // ✅ Send Email
    await transporter.sendMail({
      from: `"WingMann" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    res.status(200).json({
      success: true,
      message: "User accepted & email sent successfully",
    });
  } catch (error) {
    console.error("Email error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const Updateprofile = async (req, res) => {
  const { userId } = req.params;
  const { selected, name, occupationWork } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ 1. Update Interests
    if (selected && Array.isArray(selected)) {
      user.interest = selected;
    }

    // ✅ 2. Update Name
    if (name && name.trim() !== "") {
      user.name = name;
    }

    // ✅ 3. Update Work Info
    if (occupationWork) {
      user.work_info = {
        company: occupationWork.company || "",
        position: occupationWork.position || "",
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ GET ALL USERS
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

const uploadPhotosAndPreferences = async (req, res) => {
  try {
    const userId = req.params._id; // Get user _id from params

    const user = await User.findById(userId); // Use User model
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    console.log(req.body);

    // ✅ Images
    const imageUrls = req.files.map((file) => {
      return `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
    });

    // ✅ Preferences (object)
    let preferences = {};
    if (req.body.preferences) {
      preferences = JSON.parse(req.body.preferences);
    }

    user.photos = imageUrls;
    user.preferences = preferences;

    await user.save();

    res.json({
      success: true,
      message: "Photos & preferences saved",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ GET USER BY ID
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Get user gender
    const gender = user.gender;

    // ✅ Get match profile images
    const matchProfile = await matchProfileSchema.findOne({});

    // filter avatars by gender
    const avatar = matchProfile.photos
      .filter((photo) => photo.gender !== gender)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 18);

    const quizExists = await Quiz.exists({ userId: req.params.id });

    let exists = !!quizExists;

    const call_request = await callRequest
      .find({ senderId: req.params.id })
      .select("-senderId, -updatedAt");

    // const date_request = await  DateRequest.find({receiverId:req.params.id}).populate('senderId').select("-senderId, -updatedAt")

    const date_request_received = await DateRequest.find({
      $or: [{ receiverId: req.params.id }, { senderId: req.params.id }],
    })
      .populate("senderId receiverId")
      .select("-updatedAt");

    const date_accepted = date_request_received.filter(
      (req) => req.status === "accepted",
    );

    const date_requested = date_request_received.filter(
      (item) =>
        item.status === "submitted" &&
        item.senderId?._id.toString() !== req.params.id,
    );
    const date_request_sent = await DateRequest.find({
      senderId: req.params.id,
    });

    // const callRequest_notifications = await Notification.find({ userId: req.params.id }).sort({ createdAt: -1 });

    // const dateRequest_notifications = await Notification.find({ userId: req.params.id }).sort({ createdAt: -1 });

    const notifications = await Notification.find({
      userId: req.params.id,
    }).sort({
      createdAt: -1,
    });

    const callRequest_notifications = notifications.filter(
      (n) => n.type === "call request",
    );

    const dateRequest_notifications = notifications.filter(
      (n) => n.type === "date request",
    );

    res.json({
      success: true,
      data: user,
      quiz: exists,
      avatar,
      call_request,
      date_accepted,
      date_requested,
      date_request_sent,
      callRequest_notifications,
      dateRequest_notifications,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

const getUserProfileforNotifyById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// ✅ UPDATE USER
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $facet: {
          // 1. GENDER STATS (Logic as per your requirement)
          genderStats: [
            {
              $match: { gender: { $in: ["Male", "Female", "male", "female"] } },
            },
            { $group: { _id: { $toLower: "$gender" }, count: { $sum: 1 } } },
          ],

          // 2. TOP 5 STATES
          topStates: [
            { $match: { state: { $ne: null, $exists: true, $ne: "" } } },
            { $group: { _id: "$state", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],

          // 3. AGE GROUPS (18-22, 23-27, 28-32, 33+)
          ageStats: [
            {
              // Step 1: Filter out documents where DOB is missing, null, or empty
              $match: {
                DOB: { $exists: true, $ne: null, $ne: "" },
              },
            },
            {
              $project: {
                age: {
                  $floor: {
                    $divide: [
                      {
                        // Step 2: Use $toDate to convert the string field to a Date object
                        $subtract: [new Date(), { $toDate: "$DOB" }],
                      },
                      365.25 * 24 * 60 * 60 * 1000,
                    ],
                  },
                },
              },
            },
            {
              $bucket: {
                groupBy: "$age",
                boundaries: [18, 23, 28, 33, 120],
                default: "Other",
                output: { count: { $sum: 1 } },
              },
            },
          ],
          // 4. WORK INFO (Logic: blank company = Student)
          workStats: [
            {
              $project: {
                category: {
                  $cond: {
                    if: {
                      $or: [
                        { $eq: ["$work_info.company", ""] },
                        { $eq: ["$work_info.company", null] },
                        { $not: ["$work_info.company"] },
                      ],
                    },
                    then: "Student",
                    else: "Professional",
                  },
                },
              },
            },
            { $group: { _id: "$category", count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    // --- 1. GENDER CALCULATION ---
    const genderResults = stats[0].genderStats;
    let maleCount = 0;
    let femaleCount = 0;
    genderResults.forEach((g) => {
      if (g._id === "male") maleCount = g.count;
      if (g._id === "female") femaleCount = g.count;
    });

    const totalGender = maleCount + femaleCount;
    let malePercent = 0,
      femalePercent = 0,
      ratio = "0:0";

    if (totalGender > 0) {
      malePercent = ((maleCount / totalGender) * 100).toFixed(2);
      femalePercent = ((femaleCount / totalGender) * 100).toFixed(2);
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const common = gcd(maleCount, femaleCount);
      ratio = `${maleCount / (common || 1)}:${femaleCount / (common || 1)}`;
    }

    // --- 2. AGE LOGIC (Relative Percentage Calculation) ---
    const ageBuckets = stats[0].ageStats;
    const ageRanges = [
      { id: 18, label: "18-22" },
      { id: 23, label: "23-27" },
      { id: 28, label: "28-32" },
      { id: 33, label: "33+" },
    ];

    // First, find total of ONLY these 4 age groups
    let totalAgeCountInDefinedGroups = 0;
    ageRanges.forEach((range) => {
      const found = ageBuckets.find((b) => b._id === range.id);
      if (found) totalAgeCountInDefinedGroups += found.count;
    });

    const ageAnalytics = ageRanges.map((range) => {
      const found = ageBuckets.find((b) => b._id === range.id);
      const count = found ? found.count : 0;
      return {
        range: range.label,
        count: count,
        percentage:
          totalAgeCountInDefinedGroups > 0
            ? ((count / totalAgeCountInDefinedGroups) * 100).toFixed(2) + "%"
            : "0.00%",
      };
    });

    // --- 3. EMPLOYMENT LOGIC (Relative Percentage) ---
    const workResults = stats[0].workStats;
    const totalWorkUsers = workResults.reduce(
      (acc, curr) => acc + curr.count,
      0,
    );
    const employmentStatus = ["Student", "Professional"].map((cat) => {
      const found = workResults.find((w) => w._id === cat);
      const count = found ? found.count : 0;
      return {
        label: cat,
        count: count,
        percentage:
          totalWorkUsers > 0
            ? ((count / totalWorkUsers) * 100).toFixed(2) + "%"
            : "0.00%",
      };
    });

    // --- Final Response ---
    res.status(200).json({
      success: true,
      data: {
        genderAnalytics: {
          maleCount,
          femaleCount,
          totalGenderUsers: totalGender,
          malePercentage: `${malePercent}%`,
          femalePercentage: `${femalePercent}%`,
          ratio: ratio,
        },
        top5States: stats[0].topStates.map((s) => ({
          state: s._id,
          userCount: s.count,
        })),
        ageAnalytics,
        employmentStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// const submitQuiz = async (req, res) => {
//   try {
//     const { quizzes } = req.body; // Hum expect kar rahe hain { "quizzes": [...] }
//     const { userId } = req.params; // Middleware se mil raha hai
//     console.log("quizzes ", quizzes, "userId", userId);
//     // 1. Check karo ki array bheja bhi hai ya nahi
//     if (!quizzes || !Array.isArray(quizzes) || quizzes.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Please provide an array of quizzes in the 'quizzes' key.",
//       });
//     }

//     // 2. Data Prepare: Har quiz category ke object mein userId ghusana
//     const quizzesToSave = quizzes.map((quiz, index) => {
//       // Validation: Har quiz ke andar answers hona zaruri hai
//       if (
//         !quiz.answers ||
//         !Array.isArray(quiz.answers) ||
//         quiz.answers.length === 0
//       ) {
//         throw new Error(
//           `Quiz at index ${index} (${quiz.quizName || "Unknown"}) is missing answers.`,
//         );
//       }

//       return {
//         userId: userId,
//         quizName: quiz.quizName,
//         answers: quiz.answers, // Ye answers khud ek array hai [{question, selectedOption}]
//       };
//     });

//     // 3. Bulk Insert: Saare 5 cards ka data ek saath database mein save hoga
//     const savedQuizzes = await Quiz.insertMany(quizzesToSave);

//     res.status(201).json({
//       success: true,
//       message: `${savedQuizzes.length} Quiz categories submitted successfully!`,
//       data: savedQuizzes,
//     });
//   } catch (error) {
//     console.error("❌ Submit Error:", error.message);

//     // Validation ya Enum error handling
//     if (error.name === "ValidationError") {
//       return res.status(400).json({
//         success: false,
//         message: "Validation Error: Check quiz names or structure.",
//         error: error.message,
//       });
//     }

//     res.status(400).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

const submitQuiz = async (req, res) => {
  try {
    const { quizzes } = req.body;
    const { userId } = req.params;

    if (!quizzes || !Array.isArray(quizzes) || quizzes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide quizzes array",
      });
    }

    // ✅ Validate & prepare quizzes
    const quizzesToSave = quizzes.map((quiz, index) => {
      if (!quiz.answers || !Array.isArray(quiz.answers)) {
        throw new Error(`Quiz ${quiz.quizName} missing answers`);
      }

      return {
        userId,
        quizName: quiz.quizName,
        answers: quiz.answers,
      };
    });

    // ✅ Get user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Normalize user data
    const name = user.name || "Unknown";
    const phone = user.phonenumber?.replace("+91", "") || "";
    const gender = user.gender?.toLowerCase() === "male" ? "Male" : "Female";

    // ✅ Save quizzes
    const savedQuizzes = await Quiz.insertMany(quizzesToSave);

    // ============================================
    // 🔥 STEP 2: Build SAFE answers payload
    // ============================================

    const answersPayload = {};

    // ✅ Force all answers = "1" (from your requirement)
    quizzes.forEach((quiz) => {
      quiz.answers.forEach((ans) => {
        answersPayload[ans.question] = "1";
      });
    });

    // ✅ Ensure ALL 25 questions exist
    for (let i = 1; i <= 25; i++) {
      if (!answersPayload[i]) {
        answersPayload[i] = "1";
      }
    }

    const externalPayload = {
      name,
      phone,
      gender,
      answers: answersPayload,
    };

    console.log("📤 Sending to external API:", externalPayload);

    // ============================================
    // 🔥 STEP 3: Call External API
    // ============================================

    let externalResponse = null;

    try {
      externalResponse = await axios.post(
        // "https://wingcompatibilitytest.onrender.com/submit",
        // http://localhost:3000

        "https://wingcompatibilitytest.onrender.com/submit",
        externalPayload,
      );
      if (externalResponse?.data?.userId) {
        user.userQuizId = externalResponse.data.userId; // ✅ assign
        await user.save(); // ✅ save to DB
      }
      console.log("✅ External API Response:", externalResponse.data);
    } catch (apiError) {
      console.error(
        "❌ External API Error:",
        apiError.response?.data || apiError.message,
      );
      // ⚠️ don't break main API
    }

    // ============================================
    // ✅ Final Response
    // ============================================

    res.status(201).json({
      success: true,
      message: `${savedQuizzes.length} Quiz categories submitted successfully!`,
      data: savedQuizzes,
      externalApi: externalResponse?.data || "Failed or skipped",
    });
  } catch (error) {
    console.error("❌ Submit Error:", error.message);

    res.status(400).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getRecommendedProfiles = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("API hit : ", userId);

    const currentUser = await User.findById(userId);

    if (!currentUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const quizId = currentUser?.userQuizId;
    console.log("quiz id :", quizId);

    if (quizId) {
      const externalResponse = await axios.get(
        // "https://wingcompatibilitytest.onrender.com/submit",
        // http://localhost:3000

        `https://wingcompatibilitytest.onrender.com/api/compatibility/all?user_id=${quizId}`,
      );

      const filteredProfiles = externalResponse.data.map((item) => ({
        ...item.user2,
        score: item.score,
      }));

      // 1. Extract all quiz user IDs
      const quizUserIds = filteredProfiles.map((profile) => profile.id);

      // 2. Fetch users from DB
      const users = await User.find({
        userQuizId: { $in: quizUserIds },
      }).lean();

      // 3. Map users by userQuizId for quick lookup
      const userMap = {};
      users.forEach((user) => {
        userMap[user.userQuizId] = user;
      });

      // 4. Merge user info with filteredProfiles
      const enrichedProfiles = filteredProfiles.map((profile) => ({
        ...profile,
        userInfo: userMap[profile.id] || null,
      }));

      console.log(enrichedProfiles);

      res.status(200).json({
        message: "profile recommended",
        profile: enrichedProfiles,
        quizComplete: true,
      });
    } else {
      res.status(200).json({
        success: true,
        quizIncomplete: "Submit the Quiz for profile Recommendation",
        quizComplete: false,
      });
    }

    // const pref = currentUser.preferences;

    // ✅ If preferences are empty return latest 10 users
    // if (
    //   !pref ||
    //   Object.keys(pref).length === 0 ||
    //   !pref.religion ||
    //   !pref.ethnicity
    // ) {
    //   const latestUsers = await User.find({
    //     _id: { $ne: currentUser._id },
    //     role: "user",
    //   })
    //     .sort({ createdAt: -1 })
    //     .limit(10);

    //   res.status(200).json({
    //     success: true,
    //     count: latestUsers.length,
    //     users: latestUsers,
    //   });
    //   return;
    // }

    // ✅ Normal recommendation logic
    // const users = await User.aggregate([
    //   {
    //     $match: {
    //       _id: { $ne: currentUser._id },
    //       role: "user",
    //     },
    //   },

    //   {
    //     $addFields: {
    //       matchCount: {
    //         $add: [
    //           {
    //             $cond: [
    //               { $eq: ["$preferences.religion", pref.religion] },
    //               1,
    //               0,
    //             ],
    //           },
    //           {
    //             $cond: [
    //               { $eq: ["$preferences.ethnicity", pref.ethnicity] },
    //               1,
    //               0,
    //             ],
    //           },
    //           {
    //             $cond: [
    //               {
    //                 $gt: [
    //                   {
    //                     $size: {
    //                       $setIntersection: [
    //                         { $ifNull: ["$preferences.spoken_language", []] },
    //                         pref.spoken_language || [],
    //                       ],
    //                     },
    //                   },
    //                   0,
    //                 ],
    //               },
    //               1,
    //               0,
    //             ],
    //           },
    //           {
    //             $cond: [
    //               {
    //                 $and: [
    //                   { $gte: ["$preferences.age.max", pref.age?.min] },
    //                   { $lte: ["$preferences.age.min", pref.age?.max] },
    //                 ],
    //               },
    //               1,
    //               0,
    //             ],
    //           },
    //           {
    //             $cond: [
    //               {
    //                 $and: [
    //                   { $gte: ["$preferences.height.max", pref.height?.min] },
    //                   { $lte: ["$preferences.height.min", pref.height?.max] },
    //                 ],
    //               },
    //               1,
    //               0,
    //             ],
    //           },
    //         ],
    //       },
    //     },
    //   },

    //   // ⭐ calculate percentage
    //   {
    //     $addFields: {
    //       compatibilityPercentage: {
    //         $multiply: [{ $divide: ["$matchCount", 5] }, 100],
    //       },
    //     },
    //   },

    //   {
    //     $sort: { matchCount: -1 },
    //   },

    //   {
    //     $limit: 10,
    //   },
    // ]);

    // res.status(200).json({
    //   success: true,
    //   count: users.length,
    //   users,
    // });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const userProfileImage = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const imagePath = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profilephoto: imagePath } },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Profile image uploaded",
      photos: user.photos,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    const { doc_Id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: doc_Id },
      { isRead: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Error in markNotificationsAsRead:", error);
  }
};

const getUnReadNotification = async (req, res) => {
  const { userId } = req.params;
  console.log("userId :", userId);

  try {
    console.log("api get hit");

    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId), // ✅ FIX
      isRead: false,
    });

    res.json({
      success: true,
      count,
    });
    console.log(count);
  } catch (err) {
    console.log(err);
  }
};

const checkUserInDB = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    return res.json({ exists: true, success: true, user });
  } else {
    return res.json({ exists: false, success: false });
  }
};

const checkPhoneNumber = async (req, res) => {
  const { phonenumber } = req.body;
  console.log("phonenumber :", phonenumber);
  const user = await User.findOne({ phonenumber });
  console.log("user from phone : ", user);

  if (user) {
    return res.json({ exists: true, success: true, user });
  } else {
    return res.json({ exists: false, success: false });
  }
};

const UpdateFCMToken = async (req, res) => {
  const { userId } = req.params;
  const { fcmToken } = req.body;

  try {
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        // ✅ Add token without duplicates
        $addToSet: { fcmTokens: fcmToken },
      },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "FCM token updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("FCM Update Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  onboarding,
  getAllUsers,
  getUserById,
  updateUser,
  uploadPhotosAndPreferences,
  loginUser,
  submitQuiz,
  sendEmail,
  getUserAnalytics,
  getRecommendedProfiles,
  userProfileImage,
  getUserProfileforNotifyById,
  markNotificationsAsRead,
  getUnReadNotification,
  checkUserInDB,
  checkPhoneNumber,
  Updateprofile,
  UpdateFCMToken,
};
