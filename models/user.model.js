const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },

    gender: String,
    name: String,
    DOB: Date,
    height: Number,

    location: {
        address: String,   // "Delhi, India"
        lat: Number,
        lng: Number
    },

    state: String,
    story: String,

    career_info: String,

    study_info: {
        collage: String,
        course: String
    },

    work_info: {
        company: String,
        position: String
    },

    qualification_info: String,

    relagous: String,   // keep as-is
    religon: String,    // keep as-is

    eat_type: String,

    interest: [String],
    lifestyle: [String],

    photos: {
        type: [String],
        default: []
    },

    preferences: {
        age: { min: Number, max: Number },
        height: { min: Number, max: Number },
        religion: String,
        ethnicity: String,
        spoken_language: [String]
    },

    isOnboarded: { type: Boolean, default: false },

    // Password stored as plain text
    password: { type: String },

    // Role for role-based login
    role: { type: String, enum: ['admin', 'interviewer', 'user'], default: 'user' }

}, { timestamps: true });

// ✅ No pre-save hooks, no next, no password hashing

// Optional: simple password match method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return this.password === enteredPassword;
};

module.exports = mongoose.model('User', userSchema);