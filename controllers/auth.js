const bcrypt = require('bcryptjs');
const {validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
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
            role: 'student',
            idStudent: idStudent,
            fullname: fullname
        });

        const result = await user.save();
        res.status(201).json({message: 'User created!', userId: result._id});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.login = async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    try {
        const user = await User.findOne({username: username});
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 401;
            throw error;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const error = new Error('Wrong password');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign({
            username: user.email,
            userId: user._id.toString(),
        }, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
        res.status(200).json({message: 'Login successfully!', token: token});
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};