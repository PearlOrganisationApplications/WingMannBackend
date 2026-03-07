const DateRequest = require("../models/dateRequest");

exports.createDateRequest = async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      requestType,
      locationType,
      location,
      budget,
      mealType,
      payType,
      dateSlots,
    } = req.body;

    // basic validation
    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "senderId and receiverId are required",
      });
    }

    if (!locationType || !location || !mealType || !payType || !dateSlots) {
      return res.status(400).json({
        success: false,
        message:
          "locationType, location, mealType, payType, dateSlots are required",
      });
    }

    // dateSlots must be array
    if (!Array.isArray(dateSlots) || dateSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "dateSlots must be a non-empty array",
      });
    }

    // mealType must be array
    const finalMealType = Array.isArray(mealType) ? mealType : [mealType];

    const newRequest = await DateRequest.create({
      senderId,
      receiverId,
      requestType: requestType || "date req",
      locationType,
      location,
      budget: budget ?? null,
      mealType: finalMealType,
      payType,
      dateSlots,
      status: null, // pending
    });

    return res.status(201).json({
      success: true,
      message: "Date request created successfully",
      data: newRequest,
    });
  } catch (error) {
    console.log(error, error.message);
    
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDateRequestsForReceiver = async (req, res) => {
  try {
    const receiverId = req.params.id;

    const requests = await DateRequest.find({ receiverId })
      .populate("senderId", "name")
      .populate("receiverId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: requests.length,
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// isme bhi count return hoga ,, total planned dates, total date request ye sab summary me ayega 