const express = require('express');
const router = express.Router();
const { register, login,uploadMatchPhoto,addRestaurent, getAllRestaurent, getMatchPhotosByAdmin, updateMatchPhoto, deleteMatchPhoto, updateRestaurant, deleteRestaurant, dashboardOverview   } = require('../controllers/auth.controller');
const upload = require('../middlewares/upload')
// Admin register
router.post('/register/admin', register);

// Interviewer register
router.post('/register/interviewer', register);
router.post('/curate-vibe/:adminId', upload.array('photos'),uploadMatchPhoto );
router.put("/update-photo", upload.single('photo'), updateMatchPhoto);
router.get('/dashbaord-overview', dashboardOverview)



// adimn add rest
router.post('/add-restaurent/:adminId',upload.single('photo'), addRestaurent);
router.put("/update-restaurant/:id",upload.single('photo'), updateRestaurant );

router.get("/get-all-match-photos/:adminId",getMatchPhotosByAdmin );
router.get('/getAll-restaurent/:adminId', getAllRestaurent);


router.delete("/delete-photo", deleteMatchPhoto );
router.delete("/delete-restaurant/:id",deleteRestaurant )


// Login
router.post('/login', login);

module.exports = router;