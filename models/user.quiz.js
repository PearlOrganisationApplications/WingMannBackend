const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizName: {
        type: String,
        required: true,
        enum: [
            'Lifestyle & Value',
            'Emotional Communication',
            'Attachment & Comfort Zone',
            'Conflict & Repair Patterns',
            'Growth, Readiness & Emotional Maturity'
        ]
    },
    answers: [
        {
            question: { type: String, required: true },
            selectedOption: { type: String, required: true }
        }
    ],
    attemptedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
 
module.exports = mongoose.model('Quiz', quizSchema);