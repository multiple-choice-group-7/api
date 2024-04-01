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
    body('answers').isArray({min: 3}),
    body('totalTime').isNumeric().isInt({min: 1}),
], examController.submitExam);

// Get the result of a specific exam
// GET /api/v1/exam/result/:examId
router.get('/result/:examId', isAuth, examController.getResult);

module.exports = router;