const Interviewer = require('../models/interviewer.model');

// Add multiple availability slots for interviewer using User _id
const addAvailability = async (req, res) => {
    try {
        const userId = req.params.userId; // User _id from JWT
        const { slots } = req.body;       // array of { day, date, times }

        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ success: false, message: 'slots array is required' });
        }

        // Find interviewer by linked user
        let interviewer = await Interviewer.findOne({ user: userId });
        if (!interviewer) {
            // If interviewer document does not exist, create one
            interviewer = await Interviewer.create({ user: userId, availability: [] });
        }

        // Validate each slot
        for (const slot of slots) {
            if (!slot.day || !slot.date || !slot.times || !Array.isArray(slot.times)) {
                return res.status(400).json({ success: false, message: 'Each slot must have day, date and times array' });
            }
        }

        // Add all slots at once
        interviewer.availability.push(...slots);

        await interviewer.save();

        res.json({ success: true, message: 'Availability added', data: interviewer.availability });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get availability slots for interviewer using User _id
const getAvailability = async (req, res) => {
    try {
        const userId = req.params.userId;  // User _id from JWT

        // Find interviewer by linked user
        const interviewer = await Interviewer.findOne({ user: userId }).populate('user', 'name email');
        if (!interviewer) {
            return res.status(404).json({ success: false, message: 'Interviewer not found' });
        }

        res.json({ success: true, data: interviewer.availability });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};





// Get all availability slots, deduplicated by day + date + time
const getAllAvailability = async (req, res) => {
    try {
        const interviewers = await Interviewer.find(); // get all interviewers

        const uniqueSlots = [];
        const seen = new Set();

        interviewers.forEach(interviewer => {
            interviewer.availability.forEach(slot => {
                slot.times.forEach(time => {
                    const key = `${slot.day}_${slot.date}_${time}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueSlots.push({
                            day: slot.day,
                            date: slot.date,
                            time: time,
                            interviewer: interviewer.user // optional: include interviewer id
                        });
                    }
                });
            });
        });

        res.json({ success: true, data: uniqueSlots });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};




module.exports = { addAvailability, getAvailability,getAllAvailability };