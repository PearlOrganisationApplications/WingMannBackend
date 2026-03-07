const mongoose = require("mongoose");

const callRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestType: {
      type: String,
      enum: ["call request", "date request"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CallRequest", callRequestSchema);
