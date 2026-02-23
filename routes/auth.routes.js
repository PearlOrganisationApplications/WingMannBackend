const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');

// Admin register
router.post('/register/admin', register);

// Interviewer register
router.post('/register/interviewer', register);

// Login
router.post('/login', login);

module.exports = router;