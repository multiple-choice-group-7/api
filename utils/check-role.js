const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.isAuth = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    try {
        if (!authHeader) {
            const error = new Error('Not authenticated');
            error.statusCode = 401;
            throw error;
        }
        const token = authHeader.split(' ')[1];
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            error.statusCode = 500;
            throw error;
        }
        if (!decodedToken) {
            const error = new Error('Not authenticated');
            error.statusCode = 401;
            throw error;
        }
        req.userId = decodedToken.userId;
        next();
    } catch (error) {
        error.statusCode = 500;
        next(error)
    }
}

exports.isAdmin = async (req, res, next) => {
    const userId = req.userId;
    try {
        const user = await User.findById(userId);
        if(!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        if (user.role !== 'admin') {
            const error = new Error('Require admin role!');
            error.statusCode = 403;
            throw error;
        }
        next();
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}