const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: String,
    body: String,
    type: { type: String, enum: ["call request", "date request", "interview_status"] },
    isRead: { type: Boolean, default: false },
    AcceptingPersonImage:String,
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);