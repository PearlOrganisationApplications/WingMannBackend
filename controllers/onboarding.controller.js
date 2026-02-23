const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');


// ✅ CREATE (Onboarding)
const onboarding = async (req, res, next) => {
    try {
        const user = await User.create(req.body);

        const token = jwt.sign(
            { id: user._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            _id: user._id,
            token
        });

    } catch (err) {
        next(err);
    }
};


// ✅ GET ALL USERS
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (err) {
        next(err);
    }
};


// ✅ GET USER BY ID
const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (err) {
        next(err);
    }
};


// ✅ UPDATE USER
const updateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (err) {
        next(err);
    }
};


module.exports = {
    onboarding,
    getAllUsers,
    getUserById,
    updateUser
};