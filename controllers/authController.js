const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const { User } = require('../models/userModel');
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');



const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}


const signup = catchAsync(async (req, res, next) => {
    // NOTE:    THIS HAS VERY SERIOUS SECURITY FLAW, BCOS ANYONE CAN REGISTER AS ADMIN
    // const newUser = await User.create(req.body);

    // SO WE DO THIS INSTEAD OF THE ABOVE METHOD
    const { name, email, password, passwordConfirm, passwordChangedAt } = req.body;
    const newUser = await User.create({ name, email, password, passwordConfirm, passwordChangedAt });

    const token = signToken(newUser._id)

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser,
        },
    });
});


const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('please provide email and password', 400));
    }

    // NOTE:    to select excluded fields, we do the way it is mentioned below.
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401))
    }

    const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token,
    });
});


// NOTE:    middleware to check whether the user is logged in or not
const protect = catchAsync(async (req, res, next) => {
    let token;

    // 1) check if we have got token or not 
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please login to get access.', 401));
    }

    // TODO:    UNDERSTAND THIS promisify function
    // 2) verification of token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // console.log(decoded, 'decoded')

    // 3) check if user still exists (it might happen that user might have deleted his acc and token is still valid)
    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
        return next(new AppError('the user belonging to this token, doesn\'t exist', 401));
    }

    // 4) check if password was changed after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('user recently changed the password', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE 
    req.user = freshUser;
    next();
});









module.exports = {
    signup,
    login,
    protect,
};