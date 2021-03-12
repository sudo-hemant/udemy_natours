const { User } = require('../models/userModel');
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');



const filterObj = (obj, ...allowedFields) => {
    const filteredBody = {}

    for (const allowedField of allowedFields) {
        if (obj[allowedField]) {
            filteredBody[allowedField] = obj[allowedField];
        }
    }

    return filteredBody;
};


const updateMe = catchAsync(async (req, res, next) => {
    // 1)  create error if user tries to update password
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('You can\'t update password in this route', 400));
    }

    // 2) update user document    
    // it 'll filter the unwanted fields, which are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    
    // NOTE:    SINCE WE ARE NOT DEALING WITH PASSWORDS HERE, WE CAN USE findByIdUpdate
    //          if we try using findById it 'll give us error because of the validation function
    //          in password and passwordConfirm field.
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        { new: true, runValidators: true }
    )

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        }
    });
});


const deleteMe = catchAsync( async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    })
});


const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: 'error',
        results: users.length,
        data: {
            users
        },
    });
});





const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is incomplete !',
    });
};

const getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is incomplete !',
    });
};

const updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is incomplete !',
    });
};

const deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is incomplete !',
    });
};


module.exports = {
    updateMe,
    deleteMe,

    getAllUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser,
};
