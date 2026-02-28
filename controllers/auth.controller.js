const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const matchProfileSchema = require("../models/admin.photoupload");
const restaurentModel = require('../models/admin.restaurent')

// Generate JWT
const generateToken = (id, role) => {
  console.log("Generating JWT for:", id, role);
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Role-based registration
const register = async (req, res) => {
  console.log("Register endpoint hit");
  console.log("Request body:", req.body);

  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      console.log("Missing fields in request");
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    console.log("Checking if user already exists:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    console.log("Creating new user:", { name, email, role });
    const user = await User.create({ name, email, password, role });
    console.log("User created successfully:", user._id);

    const token = generateToken(user._id, user.role);
    console.log("Generated token:", token);

    res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login
const login = async (req, res) => {
  console.log("Login endpoint hit");
  console.log("Request body:", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing email or password");
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    console.log("Looking for user with email:", email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = (await user.password) == password;
    console.log("Password match result:", isMatch);
    if (!isMatch) {
      console.log("Incorrect password for user:", email);
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadMatchPhoto = async (req, res) => {
  try {
    const { gender } = req.body;
    const { adminId } = req.params;

    if (!gender || !["male", "female"].includes(gender)) {
      return res.status(400).json({
        message: "Gender must be male or female",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "At least one image is required",
      });
    }

    const photos = req.files.map((file) => ({
      gender,
      imgUrl: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
    }));

    const matchProfile = await matchProfileSchema.findOneAndUpdate(
      {},
      {
        $push: { photos: { $each: photos } },
        $set: { uploadedBy: adminId },
      },

      { new: true, upsert: true },
    );

    res.status(201).json({
      success: true,
      data: matchProfile,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const addRestaurent = async (req, res) => {
  try {
    // ✅ FIX typo (params not parms)
    const { adminId } = req.params;

    const {
      venue,
      businessName,
      streetAddress,
      cityState,
      googleMapLink,
      typeOfFood,
      budgetPerPerson,
    } = req.body;

    // ✅ Validate image
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Restaurant photo is required",
      });
    }

    // Create image URL
    const photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    // ✅ Create restaurant
    const restaurant = await restaurentModel.create({
      photo: photoUrl,
      venue,
      businessName,
      address: {
        streetAddress,
        cityState,
        googleMapLink,
      },
      typeOfFood,
      budgetPerPerson,
      uploadedBy: adminId, // optional if added in schema
    });

    res.status(201).json({
      success: true,
      message: "Restaurant added successfully",
      data: restaurant,
    });
  } catch (error) {
    console.error("Add Restaurant Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAllRestaurent = async (req, res)=>{
  const {adminId } = req.params;
  try{
     const restaurent = await restaurentModel.find({ _id:adminId });
    if (!restaurent) {
      console.log("restaurent not found:");
      return res
        .status(401)
        .json({ success: false, message: "restaurent not found" });
    }

    res.json({
      success: true,
      message: `get All Restaurent for Admin id : ${adminId}`,
      data:restaurent
    });


  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { register, login, uploadMatchPhoto, addRestaurent, getAllRestaurent };
