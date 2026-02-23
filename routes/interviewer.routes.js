const express = require('express');
const router = express.Router();
const { addAvailability, getAvailability } = require('../controllers/interviewer.controller');

// Add availability slots using User _id from login
router.post('/:userId/availability', addAvailability);

// Get availability slots using User _id from login
router.get('/:userId/availability', getAvailability);

module.exports = router;