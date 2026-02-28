const express = require('express');
const router = express.Router();

const {
    onboarding,
    getAllUsers,
    getUserById,
    updateUser,
    uploadPhotosAndPreferences,
    loginUser,
    submitQuiz,
    sendEmail,
    
} = require('../controllers/onboarding.controller');

const upload = require('../middlewares/upload');


router.post('/submit/:userId', submitQuiz);
router.post('/uploadPhotosAndPreferences/:_id', upload.array('photos'), uploadPhotosAndPreferences);
router.post('/user/login', loginUser )

// CREATE
router.post('/onboarding', onboarding);
// email
router.post('/onboarding-email/:userId',sendEmail )

// GET ALL
router.get('/users', getAllUsers);

// GET BY ID
router.get('/users/:id', getUserById);


// UPDATE
router.put('/users/:id', updateUser);

module.exports = router;