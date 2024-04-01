const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Exam = require('../models/exam');
const Question = require('../models/question');
const Result = require('../models/result');

exports.getDashboard = async (req, res, next) => {
    try {
        const users = await User.find();
        if(!users) {
            const error = new Error('Users not found');
            error.statusCode = 404;
            throw error;
        }

        let exams = await Exam.find();
        let results = [];
        if(!exams || exams.length === 0) {
            exams = "No exams found";
        } else {
            exams.forEach(async exam => {
                const result = await Result.find({exam: exam._id});
    
                // calculate the average score of the exam
                let total = 0;
                let count = 0;
                result.forEach(res => {
                    total += res.score;
                    count++;
                });
                const average = total / count;
    
                // calculate the percentage of students who passed the exam
                let passCount = 0;
                result.forEach(res => {
                    if(res.isPassed) {
                        passCount++;
                    }
                });
                const passPercentage = (passCount / count) * 100;
    
                results.push({
                    exam: exam.title,
                    average: average,
                    passPercentage: passPercentage
                });
            });
        }

        if(!results || results.length === 0) {
            results = "No results found";
        }

        res.status(200).json({
            message: 'Data fetched successfully',
            users: users,
            exams: exams,
            results: results
        });
    } catch (err) {
        err.statusCode = 500;
        next(err);
    }
}

