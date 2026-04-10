const Interviewer = require("../models/interviewer.model");
const Booking = require("../models/booking.model");
const Notification = require("../models/notification");
const User = require("../models/user.model"); // optional if you want to fetch user info
const sendPushNotification = require("../utils/sendPushNotification");
const {getAcceptedTemplate,getRejectedTemplate,sendEmailonInterview } = require('../utils/emailTemplates')
// Helper: generate pseudo Google Meet link
const generateMeetLink = () => {
  const randomCode = Math.random().toString(36).substring(2, 11); // 9-char random
  return `https://meet.google.com/${randomCode}`;
};


// POST: book a slot with userId in params
const bookSlot = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userName, userEmail, day, date, time, interviewerId } = req.body;

    console.log(userName, userEmail, day, date, time, interviewerId);

    // ✅ Validation
    if (
      !userId ||
      !userName ||
      !userEmail ||
      !day ||
      !date ||
      !time ||
      !interviewerId
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const cleanedTime = time.split(" ")[0]; // "14:00"

    // 1️⃣ Find interviewer by ID
    const interviewer = await Interviewer.findOne({ user: interviewerId });

    if (!interviewer) {
      return res.status(404).json({
        success: false,
        message: "Interviewer not found",
      });
    }

    // 2️⃣ Check availability
    const slotExists = interviewer.availability.some((slot) => {
      return (
        slot.day === day &&
        new Date(slot.date).toISOString() === new Date(date).toISOString() &&
        slot.times.includes(cleanedTime)
      );
    });

    if (!slotExists) {
      return res.status(400).json({
        success: false,
        message: "Selected slot is no longer available",
      });
    }

    // 3️⃣ Generate meet link
    const meetLink = generateMeetLink();

    // 4️⃣ Save booking
    const booking = await Booking.create({
      userId,
      userName,
      userEmail,
      day,
      date,
      time,
      interviewer: interviewer.user,
      meetLink,
    });

    await interviewer.save();

    // 6️⃣ Response
    res.json({
      success: true,
      message: "Slot booked successfully",
      data: {
        booking: {
          _id: booking._id,
          userId: booking.userId,
          userName: booking.userName,
          userEmail: booking.userEmail,
          day: booking.day,
          date: booking.date,
          time: booking.time,
          interviewer: {
            _id: interviewer._id,
            name: interviewer.name,
          },
          meetLink: booking.meetLink,
        },
        meetLink,
      },
    });
  } catch (error) {
    console.log("Booking error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const ComfirmInterviewStatus = async (req, res) => {
  try {
    const { doc_id } = req.params;
    const { userId, meetLink, dates, time } = req.body;
    const senderId = userId;

    if (!doc_id) {
      return res.status(400).json({
        success: false,
        message: "doc_id is required",
      });
    }

    // ✅ Update Interview Status
    const interview = await Booking.findByIdAndUpdate(
      doc_id,
      { status: "submitted" },
      { new: true },
    );

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    // 🔥 NOTIFICATION LOGIC STARTS HERE

    // 1. Sender (who will receive notification)
    const sender = await User.findById(senderId).select("fcmToken name").lean();

    // 2. Receiver (who confirmed schedule)

    // 3. Message
    const title = "Interview Schedule 🎉";
   

    const body = `📅 Your interview has been scheduled successfully on ${dates} at ${time}. <a href="https://meet.google.com/f78gmsy8f">Click here to join</a>`;

    // 4. Save notification (DB)
    await Notification.create({
      userId: senderId,
      title,
      body,
      type: "interview_schedule",
      isRead: false,
      AcceptingPersonImage:
        "https://media.istockphoto.com/id/691856234/vector/flat-round-check-mark-green-icon-button-tick-symbol-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=hXL5nXQ2UJlh4yzs2LyZC4GtctQG0fs-mk30GPPbhbQ=",
      receiverId: null,
    });

    // 5. Push Notification (FCM)
   if (sender?.fcmTokens?.length > 0) {
  const token = sender.fcmTokens[0]; // ✅ first device only

  try {
    await sendPushNotification({
      token,
      title,
      body,
      data: {
        senderId: String(senderId),
        receiverId: String(receiverId),
  
        type: "call_request_status",
      },
    });
  } catch (err) {
    console.error("FCM Error:", err.message);

    // ❌ Remove invalid token
    if (err.message.includes("unregistered")) {
      await User.findByIdAndUpdate(senderId, {
        $pull: { fcmTokens: token },
      });
    }
  }
}

    // ✅ RESPONSE
    res.status(200).json({
      success: true,
      message: "Interview confirmed and notification sent",
      data: interview,
    });
  } catch (error) {
    console.error("Error confirming interview:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// GET all bookings
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate(
      "interviewer",
      "user availability",
    );
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Find all bookings for this user
    const bookings = await Booking.find({ interviewer: userId }).populate(
      "interviewer",
      "user availability",
    ).sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No bookings found for this user" });
    }

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.log("Error fetching user bookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllInterScheduled = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await Booking.find({ interviewer: userId });
    res.status(200).json({
      success: true,
      message: "get all interview",
      inteview: data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const getSpecificInterview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const data = await Booking.findOne({ _id: bookingId })
      .populate("interviewer", "name email gender location -_id")
      .populate("userId");
    res.status(200).json({
      success: true,
      message: "interview detail",
      inteview: data,
    });
    console.log(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const postInterviewStatus = async (req, res) => {
  console.log("running ............");

  try {
    const { bookingId } = req.params;
    const { status, rejectionReason } = req.body;

    if (status === "rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when status is rejected",
      });
    }

    const updateData = {
      status,
      rejectionReason: status === "rejected" ? rejectionReason : undefined,
    };

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // ✅ 🔥 NEW: Fetch User + Interviewer
    const user = await User.findById(updatedBooking.userId)
      .select("fcmToken name profilephoto")
      .lean();

    const interviewer = await User.findById(updatedBooking.interviewer)
      .select("name profilephoto")
      .lean();

    // ✅ 🔥 Notification Content
    let title = "Interview Update";
    let body = "";

    if (status === "accepted") {
      // body = `✅ Your interview has been accepted by ${interviewer?.name}. Join here: ${updatedBooking?.meetLink}`;
      body = `
  <p>
    ✅ Your interview has been accepted by ${interviewer?.name}.
    <a 
      href="${updatedBooking?.meetLink}" 
      target="_blank" 
      style="color: blue; text-decoration: underline;"
    >
      Join here
    </a>
  </p>
`;
    } else if (status === "rejected") {
      body = `❌ Your interview was rejected by ${interviewer?.name}`;
    } else {
      body = `📢 Interview status updated to ${status}`;
    }

    // ✅ 🔥 Save Notification
    await Notification.create({
      userId: updatedBooking.userId,
      title,
      body,
      type: "interview_status",
      isRead: false,
      AcceptingPersonImage: interviewer?.profilephoto || "",
      receiverId: updatedBooking.interviewer,
    });

    console.log("Notification saved");

    // ✅ 🔥 Push Notification
    if (user?.fcmToken) {
      await sendPushNotification({
        token: user.fcmToken,
        title,
        body: `✅ Interview accepted by ${interviewer?.name}.`,
        data: {
          bookingId: String(bookingId),
          type: "interview_status_update",
          status: status,
        },
      });
    }

   if (user?.email) {
  let emailData;

  if (status === "accepted") {
    emailData = getAcceptedTemplate(
      user.name,
   
    );
  } else if (status === "rejected") {
    emailData = getRejectedTemplate(
      user.name,
      rejectionReason
    );
  }

  if (emailData) {
    await sendEmailonInterview(user.email, emailData.subject, emailData.html);
    console.log("📧 Email sent");
  }
}

    // ✅ Response
    res.status(200).json({
      success: true,
      message: "Interview status updated successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  bookSlot,
  getBookings,
  getUserBookings,
  getAllInterScheduled,
  getSpecificInterview,
  postInterviewStatus,
  ComfirmInterviewStatus,
};
