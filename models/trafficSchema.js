const mongoose = require('mongoose');

const trafficSchema = new mongoose.Schema({
  ip: String,
  page: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Traffic", trafficSchema);