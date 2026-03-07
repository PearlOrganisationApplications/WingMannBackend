const express = require("express");
const { createCallRequest, getRequestsForReceiver } = require("../controllers/callRequestController");
const router = express.Router();

router.post("/create", createCallRequest);

router.get("/reciever/:id", getRequestsForReceiver);

module.exports = router;