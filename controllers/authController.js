const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const { User } = require('../models/userModel');
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');
const { sendEmail } = require('../utils/email');



const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}


const signup = catchAsync(async (req, res, next) => {
    // NOTE:    THIS HAS VERY SERIOUS SECURITY FLAW, BCOS ANYONE CAN REGISTER AS ADMIN
    // const newUser = await User.create(req.body);

    // SO WE DO THIS INSTEAD OF THE ABOVE METHOD
    const { name, email, role, password, passwordConfirm } = req.body;
    const newUser = await User.create({ name, email, role, password, passwordConfirm });

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


const forgotPassword = catchAsync(async (req, res, next) => {
    
    // 1) get user based on email inputed 
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        // 404 -- Not Found
        return next(new AppError(`User with this email, doesn't exists.`, 404));
    }

    // 2) generate reset token
    const resetToken = user.createPasswordResetToken();
    // a) since we modified passwordResetExpires field in the model, so we need to save the document
    // b) since we are only getting email from the client, so we don't need other fields, inbuilt validators 
    //      to validate. we will just update the document with password (token & expires) field
    await user.save({ validateBeforeSave: false });

    // 3) send it to the user's email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `reset password at : ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token',
            message
        });
        
        res.status(200).json({
            status: 'success',
            message: 'Token has been sent to the entered email.',
        })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passowrdResetExpires = undefined;
        
        await user.save({ validateBeforeSave: false });

        return next(new AppError('some error occured while sending email, plz try again', 500));
    }
    // TODO:    why sometimes we use next and sometimes not when we just send res ?
});


const resetPassword = catchAsync(async (req, res, next) => {
    // 1) get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ 
        passwordResetToken: hashedToken, 
        // to check whether the token has expired or not
        passwordResetExpires: { $gt: Date.now() } 
    });

    // 2) if token has not expired, and there is a user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) update changedPasswordAt property for the user
    //      we have done it in middleware

    // 4) log the user in 
    const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token,
    });
});


const updatePassword = catchAsync(async (req, res, next) => {
    // 1) get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) check if posted current pass is correct
    // this passwordConfirm is the password coming from the url, to verify that the user knows his current pass
    if (!(await user.correctPassword(req.body.passwordConfirm, user.password))) {
        return next(new AppError('your current password is wrong', 401))
    }

    // 3) if so, update pass
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    // NOTE:    WE ARE NOT UPDATING THE passwordChangedAt property, bcos we have already made middleware for that.
    await user.save();

    // 4) log user in, send JWT Token back
    const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token,
    })
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
    console.log(freshUser)
    next();
});


// NOTE:    Middleware to allow only user with particular role to access this features 
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // NOTE:    IF USER DOESN'T HAVE THE ROLE WHICH LL PERFORM THIS OPERATION, WE LL RESTRICT IT
        // 403 - forbidden
        if (!roles.includes(req.user.role)) {
            return next(new AppError(`you do not have permission to perform this action`, 403));
        }

        next();
    }
}









module.exports = {
    protect,
    restrictTo,
    signup,
    login,
    forgotPassword,
    resetPassword,
    updatePassword,
};