const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [
        {
            type: String,
            required: true
        }
    ],
    answer: {
        type: Number,
        required: true
    },
    explaination: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Question', questionSchema);