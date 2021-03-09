const { User } = require('../models/userModel');
const { catchAsync } = require('../utils/catchAsync');




const getAllUsers = catchAsync( async (req, res, next) => {
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
    getAllUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser,
};
