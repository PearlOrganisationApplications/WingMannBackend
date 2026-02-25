const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");

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
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
     
    };

    // 6️⃣ Send response
    res.status(200).json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    next(error);
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

module.exports = {
  onboarding,
  getAllUsers,
  getUserById,
  updateUser,
  uploadPhotosAndPreferences,
  loginUser
};
