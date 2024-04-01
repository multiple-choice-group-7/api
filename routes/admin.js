const express = require('express');
const {body} = require('express-validator');
const {isAuth, isAdmin} = require('../utils/check-role');

const router = express.Router();

const User = require('../models/user');
const adminController = require('../controllers/admin');

// Get the data of all exams, users, and results
// GET /api/v1/admin/dashboard
router.get('/dashboard', [isAuth, isAdmin], adminController.getDashboard);

// Get all questions for creating a new exam
// GET /api/v1/admin/exam/new
router.get('/exam/new', [isAuth, isAdmin], adminController.getQuestionsForExam);

// Create a new question
// POST /api/v1/admin/question/new
router.post('/question/new', [isAuth, isAdmin], [
    body('question').isString().isLength({min: 10}),
    body('options').isArray({min: 4, max: 4}),
    body('answer').isNumeric().isInt({min: 0, max: 3}),
    body('explaination').isString().isLength({min: 10}),
], adminController.createQuestion);

// Get the data of a specific question
// GET /api/v1/admin/question/:questionId
router.get('/question/:questionId', [isAuth, isAdmin], adminController.getQuestionById);

// Update the data of a specific question
// PUT /api/v1/admin/question/:questionId
router.put('/question/:questionId', [isAuth, isAdmin], [
    body('question').isString().isLength({min: 10}),
    body('options').isArray({min: 4, max: 4}),
    body('answer').isNumeric().isInt({min: 0, max: 3}),
    body('explaination').isString().isLength({min: 10}),
], adminController.updateQuestion);

// Delete a specific question
// DELETE /api/v1/admin/question/:questionId
router.delete('/question/:questionId', [isAuth, isAdmin], adminController.deleteQuestion);

// Create a new exam
// POST /api/v1/admin/exam/new
router.post('/exam/new', [isAuth, isAdmin], [
    body('title').isString().isLength({min: 10}),
    body('description').isString().isLength({min: 10}),
    body('type').isString().isIn(['practice', 'midterm', 'final']),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('questions').isArray({min: 3}),
    body('passingScore').isNumeric().isInt({min: 0, max: 10}),
], adminController.createExam);

// Get the data of a specific exam
// GET /api/v1/admin/exam/:examId
router.get('/exam/:examId', [isAuth, isAdmin], adminController.getExamById);

// Update the data of a specific exam
// PUT /api/v1/admin/exam/:examId
router.put('/exam/:examId', [isAuth, isAdmin], [
    body('title').isString().isLength({min: 10}),
    body('description').isString().isLength({min: 10}),
    body('type').isString().isIn(['practice', 'midterm', 'final']),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('questions').isArray({min: 3}),
    body('isFinished').isBoolean(),
    body('passingScore').isNumeric().isInt({min: 0, max: 10}),

], adminController.updateExam);

// Delete a specific exam
// DELETE /api/v1/admin/exam/:examId
router.delete('/exam/:examId', [isAuth, isAdmin], adminController.deleteExam);

// Create a new user
// POST /api/v1/admin/user/new
router.post('/user/new', [isAuth, isAdmin], [
    body('username').isString().isLength({min: 3}),
    body('email').isEmail().custom((value, {req}) => {
        return User.findOne({email: value}).then(user => {
            if (user) {
                return Promise.reject('Email already exists!');
            }
        })
    }),
    body('password').isString().isLength({min: 6}),
    body('role').isString().isIn(['student', 'admin']),
    body('idStudent').isString().isLength({min: 10, max: 10}).custom((value, {req}) => {
        if (req.body.role === 'student') {
            return User.findOne({idStudent: value}).then(user => {
                if (user) {
                    return Promise.reject('ID Student already exists!');
                }
                return value;
            })
        }
        return true;
    }),
], adminController.createUser);

// Get the data of a specific user
// GET /api/v1/admin/user/:userId
router.get('/user/:userId', [isAuth, isAdmin], adminController.getUserById);

// Update the data of a specific user
// PUT /api/v1/admin/user/:userId
router.put('/user/:userId', [isAuth, isAdmin], [
    body('username').isString().isLength({min: 3}),
    body('email').isEmail().custom((value, {req}) => {
        return User.findOne({email: value}).then(user => {
            if (user && user._id.toString() !== req.params.userId.toString()) {
                return Promise.reject('Email already exists!');
            }
        })
    }),
    body('password').isString().isLength({min: 6}),
    body('role').isString().isIn(['student', 'admin']),
    body('idStudent').isString().isLength({min: 10, max: 10}).custom((value, {req}) => {
        if (req.body.role === 'student') {
            return User.findOne({idStudent: value}).then(user => {
                if (user && user._id.toString() !== req.params.userId.toString()) {
                    return Promise.reject('ID Student already exists!');
                }
                return value;
            })
        }
        return true;
    })
], adminController.updateUser);

// Delete a specific user
// DELETE /api/v1/admin/user/:userId
router.delete('/user/:userId', [isAuth, isAdmin], adminController.deleteUser);

// Get the statistics of a student
// GET /api/v1/admin/statistics
router.get('/statistics', [isAuth, isAdmin], adminController.getStatistics);

// Get the results of students
// GET /api/v1/admin/results
router.get('/results', [isAuth, isAdmin], adminController.getDetailResult);

module.exports = router;