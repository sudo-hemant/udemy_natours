const { User } = require('../models/userModel');
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');
const factory = require('./handlerFactory');


const filterObj = (obj, ...allowedFields) => {
    const filteredBody = {}

    for (const allowedField of allowedFields) {
        if (obj[allowedField]) {
            filteredBody[allowedField] = obj[allowedField];
        }
    }

    return filteredBody;
};

// MIDDLEWARE - USED WHEN WE WANT USER TO RETRIEVE ITS OWN DATA
//              SO WE PRETEND THAT THE ID IS COMING FROM THE URL
const getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}


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


// IF USERS DELETES ITSELF, THEN IT LL ONLY MARK IT AS INACTIVE, NOT DELETE THE DATA
// INSTEAD ONLY ADMINs CAN DELETE THE DATA, THAT FUNCTION IS WRITTEN BELOW
const deleteMe = catchAsync( async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: 'success',
        data: null,
    })
});


const getUser = factory.getOne(User);
const getAllUsers = factory.getAll(User);
const updateUser = factory.updateOne(User);  // DO NOT UPDATE PASSWORDS WITH THAT
const deleteUser = factory.deleteOne(User);  // ONLY ADMIN CAN HAVE ACCESS TO THIS FEATURE

const createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'this route is not define, plz use signup instead !',
    });
};


module.exports = {
    updateMe,
    deleteMe,
    
    getMe,
    getUser,
    getAllUsers,
    updateUser,
    deleteUser,
    createUser,
};
