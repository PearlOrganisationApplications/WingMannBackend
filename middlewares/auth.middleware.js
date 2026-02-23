const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Protect routes
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        req.user.role = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
    }
};

// Role middleware
const authorizeRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: `Role ${req.user.role} not allowed` });
    }
    next();
};

module.exports = { protect, authorizeRoles };