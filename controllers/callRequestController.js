const CallRequest = require("../models/callRequest");
const sendPushNotification = require("../utils/sendPushNotification");
const User = require("../models/user.model");
const Notification = require("../models/notification");
// ✅ Create CallRequest
const createCallRequest = async (req, res) => {
  try {
    const { senderId, receiverId, requestType } = req.body;

    // ✅ 1. Validation
    if (!senderId || !receiverId || !requestType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ 2. Prevent duplicate request (optional but recommended)
    const existing = await CallRequest.findOne({ senderId, receiverId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Request already sent",
      });
    }

    // ✅ 3. Create Call Request
    const newRequest = await CallRequest.create({
      senderId,
      receiverId,
      requestType,
    });

    // ✅ 4. Get users
    const sender = await User.findById(senderId)
      .select("name profilephoto")
      .lean();

    const receiver = await User.findById(receiverId)
      .select("fcmToken name profilephoto")
      .lean();

    // ✅ 5. Notification content
    const title = "New Call Request";
    const body = `📞 you  have a call request from ${sender?.name}`;

    // ✅ 6. Save notification in DB (same structure as your status API)
     const notifi = await Notification.create({
      userId: receiverId, // 🔥 important: receiver gets notification
      title,
      body,
      type: "call request",
      isRead: false,
      AcceptingPersonImage: sender?.profilephoto || "",
      receiverId: senderId, // who triggered it
    });
   
    console.log('Npotitcation saved : ');
    console.log('now push notifuiation to firease')

    // ✅ 7. Send push notification
    if (receiver?.fcmToken) {
      await sendPushNotification({
        token: receiver.fcmToken,
        title,
        body,
        data: {
          senderId: String(senderId),
          receiverId: String(receiverId),
          type: "call_request_create",
        },
      });
    }

    // ✅ 8. Response
    res.status(201).json({
      success: true,
      message: "Call request created successfully",
      data: newRequest,
    });

  } catch (error) {
    console.error("Error in createCallRequest:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
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
    const body = `📞Your call request has been ${status} by ${receiver.name} `;

    // 4. Save notification in DB (for UI bell 🔔)
    await Notification.create({
      userId: senderId,
      title,
      body,
      type: "call request",
      isRead: false,
      AcceptingPersonImage: receiver?.profilephoto,
      receiverId: receiverId,
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