exports.getQuestionsForExam = async (req, res, next) => {
    try {
        const questions = await Question.find();
        if(!questions) {
            const error = new Error('Questions not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({message: 'Questions fetched successfully', questions: questions, type: ['practice', 'midterm', 'final']});
    } catch (err) {
        err.statusCode = 500;
        next(err);
    }
}

exports.createQuestion = async (req, res, next) => {
    const errors = validationResult(req);
    const question = req.body.question;
    const options = req.body.options;
    const answer = req.body.answer;
    const explaination = req.body.explaination;

    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const newQuestion = new Question({
            question: question,
            options: options,
            answer: answer,
            explaination: explaination
        });

        const result = await newQuestion.save();
        res.status(201).json({message: 'Question created!', questionId: result._id});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getQuestionById = async (req, res, next) => {
    const questionId = req.params.questionId;

    try {
        const question = await Question.findById(questionId);
        if(!question) {
            const error = new Error('Question not found');
            error.statusCode = 404;
            throw error;
        }
        
        res.status(200).json({message: 'Question fetched!', question: question});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.updateQuestion = async (req, res, next) => {
    const errors = validationResult(req);
    const questionId = req.params.questionId;
    const question = req.body.question;
    const options = req.body.options;
    const answer = req.body.answer;
    const explaination = req.body.explaination;

    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const updatedQuestion = await Question.findById(questionId);
        if(!updatedQuestion) {
            const error = new Error('Question not found');
            error.statusCode = 404;
            throw error;
        }

        updatedQuestion.question = question;
        updatedQuestion.options = options;
        updatedQuestion.answer = answer;
        updatedQuestion.explaination = explaination;

        const result = await updatedQuestion.save();
        res.status(200).json({message: 'Question updated!', questionId: result._id});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.deleteQuestion = async (req, res, next) => {
    const questionId = req.params.questionId;

    try {
        const question = await Question.findById(questionId);
        if(!question) {
            const error = new Error('Question not found');
            error.statusCode = 404;
            throw error;
        }
        
        await Question.findByIdAndDelete(questionId);
        res.status(200).json({message: 'Question deleted!'});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.createExam = async (req, res, next) => {
    const errors = validationResult(req);
    const title = req.body.title;
    const description = req.body.description;
    const type = req.body.type;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const questions = req.body.questions;
    const passingScore = req.body.passingScore;


    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }
        if (!questions || questions.length === 0) {
            const error = new Error('Questions are required');
            error.statusCode = 422;
            throw error;
        }

        const exam = new Exam({
            title: title,
            description: description,
            type: type,
            startTime: startTime,
            endTime: endTime,
            questions: questions,
            isFinished: false,
            passingScore: passingScore
        });

        const result = await exam.save();
        res.status(201).json({message: 'Exam created!', examId: result._id});
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
        const exam = await Exam.findById(examId);
        if(!exam) {
            const error = new Error('Exam not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({message: 'Exam fetched!', exam: exam});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.updateExam = async (req, res, next) => {
    const errors = validationResult(req);
    const examId = req.params.examId;
    const title = req.body.title;
    const description = req.body.description;
    const type = req.body.type;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const questions = req.body.questions;
    const isFinished = req.body.isFinished;
    const passingScore = req.body.passingScore;

    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }
        if (!questions || questions.length === 0) {
            const error = new Error('Questions are required');
            error.statusCode = 422;
            throw error;
        }

        const exam = await Exam.findById(examId);
        if(!exam) {
            const error = new Error('Exam not found');
            error.statusCode = 404;
            throw error;
        }

        exam.title = title;
        exam.description = description;
        exam.type = type;
        exam.startTime = startTime;
        exam.endTime = endTime;
        exam.questions = questions;
        exam.isFinished = isFinished;
        exam.passingScore = passingScore;

        const result = await exam.save();
        res.status(200).json({message: 'Exam updated!', examId: result._id});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.deleteExam = async (req, res, next) => {
    const examId = req.params.examId;

    try {
        const exam = await Exam.findById(examId);
        if(!exam) {
            const error = new Error('Exam not found');
            error.statusCode = 404;
            throw error;
        }

        await Exam.findByIdAndDelete(examId);
        res.status(200).json({message: 'Exam deleted!'});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.createUser = async (req, res, next) => {
    const errors = validationResult(req);
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const role = req.body.role;
    const idStudent = req.body.idStudent;
    const fullname = req.body.fullname;

    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = new User({
            email: email,
            password: hashedPassword,
            username: username,
            role: role,
            idStudent: idStudent,
            fullname: fullname
        });
        const result = await user.save();
        res.status(201).json({message: 'User created!', userId: result._id});
    } catch (error) {
        error.statusCode = 500;
        next(error);
    }
}

exports.getUserById = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if(!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({message: 'User fetched!', user: user});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.updateUser = async (req, res, next) => {
    const errors = validationResult(req);
    const userId = req.params.userId;
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const role = req.body.role;
    const idStudent = req.body.idStudent;
    const fullname = req.body.fullname;

    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const user = await User.findById(userId);
        if(!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        user.email = email;
        user.password = hashedPassword;
        user.username = username;
        user.role = role;
        user.idStudent = idStudent;
        user.fullname = fullname;

        const result = await user.save();
        res.status(200).json({message: 'User updated!', userId: result._id});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.deleteUser = async (req, res, next) => {
    const userId = req.params.userId;
    try {
        const user = await User.findById(userId);
        if(!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        await User.findByIdAndDelete(userId);
        res.status(200).json({message: 'User deleted!'});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getStatistics = async (req, res, next) => {
    try {
        const examType = req.params.examType;
        const examDate = req.params.examDate;
        let query = {};

        if(examType) {
            query.exam = examType;
        }
        if(examDate) {
            query.exam = {
                startTime: { $gte: new Date(examDate + 'T00:00:00.000Z') },
                endTime: { $lte: new Date(examDate + 'T23:59:59.999Z') }
            }
        }

        const users = await User.find();
        if(!users) {
            const error = new Error('Users not found');
            error.statusCode = 404;
            throw error;
        }

        let formatResults = [];
        
        for(let i = 0; i < users.length; i++) {
            if(users[i].role === 'admin') continue;
            query.user = users[i]._id;
            const results = await Result.find(query).populate('exam');
            if(!results || results.length === 0) {
                formatResults.push({
                    user: users[i].username,
                    idStudent: users[i].idStudent,
                    average: 0,
                    passPercentage: 0,
                    numberPerformed: 0,
                    details: []
                });
                continue;
            }

            let passCount = 0;
            let total = 0;
            let count = 0;
            let details = [];
            results.forEach(result => {
                total += result.score;
                count++;
                if(result.isPassed) {
                    passCount++;
                }
                details.push({
                    exam: result.exam.title,
                    start: result.exam.startTime,
                    end: result.exam.endTime,
                    score: result.score,
                    isPassed: result.isPassed
                });
            });
            const average = total / count;
            const passPercentage = (passCount / count) * 100;

            formatResults.push({
                user: users[i].username,
                idStudent: users[i].idStudent,
                average: average,
                passPercentage: passPercentage,
                numberPerformed: count,
                details: details
            });
        }

        res.status(200).json({message: 'Statistics fetched!', results: formatResults});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getDetailResult = async (req, res, next) => {
    try {
        const fullname = req.params.fullname;
        const idStudent = req.params.idStudent;

        let query = {};
        if(fullname) {
            query.fullname = fullname;
        }
        if(idStudent) {
            query.idStudent = idStudent;
        }

        const user = await User.find(query);
        if(!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        let formatResults = [];

        for(let i = 0; i < user.length; i++) {
            if(user[i].role === 'admin') continue;
            query.user = user[i]._id;
            const results = await Result.find(query)
                .populate({
                    path: 'exam',
                    select: 'title passingScore description type startTime endTime isFinished -_id'
                }).populate({
                    path: 'answers.question',
                }).select('score isPassed exam answers totalTime correctNumber');
            if(!results || results.length === 0) {
                formatResults.push({
                    user: user[i].username,
                    idStudent: user[i].idStudent,
                    details: []
                });
                continue;
            }

            formatResults.push({
                user: user[i].username,
                idStudent: user[i].idStudent,
                details: results
            });
        }
        res.status(200).json({message: 'Detail result fetched!', results: formatResults});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}