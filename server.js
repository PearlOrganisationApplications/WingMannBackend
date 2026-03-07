const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const trackTraffic = require('./middlewares/traffic');
dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "https://wingman-santosh.onrender.com",
      'https://wingmann.online'
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(trackTraffic)

// Basic Routes (No controllers)
const onboardingRoutes = require('./routes/onboardingRoutes');
const authRoutes = require('./routes/auth.routes');
const interviewerRoutes = require('./routes/interviewer.routes');
const bookingRoutes = require('./routes/booking.routes');
const feedbackRoutes = require("./routes/feedbackRoutes")

// Health check
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Wingmann API is running 🚀'
    });
});

// Example test route
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Test route working'
    });
});

// API Routes
app.use('/api', onboardingRoutes);
app.use('/api', authRoutes);
app.use('/api', interviewerRoutes);
app.use('/api', bookingRoutes);
app.use("/api/feedback", feedbackRoutes)

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Wingmann server running on port ${PORT}`);
});