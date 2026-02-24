const mongoose = require('mongoose');

const interviewerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // link to User

    // Array of availability slots
    // Each slot contains: day, date, times (array of strings)
    availability: [
        {
            day: { type: String, required: true },        // e.g., "Monday"
            date: { type: Date, required: true },         // e.g., "2026-02-25"
            times: [{ type: String }]                     // e.g., ["10:00", "14:00"]
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Interviewer', interviewerSchema);