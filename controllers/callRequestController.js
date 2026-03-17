const CallRequest = require("../models/callRequest");
const sendPushNotification = require("../utils/sendPushNotification");
const User = require("../models/user.model");
const Notification = require("../models/notification");
// ✅ Create CallRequest
const createCallRequest = async (req, res) => {
  try {
    const { senderId, receiverId, requestType } = req.body;
    console.log(senderId, receiverId, requestType);

    if (!senderId || !receiverId || !requestType) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
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

    const requests = await CallRequest.find({
      receiverId,
      status: { $nin: ["accepted", "rejected"] },
    })
      .populate("senderId", "name profilephoto state") // sirf sender ka name populate
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

const changeStatusofCallRequest = async (req, res) => {
  try {
    const { receiverId, senderId } = req.query;
    const { status } = req.body;

    // 1. Update call request
    const request = await CallRequest.findOneAndUpdate(
      { receiverId, senderId },
      { status },
      { new: true },
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Call request not found",
      });
    }

    // 2. Get sender
    const sender = await User.findById(senderId).select("fcmToken name").lean();

    const receiver = await User.findById(receiverId)
      .select("name  profilephoto")
      .lean();

    console.log("Sender user:", sender);

    // 3. Prepare notification content
    const title = "Call request status updated";
    const body = `Your call request has been ${status} by ${receiver.name} `;

    // 4. Save notification in DB (for UI bell 🔔)
    await Notification.create({
      userId: senderId,
      title,
      body,
      type: "call request",
      isRead: false,
      AcceptingPersonImage: receiver?.profilephoto,
    });

    // 5. Send push notification (if token exists)
    if (sender?.fcmToken) {
      await sendPushNotification({
        token: sender.fcmToken,
        title,
        body,
        data: {
          senderId: String(senderId),
          receiverId: String(receiverId),
          status: String(status),
          type: "call_request_status",
        },
      });
    }

    // 6. Response
    res.status(200).json({
      success: true,
      message: "Call request updated successfully",
      data: request,
    });
  } catch (error) {
    console.error("Error in changeStatusofCallRequest:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SEND SIGNAL
exports.sendSignal = async (req, res) => {
  const { type, payload } = req.body;

  await CallSignal.create({
    callId: req.params.callId,
    senderId: req.user.id,
    type,
    payload,
  });

  res.json({ success: true });
};

// GET SIGNALS
exports.getSignals = async (req, res) => {
  const signals = await CallSignal.find({
    callId: req.params.callId,
  }).sort({ createdAt: 1 });

  res.json({ success: true, signals });
};

module.exports = {
  createCallRequest,
  getRequestsForReceiver,
  changeStatusofCallRequest,
};
