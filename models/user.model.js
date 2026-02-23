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

    relagous: String,   // keep as-is (avoid breaking DB)
    religon: String,    // keep as-is

    eat_type: String,

    interest: [String],
    lifestyle: [String],

    // ✅ NEW: Photos (max 6 handled in multer)
    photos: {
        type: [String],
        default: []
    },

    // ✅ NEW: Preferences (matchmaking ready)
    preferences: {
        age: {
            min: Number,
            max: Number
        },
        height: {
            min: Number,
            max: Number
        },
        religion: String,
        ethnicity: String,
        spoken_language: [String]
    },

    // ✅ NEW: Onboarding status
    isOnboarded: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);