const admin = require("../config/firebaseAdmin");

const sendPushNotification = async ({ token, title, body, data = {} }) => {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data,
    };

    const response = await admin.messaging().send(message);
    console.log("Push sent:", response);
    return response;
  } catch (error) {
    console.error("Push notification error:", error);
    throw error;
  }
};

module.exports = sendPushNotification;