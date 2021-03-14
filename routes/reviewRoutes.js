const express = require('express');
const {
    setTourUserIds,
    getAllReviews,
    createReview,
    getReview,
    updateReview,
    deleteReview,
} = require('../controllers/reviewController');
const {
    protect, 
    restrictTo
} = require('../controllers/authController');


// NOTE:  mergeParams  SINCE BY DEFAULT EACH ROUTER HAS ACCESS TO ONLY PARAMS OF THEIR SPECIFI ROUTES
//        AND WE WANT TO GET ACCESS TO PARAMS WHICH WAS EARLIER PART OF URL
const router = express.Router({ mergeParams: true });


router.use(protect);

// NOTE:    THIS IS WORKING FOR 2 DIFFERENT URLS
// 1. coming from /:tourId/reviews
// 2. coming from /api/v1/reviews
router
    .route('/')
    .get(getAllReviews)
    .post(restrictTo('user'), setTourUserIds, createReview)

router  
    .route('/:id')
    .get(getReview)
    .patch(restrictTo('user', 'admin'), updateReview)
    .delete(restrictTo('user', 'admin'), deleteReview)


module.exports = router;