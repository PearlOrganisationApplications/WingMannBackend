const express = require("express");
const { createCallRequest, getRequestsForReceiver,changeStatusofCallRequest  } = require("../controllers/callRequestController");
const router = express.Router();

router.post("/create", createCallRequest);

router.get("/reciever/:id", getRequestsForReceiver);

//action in call request

router.post('/reciever/change-status', changeStatusofCallRequest)


module.exports = router;