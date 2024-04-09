const express = require('express');
const {body} = require('express-validator');

const {isAuth} = require('../utils/check-role');

const examController = require('../controllers/exam');

const router = express.Router();

// Get all exams
// GET /api/v1/exam
router.get('/', isAuth, examController.getExams);

// Get the data of a specific exam for testing
// GET /api/v1/exam/:examId
router.get('/:examId', isAuth, examController.getExamById);

// Submit the exam
// POST /api/v1/exam/:examId
router.post('/:examId', isAuth, [
    body('answers').isArray({min: 3}).custom((value) => {
        for(const answer of value) {
            if (typeof answer !== 'object' ||
            !answer.hasOwnProperty('answer') || 
            !answer.hasOwnProperty('questionId') || 
            typeof answer.answer !== 'number' || 
            !Number.isInteger(answer.answer) || 
            answer.answer < 0 || answer.answer > 3) {
                return Promise.reject('Answers must be an array of objects with answer and questionId properties, answer must be a number, and answer must be an integer between 0 and 3');
            }
        }
        return true;
    }),
    body('totalTime').isNumeric().isInt({min: 1}),
], examController.submitExam);

// Get the result of a specific exam
// GET /api/v1/exam/result/:examId
router.get('/result/:examId', isAuth, examController.getResult);

module.exports = router;