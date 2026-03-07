const express = require("express");
const { createFeedback, getFeedbackStats } = require("../controllers/feedback.controller");
const router = express.Router();

router.post("/create", createFeedback);

router.get("/get", getFeedbackStats);

module.exports = router;