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

const updateSpecificAvailability = async (req, res) => {
    try {
        const { userId, slotId } = req.params; // Dono IDs URL se lenge
        const { day, date, times } = req.body; // Jo data update karna hai

        // Find and Update specific array element
        const updatedInterviewer = await Interviewer.findOneAndUpdate(
            { 
                user: userId, 
                "availability._id": slotId // Pehle user ko dhundo phir uske andar specific slot ki ID
            },
            { 
                $set: { 
                    "availability.$.day": day,
                    "availability.$.date": date,
                    "availability.$.times": times
                } 
            },
            { new: true } // Updated data return karega
        );

        if (!updatedInterviewer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Interviewer or Slot not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Specific slot updated', 
            data: updatedInterviewer.availability 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteSpecificSlot = async (req, res) => {
    try {
       
        const { userId, slotId } = req.query; 

        // 1. Validation: Check karein ki dono IDs provide ki gayi hain
        if (!userId || !slotId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Both userId and slotId are required in query' 
            });
        }

        // 2. ObjectId format check karein (taki CastError na aaye)
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(slotId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid User ID or Slot ID format' 
            });
        }

        // 3. $pull operator se array element remove karein
        const updatedInterviewer = await Interviewer.findOneAndUpdate(
            { user: userId }, 
            { 
                $pull: { 
                    availability: { _id: slotId } 
                } 
            },
            { new: true } // Updated data return karega
        );

        // 4. Agar document nahi mila
        if (!updatedInterviewer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Interviewer document not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Slot deleted successfully', 
            data: updatedInterviewer.availability 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { addAvailability, getAvailability,getAllAvailability, updateSpecificAvailability , deleteSpecificSlot};