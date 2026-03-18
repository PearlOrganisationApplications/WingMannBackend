const DateRequest = require("../models/dateRequest");
const Notification = require('../models/notification');
const User = require("../models/user.model");
const sendPushNotification = require("../utils/sendPushNotification");
exports.createDateRequest = async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      requestType,
      locationType,
      budget,
      mealType,
      payType,
      dateSlots,
      status // Body se status le rahe hain
    } = req.body;

    // 1. Mandatory Fields Validation
    if (!senderId || !receiverId || !locationType || !mealType || !payType || !dateSlots) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: senderId, receiverId, locationType, mealType, payType, or dateSlots",
      });
    }
    
    if (!Array.isArray(dateSlots) || dateSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "dateSlots must be a non-empty array",
      });
    }

    const finalMealType = Array.isArray(mealType) ? mealType : [mealType];
    if (finalMealType.length === 0) {
      return res.status(400).json({
        success: false,
        message: "mealType must have at least one value",
      });
    }

   
    const allowedStatus = ["submitted", "accepted", "rejected"];
    let finalStatus = status || "submitted"; 

    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: submitted, accepted, or rejected",
      });
    }

    // 5. Create Request
    const newRequest = await DateRequest.create({
      senderId,
      receiverId,
      requestType: requestType || "date req", 
      locationType,
      budget: budget || null,
      mealType: finalMealType,
      payType,
      dateSlots, 
      status: finalStatus
    });

    return res.status(201).json({
      success: true,
      message: "Date request created successfully",
      data: newRequest,
    });

  } catch (error) {
    console.error("Error creating date request:", error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || "Internal Server Error" 
    });
  }
};

exports.getDateRequestsForReceiver = async (req, res) => {
  try {
    const { receiverId, senderId } = req.query;
    
    const filter = {};

    if (receiverId) filter.receiverId = receiverId;
    if (senderId) filter.senderId = senderId;

    const requests = await DateRequest.find(filter)
      .populate("senderId", "name profilephoto")
      .populate("receiverId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





exports.updateDateRequestStatus = async (req, res) => {
  try {
    const { id, slotId, senderId, receiverId } = req.query;
    const { status, slotStatus } = req.body;

    console.log("Query:", req.query);
    console.log("Body:", req.body);

    // ✅ Validations
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Document id is required in query",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Main document status is required",
      });
    }

    const allowedMainStatus = ["submitted", "accepted", "rejected"];
    if (!allowedMainStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid main status",
      });
    }

    // ✅ Prepare update
    let filter = { _id: id };
    let updateData = { status };

    if (slotId) {
      filter["dateSlots._id"] = slotId;

      if (slotStatus) {
        updateData["dateSlots.$.status"] = slotStatus;
      }
    }

    // ✅ Update DB
    const updatedRequest = await DateRequest.findOneAndUpdate(
      filter,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: "Document or slot not found",
      });
    }

    // 🔥 NOTIFICATION LOGIC STARTS HERE

    // 1. Get sender (who will receive notification)
    const sender = await User.findById(senderId)
      .select("fcmToken name")
      .lean();

    // 2. Get receiver (who accepted/rejected)
    const receiver = await User.findById(receiverId)
      .select("name profilephoto")
      .lean();

    // 3. Prepare message
    const title = "Date request status updated";
    const body = `✅ Your date request has been ${status} by ${receiver?.name}`;

    // 4. Save notification (for bell UI 🔔)
    await Notification.create({
      userId: senderId,
      title,
      body,
      type: "date request",
      isRead: false,
      AcceptingPersonImage: receiver?.profilephoto,
      receiverId: receiverId,
    });

    // 5. Send push notification
    if (sender?.fcmToken) {
      await sendPushNotification({
        token: sender.fcmToken,
        title,
        body,
        data: {
          senderId: String(senderId),
          receiverId: String(receiverId),
          status: String(status),
          type: "date_request_status",
        },
      });
    }

    // 🔥 RESPONSE
    return res.status(200).json({
      success: true,
      message: "Document status and slot status updated successfully",
      data: updatedRequest,
    });

  } catch (error) {
    console.error("Error updating date request:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};


exports.getDateRequestdata = async (req, res) => {
  try {
    const { receiverId, senderId } = req.query;
    const data = await DateRequest.find({
      senderId: senderId,
      receiverId: receiverId,
    });
    res.status(200).json({data, success:true})
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



