const express = require('express');
const router = express.Router();
const { register, login,uploadMatchPhoto,addRestaurent, getAllRestaurent, getMatchPhotosByAdmin, updateMatchPhoto, deleteMatchPhoto   } = require('../controllers/auth.controller');
const upload = require('../middlewares/upload')
// Admin register
router.post('/register/admin', register);

// Interviewer register
router.post('/register/interviewer', register);
router.post('/curate-vibe/:adminId', upload.array('photos'),uploadMatchPhoto );
router.put("/update-photo", upload.single('photo'), updateMatchPhoto);

// adimn add rest
router.post('/add-restaurent/:adminId',upload.single('photo'), addRestaurent);
router.get("/get-all-match-photos/:adminId",getMatchPhotosByAdmin );
router.get('/getAll-restaurent/:adminId', getAllRestaurent);


router.delete("/delete-photo", deleteMatchPhoto );


// Login
router.post('/login', login);

module.exports = router;