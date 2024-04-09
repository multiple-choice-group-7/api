const {validationResult} = require('express-validator');

const Exam = require('../models/exam');
const Question = require('../models/question');
const Result = require('../models/result');
const question = require('../models/question');

exports.getExams = async (req, res, next) => {
    try {
        const title = req.query.title;
        const typeTime = req.query.typeTime;
        let query = {};
        if (title) {
            query.title = {$regex: title, $options: 'i'};
        }
        if (typeTime) {
            query.typeTime = typeTime;
        }
        const exams = await Exam.find(query).select('title description passingScore typeExam typeTime startTime endTime isFinished');
        if (!exams) {
            const error = new Error('Exams not found');
            error.statusCode = 404;
            throw error;
        }
        const freeExams = exams.filter(exam => exam.typeTime === 'free');
        const limitedExams = exams.filter(exam => exam.typeTime === 'limited');
        res.status(200).json({message: 'Exams fetched', freeExams: freeExams, limitedExams: limitedExams});
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
        const result = await Result.findOne({exam: examId, user: req.userId});
        if (result) {
            const error = new Error('You have already done this exam');
            error.statusCode = 403;
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
        const check = await Result.findOne({exam: examId, user: userId});
        if (check) {
            const error = new Error('You have already done this exam');
            error.statusCode = 403;
            throw error;
        }
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
        res.status(201).json({message: 'Exam submitted'});
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
                select: 'title passingScore description typeExam typeTime startTime endTime isFinished -_id'
            }).populate({
                path: 'answers.question',
            }).populate({
                path: 'user',
                select: 'fullname idStudent -_id'
            });
        if (!results || results.length === 0) {
            const error = new Error('Results not found');
            error.statusCode = 404;
            throw error;
        }
        // Format the result with answers of student has name studentAnswer instead of answer
        const newRes = results.map(result => {
            const newAnswers = result.answers.map(answer => {
                return {
                    // Remove the answer field
                    question: answer.question,
                    studentAnswer: answer.answer
                }
            });
            return {
                ...result._doc,
                answers: newAnswers
            }
        });
        const formatRes = {
            ...newRes[0],
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

