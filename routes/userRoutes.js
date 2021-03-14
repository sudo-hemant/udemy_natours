const express = require('express');

const {
    protect,
    signup,
    login,
    forgotPassword,
    resetPassword,
    updatePassword,
    restrictTo,
} = require('../controllers/authController');

const {
    getMe,
    updateMe,
    deleteMe,

    getAllUsers,
    createUser,
    getUser,
    
    updateUser,
    deleteUser,
} = require('../controllers/userController');

const router = express.Router();


router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// NOTE:    THIS LL PROTECT ALL BELOW ROUTES
router.use(protect);

router.patch('/updatePassword/', updatePassword);
router.get('/me', getMe, getUser)
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);

// NOTE:    THIS LL RESTRICT TO ALL THE BELOW ROUTES
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
