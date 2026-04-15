
const express = require("express");
const { createServer } = require("http"); // ✅ add this
const { Server } = require("socket.io"); // ✅ change import → require
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const trackTraffic = require("./middlewares/traffic");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const User = require('./models/user.model');

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app); // ✅ wrap express in http server
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://wingman-santosh.onrender.com",
      "https://wingmann.online",
    ],
    credentials: true,
  },
});

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "https://wingman-santosh.onrender.com",
      "https://wingmann.online",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(trackTraffic);

// Routes
const onboardingRoutes = require("./routes/onboardingRoutes");
const authRoutes = require("./routes/auth.routes");
const interviewerRoutes = require("./routes/interviewer.routes");
const bookingRoutes = require("./routes/booking.routes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const dateRequest = require("./routes/dateRequestRoutes");
const callRequest = require("./routes/callRequestRoutes");

app.get("/", (req, res) =>
  res
    .status(200)
    .json({ success: true, message: "Wingmann API is running 🚀" }),
);
app.get("/api/test", (req, res) => res.json({ message: "Test route working" }));

app.use("/api/date-request", dateRequest);
app.use("/api/call-request", callRequest);
app.use("/api", onboardingRoutes);
app.use("/api", authRoutes);
app.use("/api", interviewerRoutes);
app.use("/api", bookingRoutes);
app.use("/api/feedback", feedbackRoutes);

// Agora token endpoint
app.get("/token", (req, res) => {
  const { channelName, uid } = req.query;
  if (!channelName)
    return res.status(400).json({ error: "channelName required" });

  const token = RtcTokenBuilder.buildTokenWithUid(
    process.env.AGORA_APP_ID,
    process.env.AGORA_APP_CERTIFICATE,
    channelName,
    uid || 0,
    RtcRole.PUBLISHER,
    Math.floor(Date.now() / 1000) + 3600,
  );

  res.json({ token, appId: process.env.AGORA_APP_ID });
});

// Socket.IO — call signaling
const onlineUsers = new Map();

io.on("connection", (socket) => {
  // socket.on('register', (userId) => {
  //   onlineUsers.set(userId, socket.id);
  //   console.log(`✅ ${userId} is online`);
  // });
  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
   
   
  });

  socket.on("call:invite", async ({ fromUserId, toUserId, channelName }) => {
  

    const targetSocket = onlineUsers.get(toUserId);

    if (!targetSocket) {
    
      return socket.emit("call:error", { message: "User is offline" });
    }

    try {
      // 🔥 Fetch caller details
      const caller = await User.findById(fromUserId)
        .select("name profilePic")
        .lean();

     

      io.to(targetSocket).emit("incoming:call", {
        fromUserId,
        fromUserName: caller?.name || "Unknown",
        profilePic: caller?.profilephoto || "",
        channelName,
      });
    } catch (err) {
      console.error("❌ Error fetching caller:", err);
    }
  });

  socket.on("call:accept", ({ fromUserId, toUserId, channelName }) => {
    const callerSocket = onlineUsers.get(fromUserId);

    const makeToken = (uid) =>
      RtcTokenBuilder.buildTokenWithUid(
        process.env.AGORA_APP_ID,
        process.env.AGORA_APP_CERTIFICATE,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        Math.floor(Date.now() / 1000) + 3600,
      );

    const payload = {
      token: makeToken(0),
      channelName,
      appId: process.env.AGORA_APP_ID,
    };

    socket.emit("call:ready", payload);
    if (callerSocket) io.to(callerSocket).emit("call:ready", payload);
  });

  socket.on("call:decline", ({ fromUserId }) => {
    const callerSocket = onlineUsers.get(fromUserId);
    if (callerSocket) io.to(callerSocket).emit("call:declined");
  });

  socket.on("call:end", ({ toUserId }) => {
    const targetSocket = onlineUsers.get(toUserId);
    if (targetSocket) io.to(targetSocket).emit("call:ended");
  });

  socket.on("disconnect", () => {
    for (const [userId, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ ${userId} went offline`);
      }
    }
  });
});

// 404
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);

// ✅ ONE listen call — replaces both app.listen and httpServer.listen
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Wingmann server running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready on port ${PORT}`);
});
