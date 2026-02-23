const express = require('express');
const router = express.Router();

const {
    onboarding,
    getAllUsers,
    getUserById,
    updateUser,
    uploadPhotosAndPreferences
} = require('../controllers/onboarding.controller');

const upload = require('../middlewares/upload');
const auth = require('../middlewares/auth');

router.post(
    '/onboarding/upload',
    auth,
    upload.array('photos', 6), // max 6 images
    uploadPhotosAndPreferences
);
// CREATE
router.post('/onboarding', onboarding);

// GET ALL
router.get('/users', getAllUsers);

// GET BY ID
router.get('/users/:id', getUserById);

// UPDATE
router.put('/users/:id', updateUser);

module.exports = router;