const express = require('express');
const router = express.Router();
const { register, login,uploadMatchPhoto,addRestaurent, getAllRestaurent   } = require('../controllers/auth.controller');
const upload = require('../middlewares/upload')
// Admin register
router.post('/register/admin', register);

// Interviewer register
router.post('/register/interviewer', register);
router.post('/curate-vibe/:adminId', upload.array('photos'),uploadMatchPhoto )


// adimn add rest
router.post('/add-restaurent/:adminId',upload.single('photo'), addRestaurent);
router.get('/getAll-restaurent/:adminId', getAllRestaurent)


// Login
router.post('/login', login);

module.exports = router;