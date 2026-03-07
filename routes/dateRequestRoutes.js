const express = require("express");
const { createDateRequest, getDateRequestsForReceiver } = require("../controllers/dateRequestController");
const router = express.Router();

router.post("/create", createDateRequest);

router.get("/reciever/:id",getDateRequestsForReceiver);

module.exports = router;