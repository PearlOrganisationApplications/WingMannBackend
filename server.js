const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Basic Routes (No controllers)
const onboardingRoutes = require('./routes/onboardingRoutes');

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