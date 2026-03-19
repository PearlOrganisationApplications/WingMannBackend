const admin = require("../config/firebaseAdmin");

const sendPushNotification = async ({ token, title, body, data = {} }) => {
  try {
    const message = {
      token,

      // ✅ For foreground + notification UI
      notification: {
        title,
        body,
      },

      // ✅ IMPORTANT (must be string values only)
      data: Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, String(value)])
      ),

      // ✅ Web push config (for better support)
      webpush: {
        notification: {
          title,
          body,
          icon: "/logo192.png",
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Push sent:", response);

    return response;
  } catch (error) {
    console.error("❌ Push notification error:", error);
    throw error;
  }
};

module.exports = sendPushNotification;