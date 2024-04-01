const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('./models/user');

const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exam');
const adminRoutes = require('./routes/admin');

const app = express();

dotenv.config();

app.use(bodyParser.json()); // application/json

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exam', examRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const mess = error.message;
    const data = error.data;
    res.status(status).json({message: mess, data: data});
});

mongoose.connect(process.env.MONGODB_URI)
    .then(result => {
        User.findOne().then(result => {
            if (!result) {
                bcrypt.hash('admin123', 12)
                    .then(hashedPassword => {
                        const user = new User({
                            email: 'admin@gmail.com',
                            password: hashedPassword,
                            username: 'admin',
                            role: 'admin'
                        });
                        user.save();
                    })
            }
        });
        app.listen(process.env.PORT || 3000, () => {
            console.log('Server is running on port ' + process.env.PORT || '3000');
        })
    })
    .catch(err => console.log(err));