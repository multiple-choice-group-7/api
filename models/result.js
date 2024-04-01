const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answers: [
        {
            question: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Question',
                required: true
            },
            answer: {
                type: Number,
                required: true
            }
        }
    ],
    totalTime: {
        type: Number,
        required: true
    },
    correctNumber: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    isPassed: {
        type: Boolean,
        required: true
    }
});

module.exports = mongoose.model('Result', resultSchema);