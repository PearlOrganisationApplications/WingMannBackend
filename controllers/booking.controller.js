const Interviewer = require("../models/interviewer.model");
const Booking = require("../models/booking.model");
const User = require("../models/user.model"); // optional if you want to fetch user info

// Helper: generate pseudo Google Meet link
const generateMeetLink = () => {
  const randomCode = Math.random().toString(36).substring(2, 11); // 9-char random
  return `https://meet.google.com/${randomCode}`;
};

// POST: book a slot with userId in params
const bookSlot = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userName, userEmail, day, date, time } = req.body;
    console.log(userName, userEmail, day, date, time);

    // Validate required fields
    if (!userId || !userName || !userEmail || !day || !date || !time) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const cleanedTime = time.split(" ")[0]; 
 

    // 1️⃣ Find all interviewers with this slot available
    const interviewers = await Interviewer.find({
      availability: { $elemMatch: { day, date: date, times: { $in: [cleanedTime] }  } },
    });

    if (interviewers.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No interviewers available for this slot",
        });
    }

    // 2️⃣ Randomly pick one interviewer
    const randomIndex = Math.floor(Math.random() * interviewers.length);
    const selectedInterviewer = interviewers[randomIndex];

    // 3️⃣ Generate pseudo Google Meet link
    const meetLink = generateMeetLink();

    // 4️⃣ Save booking
    const booking = await Booking.create({
      userId,
      userName,
      userEmail,
      day,
      date,
      time,
      interviewer: selectedInterviewer.user,
      meetLink,
    });

    // Optional: remove booked time from interviewer's availability
    selectedInterviewer.availability = selectedInterviewer.availability.map(
      (slot) => {
        if (slot.day === day && slot.date === date) {
          slot.times = slot.times.filter((t) => t !== time);
        }
        return slot;
      },
    );
    await selectedInterviewer.save();

    // 5️⃣ Include interviewer _id and name in response
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
            _id: selectedInterviewer._id,
            name: selectedInterviewer.name,
          },
          meetLink: booking.meetLink,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        },
        meetLink,
      },
    });
  } catch (error) {
    console.log("Booking error:", error);
    res.status(500).json({ success: false, message: error.message });
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
    const bookings = await Booking.find({ userId }).populate(
      "interviewer",
      "user availability",
    );

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

const getAllInterScheduled = async (req, res)=>{
  try{
    const {userId } = req.params;
    const data = await Booking.find({interviewer:userId});
    res.status(200).json({
      success:true,
      message: "get all interview" ,
      inteview : data
    })
  }catch(error){
    console.log(error);
     res.status(500).json({ success: false, message: error.message });
  }
}
const getSpecificInterview= async (req, res)=>{
  try{
    const {bookingId} =req.params;
     const data = await Booking
  .findOne({ _id: bookingId })
  .populate('interviewer', 'name email gender location -_id')
  .populate('userId');
    res.status(200).json({
      success:true,
      message: "interview detail" ,
      inteview : data
    })
    console.log(data)


  }catch(error){
    console.log(error);
     res.status(500).json({ success: false, message: error.message });
  }
}

const postInterviewStatus = async (req, res) => {
  console.log("running ............");

  try {
    const { bookingId } = req.params;
    const { status, rejectionReason } = req.body;

    console.log("booking:", bookingId, "status:", status);

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
        runValidators: true, // 🔥 VERY IMPORTANT
      }
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    console.log("updated:", updatedBooking);

    res.status(200).json({
      success: true,
      message: "Interview status updated successfully",
      booking: updatedBooking,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { bookSlot, getBookings, getUserBookings, getAllInterScheduled, getSpecificInterview, postInterviewStatus };
