const mongoose = require("mongoose");

const restaurentModel = new mongoose.Schema(
  {
    photo: {
      type: String,
      required: true,
    },

    venue: {
      type: String,
      enum: ["restaurant", "cafe"],
      required: true,
    },

    businessName: {
      type: String,
      required: true,
    },

    address: {
      streetAddress: {
        type: String,
        required: true,
      },
      cityState: {
        type: String,
        required: true,
      },
      googleMapLink: {
        type: String,
        required: true,
      },
    },

    typeOfFood: {
      type: String,
      required: true,
    },

    budgetPerPerson: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("restaurentModel", restaurentModel);