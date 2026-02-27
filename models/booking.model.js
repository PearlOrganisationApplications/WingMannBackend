const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId,ref: "User", required: true }, // store user _id
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    day: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    meetLink: { type: String, required: true },
    status: {
      type: String,
      enum: ["submitted", "accepted", "rejected"],
      default: "submitted",
    },

    rejectionReason: {
      type: String,
      trim: true,
      required: function () {
        return this.status === "rejected";
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
