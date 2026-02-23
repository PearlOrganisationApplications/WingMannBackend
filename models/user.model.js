const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },

    gender: String,
    name: String,
    DOB: Date,
    height: Number,

    location: {
        type: String // OR { lat: Number, lng: Number }
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

    relagous: String,
    religon: String,

    eat_type: String,

    interest: [String],
    lifestyle: [String]

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);