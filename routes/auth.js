const express = require('express');
const {body} = require('express-validator');

const User = require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();


// Register
// POST /api/v1/auth/signup
router.post('/v1/auth/signup', [
    body('email').trim().isEmail().withMessage('Please enter a valid email')
        .custom((value, {req}) => {
            return User.findOne({email:value}).then(doc => {
                if(doc) return Promise.reject('Email address already exists.');
            })
        })
        .normalizeEmail(),
    body('password').trim().isLength({min: 6}).withMessage('Password must be at least 6 characters long'),
    body('username').trim().isLength({min: 3}).withMessage('Username must be at least 3 characters long')
        .custom((value, {req}) => {
            return User.findOne({username:value}).then(doc => {
                if(doc) return Promise.reject('Username already exists.');
            })
        }),
    body('fullname').trim().isLength({min: 3}).withMessage('Username must be at least 3 characters long'),
    body('idStudent').trim().isLength({min: 10, max: 10}).withMessage('ID Student must be 10 characters long')
        .custom((value, {req}) => {
            return User.findOne({idStudent:value}).then(doc => {
                if(doc) return Promise.reject('ID Student already exists.');
            })
        }),
    // body('role').isIn(['admin', 'user']).withMessage('Role must be either admin or user')
], authController.signup);

// Login
// POST /api/v1/auth/login
router.post('/v1/auth/login', authController.login);

module.exports = router;