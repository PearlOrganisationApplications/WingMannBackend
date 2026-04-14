// const express = require('express');
// const dotenv = require('dotenv');
// const cors = require('cors');
// const connectDB = require('./config/db');
// const trackTraffic = require('./middlewares/traffic');
// const admin = require("firebase-admin");
// const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
// import { Server } from 'socket.io';
// // const serviceAccount = require("./firebase-service-account.json");
// dotenv.config();
// connectDB();

// const app = express();

// const httpServer = createServer(app);
// const io     = new Server(httpServer, { cors: { origin: '*' } });

// // Initialize Firebase Admin SDK
// // admin.initializeApp({
// //   credential: admin.credential.cert(serviceAccount)
// // });

// // Middlewares
// app.use(
//   cors({
//     origin: [
//       "http://localhost:5174",
//       "https://wingman-santosh.onrender.com",
//       'https://wingmann.online',
//       "http://localhost:5173"
//     ],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static('uploads'));
// app.use(trackTraffic)

// // Basic Routes (No controllers)
// const onboardingRoutes = require('./routes/onboardingRoutes');
// const authRoutes = require('./routes/auth.routes');
// const interviewerRoutes = require('./routes/interviewer.routes');
// const bookingRoutes = require('./routes/booking.routes');
// const feedbackRoutes = require("./routes/feedbackRoutes")
// const dateRequest = require('./routes/dateRequestRoutes');
// const callRequest = require('./routes/callRequestRoutes')

// // Health check
// app.get('/', (req, res) => {
//     res.status(200).json({
//         success: true,
//         message: 'Wingmann API is running 🚀'
//     });
// });

// // Example test route
// app.get('/api/test', (req, res) => {
//     res.json({
//         message: 'Test route working'
//     });
// });

// // API Routes
// app.use('/api/date-request',dateRequest )
// app.use('/api/call-request',callRequest )
// app.use('/api', onboardingRoutes);
// app.use('/api', authRoutes);
// app.use('/api', interviewerRoutes);
// app.use('/api', bookingRoutes);
// app.use("/api/feedback", feedbackRoutes);

// // app.get('/token', (req, res) => {
// //   const { channelName, uid } = req.query;

// //   if (!channelName) return res.status(400).json({ error: 'channelName required' });

// //   const appId      = process.env.AGORA_APP_ID;
// //   const appCert    = process.env.AGORA_APP_CERTIFICATE;
// //   const expiry     = Math.floor(Date.now() / 1000) + 3600; // 1 hour

// //   const token = RtcTokenBuilder.buildTokenWithUid(
// //     appId, appCert, channelName, uid || 0,
// //     RtcRole.PUBLISHER, expiry
// //   );

// //   res.json({ token, appId });
// // });

// // 404 handler

// const onlineUsers = new Map();

// io.on('connection', (socket) => {

//   // User registers their userId when they connect
//   socket.on('register', (userId) => {
//     onlineUsers.set(userId, socket.id);
//     console.log(`${userId} is online`);
//   });

//   // Caller initiates a call to a specific user
//   socket.on('call:invite', ({ fromUserId, toUserId, channelName }) => {
//     const targetSocket = onlineUsers.get(toUserId);
//     if (targetSocket) {
//       // Forward the invite to the callee
//       io.to(targetSocket).emit('incoming:call', { fromUserId, channelName });
//     } else {
//       socket.emit('call:error', { message: 'User is offline' });
//     }
//   });

//   // Callee accepts
//   socket.on('call:accept', async ({ fromUserId, toUserId, channelName }) => {
//     const callerSocket = onlineUsers.get(fromUserId);

//     // Generate tokens for both users
//     const makeToken = (uid) => RtcTokenBuilder.buildTokenWithUid(
//       process.env.AGORA_APP_ID,
//       process.env.AGORA_APP_CERTIFICATE,
//       channelName,
//       uid,
//       RtcRole.PUBLISHER,
//       Math.floor(Date.now() / 1000) + 3600
//     );

//     const calleeToken = makeToken(0);
//     const callerToken = makeToken(0);

//     // Send token + channel to both so they can join Agora
//     socket.emit('call:ready', { token: calleeToken, channelName, appId: process.env.AGORA_APP_ID });
//     if (callerSocket) {
//       io.to(callerSocket).emit('call:ready', { token: callerToken, channelName, appId: process.env.AGORA_APP_ID });
//     }
//   });

//   // Callee declines
//   socket.on('call:decline', ({ fromUserId }) => {
//     const callerSocket = onlineUsers.get(fromUserId);
//     if (callerSocket) {
//       io.to(callerSocket).emit('call:declined');
//     }
//   });

//   // Either user ends the call
//   socket.on('call:end', ({ toUserId }) => {
//     const targetSocket = onlineUsers.get(toUserId);
//     if (targetSocket) {
//       io.to(targetSocket).emit('call:ended');
//     }
//   });

//   socket.on('disconnect', () => {
//     // Clean up offline user
//     for (const [userId, sid] of onlineUsers.entries()) {
//       if (sid === socket.id) onlineUsers.delete(userId);
//     }
//   });
// });

// app.use((req, res) => {
//     res.status(404).json({
//         success: false,
//         message: 'Route not found'
//     });
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`🚀 Wingmann server running on port ${PORT}`);
// });

// httpServer.listen(4000, () => console.log('Server on :4000'));

const express = require("express");
const { createServer } = require("http"); // ✅ add this
const { Server } = require("socket.io"); // ✅ change import → require
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const trackTraffic = require("./middlewares/traffic");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

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
    console.log(
      `✅ Registered: "${userId}" (type: ${typeof userId}) → ${socket.id}`,
    );
    console.log(`📋 All online users:`, [...onlineUsers.keys()]);
  });

  socket.on("call:invite", ({ fromUserId, toUserId, channelName }) => {
    console.log(`📞 call:invite from "${fromUserId}" to "${toUserId}"`);
    console.log(`📋 Online users:`, [...onlineUsers.keys()]);
    console.log(`🔍 Looking up "${toUserId}" (type: ${typeof toUserId})`);
    console.log(`🎯 Found socket:`, onlineUsers.get(toUserId));

    const targetSocket = onlineUsers.get(toUserId);
    if (targetSocket) {
      io.to(targetSocket).emit("incoming:call", { fromUserId, channelName });
    } else {
      console.log(`❌ User "${toUserId}" not found in map`);
      socket.emit("call:error", { message: "User is offline" });
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
