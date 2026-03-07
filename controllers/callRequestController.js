const CallRequest = require("../models/callRequest");

// ✅ Create CallRequest
const createCallRequest = async (req, res) => {
  try {
    const { senderId, receiverId, requestType } = req.body;

    if (!senderId || !receiverId || !requestType) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const newRequest = await CallRequest.create({
      senderId,
      receiverId,
      requestType,
    });

    res.status(201).json({
      success: true,
      message: "Call request created successfully",
      data: newRequest,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all requests for a receiver with sender name populated
const getRequestsForReceiver = async (req, res) => {
  try {
    const receiverId = req.params.id;

    const requests = await CallRequest.find({ receiverId })
      .populate("senderId", "name") // sirf sender ka name populate
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// SEND SIGNAL
exports.sendSignal = async (req, res) => {
  const { type, payload } = req.body;

  await CallSignal.create({
    callId: req.params.callId,
    senderId: req.user.id,
    type,
    payload
  });

  res.json({ success: true });
};


// GET SIGNALS
exports.getSignals = async (req, res) => {
  const signals = await CallSignal.find({
    callId: req.params.callId
  }).sort({ createdAt: 1 });

  res.json({ success: true, signals });
};


module.exports = { createCallRequest, getRequestsForReceiver };
