const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            autoIndex: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

// Optional: connection events (helps in debugging)
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected');
});

mongoose.connection.on('error', (err) => {
    console.log('Mongoose error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

module.exports = connectDB;