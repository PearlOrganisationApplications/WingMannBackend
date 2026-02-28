const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");
const Quiz = require('../models/user.quiz')
const transporter = require('../config/mail')
const { welcomeTemplate } = require('../utils/emailTemplates')
// ✅ CREATE (Onboarding)
const onboarding = async (req, res, next) => {
  try {
    console.log("req. bofy : ", req.body);
    const user = await User.create(req.body);

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      _id: user._id,
      token,
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log('enmail : ', email)

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

    const user = await User.findById(userId);

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
    console.log(req.body)

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


const submitQuiz = async (req, res) => {
    try {
        const { quizzes } = req.body; // Hum expect kar rahe hain { "quizzes": [...] }
        const {userId} = req.params;   // Middleware se mil raha hai
        console.log('quizzes ', quizzes, 'userId', userId)
        // 1. Check karo ki array bheja bhi hai ya nahi
        if (!quizzes || !Array.isArray(quizzes) || quizzes.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide an array of quizzes in the 'quizzes' key." 
            });
        }

        // 2. Data Prepare: Har quiz category ke object mein userId ghusana
        const quizzesToSave = quizzes.map((quiz, index) => {
            // Validation: Har quiz ke andar answers hona zaruri hai
            if (!quiz.answers || !Array.isArray(quiz.answers) || quiz.answers.length === 0) {
                throw new Error(`Quiz at index ${index} (${quiz.quizName || 'Unknown'}) is missing answers.`);
            }

            return {
                userId: userId,
                quizName: quiz.quizName,
                answers: quiz.answers // Ye answers khud ek array hai [{question, selectedOption}]
            };
        });

        // 3. Bulk Insert: Saare 5 cards ka data ek saath database mein save hoga
        const savedQuizzes = await Quiz.insertMany(quizzesToSave);

        res.status(201).json({ 
            success: true, 
            message: `${savedQuizzes.length} Quiz categories submitted successfully!`, 
            data: savedQuizzes 
        });

    } catch (error) {
        console.error("❌ Submit Error:", error.message);

        // Validation ya Enum error handling
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false, 
                message: "Validation Error: Check quiz names or structure.",
                error: error.message 
            });
        }

        res.status(400).json({ 
            success: false, 
            message: error.message || "Internal Server Error" 
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
  sendEmail
};
