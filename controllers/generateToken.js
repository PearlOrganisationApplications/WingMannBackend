const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

exports.generateAgoraToken = (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    const channelName = req.body.channelName;

    // ✅ Generate UNIQUE UID
    const uid = Math.floor(Math.random() * 100000);

    const role = RtcRole.PUBLISHER;

    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime =
      currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );

    return res.json({
      token,
      uid, // ✅ MUST SEND THIS
    });
  } catch (error) {
    console.error("Token Error:", error);
    return res.status(500).json({ error: "Token generation failed" });
  }
};