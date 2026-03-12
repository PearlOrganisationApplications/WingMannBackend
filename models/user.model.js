const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },

    gender: String,
    name: String,
    DOB: Date,
    height: Number,

    location: {
      address: String, // "Delhi, India"
      lat: Number,
      lng: Number,
    },

    state: String,
    story: String,

    career_info: String,

    study_info: {
      collage: String,
      course: String,
    },

    work_info: {
      company: String,
      position: String,
    },

    qualification_info: String,

    relagous: String, // keep as-is
    religon: String, // keep as-is

    eat_type: String,

    interest: [String],
    lifestyle: {
      drink: String,
      smoke: String,
      exercise: String,
    },

    photos: {
      type: [String],
      default: [],
    },
    profilephoto: {
      type: String,
    },

    preferences: {
      age: { min: Number, max: Number },
      height: { min: Number, max: Number },
      religion: String,
      ethnicity: String,
      spoken_language: [String],
    },

    isOnboarded: { type: Boolean, default: false },

    // Password stored as plain text
    password: { type: String },

    // Role for role-based login
    role: {
      type: String,
      enum: ["admin", "interviewer", "user"],
      default: "user",
    },
  },
  { timestamps: true },
);

// 🔒 Hash password before saving (only if modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // in case existing users have no password
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
