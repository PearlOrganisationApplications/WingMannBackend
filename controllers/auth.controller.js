const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id, role) => {
    console.log('Generating JWT for:', id, role);
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Role-based registration
const register = async (req, res) => {
    console.log('Register endpoint hit');
    console.log('Request body:', req.body);

    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            console.log('Missing fields in request');
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        console.log('Checking if user already exists:', email);
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        console.log('Creating new user:', { name, email, role });
        const user = await User.create({ name, email, password, role });
        console.log('User created successfully:', user._id);

        const token = generateToken(user._id, user.role);
        console.log('Generated token:', token);

        res.status(201).json({
            success: true,
            message: `${role} registered successfully`,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
            }
        });

    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Login
const login = async (req, res) => {
    console.log('Login endpoint hit');
    console.log('Request body:', req.body);

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        console.log('Looking for user with email:', email);
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        console.log('Password match result:', isMatch);
        if (!isMatch) {
            console.log('Incorrect password for user:', email);
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user._id, user.role);
        console.log('Generated token:', token);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
            }
        });

    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login };