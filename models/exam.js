const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    type: 
    {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    questions: [
        {
            question: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Question',
                required: true
            },
            mark: {
                type: Number,
                required: true
            }
        },
    ],
    isFinished: {
        type: Boolean,
        default: false
    },
    passingScore: {
        type: Number,
        required: true
    
    }
});

module.exports = mongoose.model('Exam', examSchema);