const express = require('express');
const router = express.Router();
const { addAvailability, getAvailability,getAllAvailability, updateSpecificAvailability, deleteSpecificSlot } = require('../controllers/interviewer.controller');

// Add availability slots using User _id from login
router.post('/:userId/availability', addAvailability);

// Get availability slots using User _id from login
router.get('/:userId/availability', getAvailability);
router.get('/availability/all', getAllAvailability);
router.put("/update/:userId/:slotId", updateSpecificAvailability);
router.delete("/delete-slot", deleteSpecificSlot)

module.exports = router;