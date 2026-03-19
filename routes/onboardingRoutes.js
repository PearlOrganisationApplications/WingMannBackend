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
    getUserAnalytics,
    getRecommendedProfiles,
    userProfileImage,
    getUserProfileforNotifyById,
    markNotificationsAsRead,
    getUnReadNotification
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
router.get("/user-analytics", getUserAnalytics)

// GET BY ID
router.get('/users/:id', getUserById);
router.get('/user-profile-for-notify/:userId', getUserProfileforNotifyById);
router.get('/user-profile-recommendation/:userId',getRecommendedProfiles );
router.post('/user-profile-image/:userId',upload.single('profilephoto'), userProfileImage);
router.patch("/read-notification/:doc_Id", markNotificationsAsRead);
router.get('/get-Unread-Notfi/:userId', getUnReadNotification)


// UPDATE
router.put('/users/:id', updateUser);

module.exports = router;