const mongoose = require("mongoose");

const dateRequestSchema = new mongoose.Schema(
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
      enum: ["call req", "date req"],
      required: true,
      default: "date req",
    },

    // location type
    locationType: {
      type: String,
      enum: ["Restaurant", "Cafe"],
      required: true,
    },


    budget: {
      type: String,
      default: null, // you said: null or string
    },

    mealType: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "mealType must have at least 1 value",
      },
    },

    payType: {
      type: String,
      enum: ["him", "split", "her"],
      required: true,
    },

    // dateSlot array: date + day separate
    dateSlots: [
      {
        date: { type: String, required: true }, // example: "2026-02-06"
        day: { type: String, required: true },  // example: "Friday",
        time:{ type: String, required: true}
      },
    ],

    // null = pending, true = confirm, false = reject
    status: {
      type: Boolean,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DateRequest", dateRequestSchema);
