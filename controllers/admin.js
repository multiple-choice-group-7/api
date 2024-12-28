const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Exam = require('../models/exam');
const Question = require('../models/question');
const Result = require('../models/result');
const exam = require('../models/exam');

exports.getDashboard = async (req, res, next) => {
    try {
        const errs = [];
        const users = await User.find();
        if(!users || users.length === 0) {
            const err = {
                msg: 'Users not found',
                obj: 'users'
            }
            errs.push(err);
        }

        // get user has role different from admin and format the data: id, email, idStudent, fullname
        let formatUsers = [];
        users.forEach(user => {
            if(user.role === 'admin') return;
            formatUsers.push({
                id: user._id,
                email: user.email,
                idStudent: user.idStudent,
                fullname: user.fullname
            });
        });

        let exams = await Exam.find().select('title description typeExam typeTime');
        let statistics = [];
        if(!exams || exams.length === 0) {
            const err = {
                msg: 'Exams not found',
                obj: 'exams'
            }
            errs.push(err);
        } else {
            for(const exam of exams) {
                const result = await Result.find({exam: exam._id});
    
                // calculate the percentage of students who passed the exam
                // calculate the average score of the exam
                let total = 0;
                let passCount = 0;
                let count = 0;
                result.forEach(res => {
                    total += res.score;
                    count++;
                    if(res.isPassed) {
                        passCount++;
                    }
                });
                const average = total / count;
    
                const passPercentage = (passCount / count) * 100;

                statistics.push({
                    exam: exam.title,
                    average: average,
                    passPercentage: passPercentage
                });
            };
        }

        if(!statistics || statistics.length === 0) {
            const err = {
                msg: 'Don\'t have any statistics data',
                obj: 'statistics'
            }
            errs.push(err);
        }

        if(errs.length > 0) {
            const error = new Error('Data not found');
            error.statusCode = 404;
            error.data = errs;
            throw error;
        }

        res.status(200).json({
            message: 'Data fetched successfully',
            users: formatUsers,
            exams: exams,
            statistics: statistics
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.createQuestion = async (req, res, next) => {
    const errors = validationResult(req);
    const question = req.body.question;
    const options = req.body.options;
    const answer = req.body.answer;
    const explaination = req.body.explaination;
    const mark = req.body.mark;
    const examId = req.params.examId;

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

        const exam = await Exam.findById(examId).populate('questions.question');
        if(!exam) {
            const error = new Error('Exam not found');
            error.statusCode = 404;
            throw error;
        }
        exam.questions.push({question: result._id, mark: mark});
        const updatedExam = await exam.save();
        res.status(201).json({message: 'Question created!', exam: updatedExam});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getQuestionById = async (req, res, next) => {
    const questionId = req.params.questionId;
    const examId = req.params.examId;

    try {
        //  find the questionId exists in the examId
        const exam = await Exam.findById(examId);
        if(!exam) {
            const error = new Error('Exam not found');
            error.statusCode = 404;
            throw error;
        }
        const questionCheck = exam.questions.find(q => q.question.toString() === questionId);
        if(!questionCheck) {
            const error = new Error('Question does not exist in the exam!');
            error.statusCode = 404;
            throw error;
        }
        const question = await Question.findById(questionId);
        if(!question) {
            const error = new Error('Question not found');
            error.statusCode = 404;
            throw error;
        }
        const formatQuestion = {
            ...question._doc,
            mark: questionCheck.mark
        }
        
        res.status(200).json({message: 'Question fetched!', question: formatQuestion});
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
    const mark = req.body.mark;
    const examId = req.params.examId;

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

        const exam = await Exam.findById(examId).populate('questions.question');
        if(!exam) {
            const error = new Error('Exam not found');
            error.statusCode = 404;
            throw error;
        }
        const questionCheck = exam.questions.find(q => q.question._id.toString() === questionId);
        if(!questionCheck) {
            const error = new Error('Question does not exist in the exam!');
            error.statusCode = 404;
            throw error;
        }
        questionCheck.mark = mark;
        const updatedExam = await exam.save();

        res.status(200).json({message: 'Question updated!', question: updatedExam});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.deleteQuestion = async (req, res, next) => {
    const questionId = req.params.questionId;
    const examId = req.params.examId;

    try {
        const question = await Question.findById(questionId);
        if(!question) {
            const error = new Error('Question not found');
            error.statusCode = 404;
            throw error;
        }
        
        await Question.findByIdAndDelete(questionId);

        const exam = await Exam.findById(examId);
        if(!exam) {
            const error = new Error('Exam not found');
            error.statusCode = 404;
            throw error;
        }
        exam.questions = exam.questions.filter(q => q.question.toString() !== questionId);
        const updatedExam = await exam.save();
        
        res.status(200).json({message: 'Question deleted!', exam: updatedExam});
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
    const typeExam = req.body.typeExam;
    const typeTime = req.body.typeTime;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const passingScore = req.body.passingScore;


    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const exam = new Exam({
            title: title,
            description: description,
            typeExam: typeExam,
            typeTime: typeTime,
            startTime: startTime,
            endTime: endTime,
            isFinished: false,
            passingScore: passingScore
        });

        const result = await exam.save();
        res.status(201).json({message: 'Exam created!', exam: result});
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
        const exam = await Exam.findById(examId).populate('questions.question');
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
    const typeExam = req.body.typeExam;
    const typeTime = req.body.typeTime;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const isFinished = req.body.isFinished;
    const passingScore = req.body.passingScore;

    try {
        if (!errors.isEmpty()) {
            const error = new Error('Validation failed');
            error.statusCode = 422;
            error.data = errors.array();
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
        exam.typeExam = typeExam;
        exam.typeTime = typeTime;
        exam.startTime = startTime;
        exam.endTime = endTime;
        exam.isFinished = isFinished;
        exam.passingScore = passingScore;

        const result = await exam.save();
        res.status(200).json({message: 'Exam updated!', exam: result});
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

        // delete all questions of the exam
        exam.questions.forEach(async question => {
            await Question.findByIdAndDelete(question.question);
        });

        // delete the result of the exam
        await Result.deleteMany({exam: examId});

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

        // delete the result of the user
        await Result.deleteMany({user: userId});

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
        const examTitle = req.query.examTitle;
        const examDate = req.query.examDate;
        let query = {};

        if(examTitle) {
            const exam = await Exam.findOne({title: {$regex: examTitle, $options: 'i' }});
            if(!exam) {
                const error = new Error('Exam not found');
                error.statusCode = 404;
                throw error;
            }
            query.exam = exam._id;
        }
        // if examDate is not null, query the the element in model Exam in model Result by the examDate with startTime >= examDate and endTime <= examDate
        if(examDate) {
            const examId = await Exam.find({
                startTime: {$gte: examDate + 'T00:00:00.000+00:00'},
                endTime: {$lte: examDate + 'T23:59:59.999+00:00'}
            }).select('_id');
            query.exam = {$in: examId};
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
                if(query && Object.keys(query).length === 1) 
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
                fullname: users[i].fullname,
                idStudent: users[i].idStudent,
                average: average,
                passPercentage: passPercentage,
                numberPerformed: count,
                details: details
            });
        }

        if(formatResults.length === 0) {
            const error = new Error('Don\'t have any statistics data matching the query!');
            error.statusCode = 404;
            throw error;
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
        const fullname = req.query.fullname;
        const idStudent = req.query.idStudent;

        let query = {};
        if(fullname) {
            query.fullname = {$regex: fullname, $options: 'i'};
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
            const results = await Result.find({user: user[i]._id})
                .populate({
                    path: 'exam',
                    select: 'title passingScore description typeExam typeTime startTime endTime isFinished -_id'
                }).populate({
                    path: 'answers.question',
                }).select('score isPassed exam answers totalTime correctNumber');
            if(!results || results.length === 0) {
                formatResults.push({
                    user: user[i].username,
                    idStudent: user[i].idStudent,
                    details: "Don't have any result!"
                });
                continue;
            }
            
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

            formatResults.push({
                username: user[i].username,
                fullname: user[i].fullname,
                idStudent: user[i].idStudent,
                details: newRes
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