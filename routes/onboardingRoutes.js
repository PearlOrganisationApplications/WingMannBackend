const express = require('express');
const router = express.Router();

const {
    onboarding,
    getAllUsers,
    getUserById,
    updateUser
} = require('../controllers/onboarding.controller');


// CREATE
router.post('/onboarding', onboarding);

// GET ALL
router.get('/users', getAllUsers);

// GET BY ID
router.get('/users/:id', getUserById);

// UPDATE
router.put('/users/:id', updateUser);

module.exports = router;