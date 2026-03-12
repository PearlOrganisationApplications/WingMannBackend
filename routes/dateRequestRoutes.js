const express = require("express");
const { createDateRequest, getDateRequestsForReceiver, updateDateRequestStatus } = require("../controllers/dateRequestController");
const router = express.Router();

router.post("/create", createDateRequest);

router.get("/reciever",getDateRequestsForReceiver);

router.patch("/update/:id", updateDateRequestStatus);

module.exports = router;