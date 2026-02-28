const mongoose = require("mongoose");

const matchProfileSchema = new mongoose.Schema(
  {
    photos: [
      {
        gender: {
          type: String,
          enum: ["male", "female"],
          required: true,
        },
        imgUrl: {
          type: String,
          required: true,
        },
      },
    ],

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MatchProfile", matchProfileSchema);