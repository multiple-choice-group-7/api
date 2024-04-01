const {validationResult} = require('express-validator');

const Exam = require('../models/exam');
const Question = require('../models/question');
const Result = require('../models/result');

exports.getExams = async (req, res, next) => {
    try {
        const title = req.query.title;
        const isFinished = req.query.isFinished;
        let query = {};
        if (title) {
            query.title = title;
        }
        if (isFinished) {
            query.isFinished = isFinished;
        }
        const exams = await Exam.find(query);
        if (!exams) {
            const error = new Error('Exams not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: 'Exams fetched', data: exams});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getExamById = async (req, res, next) => {
    const examId = req.params.examId;
    try {
        const exam = await Exam.findById(examId).populate({
            path: 'questions',
            populate: {
                path: 'question',
                model: 'Question',
                select: 'question options _id'
            }
        });
        if (!exam) {
            const error = new Error('Exam not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: 'Exam fetched', data: exam});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.submitExam = async (req, res, next) => {
    const examId = req.params.examId;
    const userId = req.userId;
    const answers = req.body.answers;
    const totalTime = req.body.totalTime;
    try {
        const exam = await Exam.findById(examId).populate('questions');
        if (!exam) {
            const error = new Error('Exam not found');
            error.statusCode = 404;
            throw error;
        }
        let score = 0;
        let cnt = 0;
        for (let i = 0; i < answers.length; i++) {
            if (exam.questions[i].answer === answers[i]) {
                score+=exam.questions[i].mark;
                cnt++;
            }
        }
        
        const isPassed = score >= exam.passingScore;

        const result = new Result({
            exam: examId,
            user: userId,
            score: score,
            totalTime: totalTime,
            isPassed: isPassed,
            correctNumber: cnt,
            answers: exam.questions.map((question, index) => {
                return {
                    question: question.question._id,
                    answer: answers[index]
                }
            })
        });
        await result.save();
        res.status(201).json({message: 'Exam submitted', data: result});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getResult = async (req, res, next) => {
    const userId = req.userId;
    try {
        const results = await Result.find({user: userId})
            .populate({
                path: 'exam',
                select: 'title passingScore description type startTime endTime isFinished -_id'
            }).populate({
                path: 'answers.question',
            }).populate({
                path: 'user',
                select: 'fullname idStudent -_id'
            });
        if (!results) {
            const error = new Error('Results not found');
            error.statusCode = 404;
            throw error;
        }
        const formatRes = {
            ...results[0]._doc,
            totalQuestion: results[0].answers.length,
        }
        res.status(200).json({message: 'Results fetched', data: formatRes});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

