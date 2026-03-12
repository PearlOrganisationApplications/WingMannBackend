const express = require("express");
const { createDateRequest, getDateRequestsForReceiver, getDateRequestdata } = require("../controllers/dateRequestController");
const router = express.Router();

router.post("/create", createDateRequest);

router.get("/reciever",getDateRequestsForReceiver);
// get speicfic user dte info
router.get('/specific-receiver-data', getDateRequestdata)

module.exports = router;