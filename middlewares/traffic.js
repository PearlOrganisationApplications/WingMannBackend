const Traffic = require("../models/trafficSchema");

const trackTraffic = async (req, res, next) => {
  try {

    await Traffic.create({
      ip: req.ip,
      page: req.originalUrl
    });

  } catch (error) {
    console.log("Traffic error:", error);
  }

  next();
};

module.exports = trackTraffic;