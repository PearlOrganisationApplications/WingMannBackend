const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    question: { 
        type: Number, 
        required: true 
    },
    selectedOption: { 
        type: mongoose.Schema.Types.Mixed, // supports string/number
        required: true 
    }
}, { _id: false });

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
    answers: {
        type: [answerSchema],
        validate: {
            validator: function (answers) {
                const questions = answers.map(a => a.question);
                return new Set(questions).size === questions.length;
            },
            message: "Duplicate questions are not allowed"
        }
    },
    attemptedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);