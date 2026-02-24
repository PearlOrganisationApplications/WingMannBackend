const express = require('express');
const router = express.Router();
const { bookSlot, getBookings,getUserBookings } = require('../controllers/booking.controller');

// Pass userId in URL params
router.post('/book-slot/:userId', bookSlot);

// Get all bookings
router.get('/bookings', getBookings);
router.get('/user-bookings/:userId', getUserBookings);

module.exports = router;