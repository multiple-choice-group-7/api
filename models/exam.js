const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    typeExam: 
    {
        type: String,
        required: true
    },
    typeTime: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
    },
    endTime: {
        type: Date,
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