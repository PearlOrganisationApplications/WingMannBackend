const mongoose = require("mongoose");

const callSessionSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    callType: {
      type: String,
      enum: ["audio", "video"],
      required: true
    },

    status: {
      type: String,
      enum: ["RINGING", "ACCEPTED", "REJECTED", "ENDED", "MISSED"],
      default: "RINGING"
    },

    acceptedAt: Date,
    endedAt: Date,

    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CallSession", callSessionSchema);
