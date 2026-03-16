const DateRequest = require("../models/dateRequest");

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
    const { id, slotId } = req.query;
    const { status, slotStatus } = req.body;

    console.log("Query:", req.query);
    console.log("Body:", req.body);

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

    let filter = { _id: id };
    let updateData = {
      status: status,
    };

    if (slotId) {
      filter["dateSlots._id"] = slotId;

      if (slotStatus) {
        updateData["dateSlots.$.status"] = slotStatus;
      }
    }

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



