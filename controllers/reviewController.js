
const { Review } = require('../models/reviewModel');
const factory = require('./handlerFactory');



// MIDDLEWARE USED WHILE CREATING REVIEW
const setTourUserIds = (req, res, next) => {
    if (!req.body.tour) {
        req.body.tour = req.params.tourId;
    }
    if (!req.body.user) {
        // WE ARE GETTING req.user FROM THE PROTECT MIDDLEWARE
        req.body.createdBy = req.user.id;
    }
    next();
};


const getReview = factory.getOne(Review);
const getAllReviews = factory.getAll(Review);
const createReview = factory.createOne(Review);
const updateReview = factory.updateOne(Review);
const deleteReview = factory.deleteOne(Review);


module.exports = {
    setTourUserIds,
    getReview,
    getAllReviews,
    createReview,
    updateReview,
    deleteReview,
}