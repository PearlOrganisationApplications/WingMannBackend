const User = require("../models/user.model");
const Interviewer = require("../models/interviewer.model");
const Booking = require("../models/booking.model");
const Traffic = require("../models/trafficSchema");
const jwt = require("jsonwebtoken");
const matchProfileSchema = require("../models/admin.photoupload");
const restaurentModel = require("../models/admin.restaurent");
const fs = require("fs");
const path = require("path");

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

const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params; // Restaurant ki ID jo update karni hai
    const {
      venue,
      businessName,
      streetAddress,
      cityState,
      googleMapLink,
      typeOfFood,
      budgetPerPerson,
    } = req.body;

    // 1. Pehle check karein ki restaurant exist karta hai ya nahi
    let restaurant = await restaurentModel.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // 2. Image Update Logic
    // Agar nayi file upload hui hai to uska URL banayein, nahi to purana hi rehne dein
    let photoUrl = restaurant.photo;
    if (req.file) {
      photoUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    // 3. Update Object taiyar karein
    // Address nested object hai isliye hum isse handle karenge
    const updatedData = {
      photo: photoUrl,
      venue: venue || restaurant.venue,
      businessName: businessName || restaurant.businessName,
      address: {
        streetAddress: streetAddress || restaurant.address.streetAddress,
        cityState: cityState || restaurant.address.cityState,
        googleMapLink: googleMapLink || restaurant.address.googleMapLink,
      },
      typeOfFood: typeOfFood
        ? Array.isArray(typeOfFood)
          ? typeOfFood
          : JSON.parse(typeOfFood)
        : restaurant.typeOfFood,
      budgetPerPerson: budgetPerPerson || restaurant.budgetPerPerson,
    };

    // 4. Database update karein
    const updatedRestaurant = await restaurentModel.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }, // new: true se updated data return hoga
    );

    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      data: updatedRestaurant,
    });
  } catch (error) {
    console.error("Update Restaurant Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getAllRestaurent = async (req, res) => {
  const { adminId } = req.params;
  try {
    const restaurent = await restaurentModel.find({ uploadedBy: adminId });
    if (!restaurent) {
      console.log("restaurent not found:");
      return res
        .status(401)
        .json({ success: false, message: "restaurent not found" });
    }

    res.json({
      success: true,
      message: `get All Restaurent for Admin id : ${adminId}`,
      data: restaurent,
    });
  } catch (error) {
    console.error("Error in register:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params; // The ID of the restaurant to delete

    // 1. Find the restaurant first to get the image path
    const restaurant = await restaurentModel.findById(id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    // 2. Delete the physical image file from the server
    // We extract the filename from the URL (e.g., "http://localhost:5000/uploads/image.jpg")
    if (restaurant.photo) {
      const filename = restaurant.photo.split("/").pop(); // Gets "image.jpg"
      const filePath = path.join(__dirname, "../uploads", filename); // Adjust path to your uploads folder

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Failed to delete local image:", err);
          // We don't return here because we still want to delete the DB record
        }
      });
    }

    // 3. Delete the record from the database
    await restaurentModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Restaurant and associated image deleted successfully",
    });
  } catch (error) {
    console.error("Delete Restaurant Error:", error);

    // Handle invalid Mongoose ObjectIDs
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid Restaurant ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMatchPhotosByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Find the document where uploadedBy matches the adminId
    const matchProfile = await matchProfileSchema.findOne({
      uploadedBy: adminId,
    });

    if (!matchProfile) {
      return res.status(404).json({
        success: false,
        message: "No data found for this Admin ID",
      });
    }

    res.status(200).json({
      success: true,
      data: matchProfile,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateMatchPhoto = async (req, res) => {
  try {
    // Extracting adminId, photoId, and gender from req.query (?adminId=...&photoId=...&gender=...)
    const { adminId, photoId, gender } = req.query;

    // 1. Build the update object dynamically
    let updateData = {};

    // If gender is provided in query, validate and add to update
    if (gender) {
      if (!["male", "female"].includes(gender)) {
        return res
          .status(400)
          .json({ message: "Gender must be male or female" });
      }
      updateData["photos.$.gender"] = gender;
    }

    // If a new file is uploaded (via multer), update the imgUrl
    if (req.file) {
      const newImgUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      updateData["photos.$.imgUrl"] = newImgUrl;
    }

    // Check if we have something to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No data provided to update (gender or file required)",
      });
    }

    // 2. Update only the specific photo inside the array
    const updatedProfile = await matchProfileSchema.findOneAndUpdate(
      {
        uploadedBy: adminId, // Matches adminId from query
        "photos._id": photoId, // Matches photoId from query
      },
      {
        $set: updateData,
      },
      { new: true },
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Match profile or Photo ID not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Photo updated successfully using query parameters",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteMatchPhoto = async (req, res) => {
  try {
    const { adminId, photoId } = req.query;

    // 1. Find the document that CONTAINS the specific photoId
    // We search by "photos._id" instead of just "uploadedBy"
    const updatedProfile = await matchProfileSchema.findOneAndUpdate(
      { "photos._id": photoId },
      {
        $pull: {
          photos: { _id: photoId },
        },
      },
      { new: true },
    );

    // 2. If no document was found with that photoId
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Photo not found. It may have already been deleted.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const dashboardOverview = async (req, res) => {
  try {

    const calculateGrowth = (current, previous) => {
      if (previous === 0 && current === 0) return 0;
      if (previous === 0) return current * 100;
      return ((current - previous) / previous) * 100;
    };

    let { startDate, endDate } = req.query;

    let startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    let startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    let endOfYesterday = new Date(startOfToday);
    endOfYesterday.setMilliseconds(-1);

    // If frontend sends dates
    if (startDate && endDate) {
      startOfToday = new Date(startDate);
      startOfToday.setHours(0,0,0,0);

      endOfToday = new Date(endDate);
      endOfToday.setHours(23,59,59,999);

      const prevStart = new Date(startOfToday);
      prevStart.setDate(prevStart.getDate() - (endOfToday - startOfToday)/(1000*60*60*24) - 1);

      startOfYesterday = prevStart;
      endOfYesterday = new Date(startOfToday);
    }

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    // -------- USERS --------
    const [currentUsers, prevUsers] = await Promise.all([
      User.countDocuments({
         role: "user",
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      }),
      User.countDocuments({
        createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
      })
    ]);

    const userGrowth = calculateGrowth(currentUsers, prevUsers);

    // -------- INTERVIEWS --------
    const [currentInterviews, prevInterviews] = await Promise.all([
      Interviewer.countDocuments({
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      }),
      Interviewer.countDocuments({
        createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
      })
    ]);

    const interviewGrowth = calculateGrowth(currentInterviews, prevInterviews);

    // -------- DATES --------
    const [currentDates, prevDates] = await Promise.all([
      restaurentModel.countDocuments({
        createdAt: { $gte: startOfToday, $lte: endOfToday }
      }),
      restaurentModel.countDocuments({
        createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
      })
    ]);

    const dateGrowth = calculateGrowth(currentDates, prevDates);

    // -------- BOOKINGS --------
    const [acceptedBookings, rejectedBookings] = await Promise.all([
      Booking.countDocuments({ status: "accepted" }),
      Booking.countDocuments({ status: "rejected" })
    ]);

    const totalBookings = acceptedBookings + rejectedBookings;

    const acceptedPercentage =
      totalBookings === 0 ? 0 : (acceptedBookings / totalBookings) * 100;

    // -------- TRAFFIC TODAY --------
    const todayVisits = await Traffic.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    // -------- WEEKLY TRAFFIC --------
    const weeklyVisits = await Traffic.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          visits: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const weekData = weeklyVisits.map(item => ({
      date: item._id,
      visits: item.visits
    }));

    res.json({
      dashboard: {
        users: {
          total: currentUsers,
          growth: userGrowth.toFixed(2) + "%"
        },
        interviews: {
          total: currentInterviews,
          growth: interviewGrowth.toFixed(2) + "%"
        },
        datesPlanned: {
          total: currentDates,
          growth: dateGrowth.toFixed(2) + "%"
        }
      },
      bookings: {
        accepted: acceptedBookings,
        rejected: rejectedBookings,
        acceptedPercentage: acceptedPercentage.toFixed(2) + "%"
      },
      traffic: {
        today: todayVisits,
        weekly: weekData
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  register,
  login,
  uploadMatchPhoto,
  updateRestaurant,
  addRestaurent,
  getAllRestaurent,
  deleteMatchPhoto,
  getMatchPhotosByAdmin,
  updateMatchPhoto,
  deleteRestaurant,
  dashboardOverview,
};
