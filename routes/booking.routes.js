const express = require('express');
const router = express.Router();
const { bookSlot, getBookings,getUserBookings, getAllInterScheduled,getSpecificInterview, postInterviewStatus, ComfirmInterviewStatus } = require('../controllers/booking.controller');

// Pass userId in URL params
router.post('/book-slot/:userId', bookSlot);
router.patch('/confirm-status/:doc_id', ComfirmInterviewStatus)

// Get all bookings
router.get('/bookings', getBookings);
router.get('/user-bookings/:userId', getUserBookings);


//booking accpeted or reject
router.get('/all-interview/:userId', getAllInterScheduled);
router.get('/interview-detail/:bookingId', getSpecificInterview );
router.put('/interview-change-status/:bookingId', postInterviewStatus);

module.exports = router;