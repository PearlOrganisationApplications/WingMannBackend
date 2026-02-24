const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true }, // store user _id
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    day: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Interviewer', required: true },
    meetLink: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);