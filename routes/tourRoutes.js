const express = require('express');

const {
    getAllTours,
    createTour,
    getToursWithin,
    getDistances,
    getTour,
    updateTour,
    deleteTour,
    aliasTopTours,
    getTourStats,
    getMonthlyPlan
} = require('../controllers/tourController');
const {
    protect,
    restrictTo,
} = require('../controllers/authController')
const reviewRouter = require('../routes/reviewRoutes');
const { get } = require('../routes/reviewRoutes');

const router = express.Router();


router.use('/:tourId/reviews', reviewRouter);


//  NOTE: WE HAVE PUT A MIDDLEWARE NAMED "aliasTopTours" TO FILTER TOP BY CHEAP TOURS BY DEFAULT
router
    .route('/top-5-cheap')
    .get(aliasTopTours, getAllTours);


// NOTE: AGGREGATION PIPELING
router
    .route('/tour-stats')
    .get(getTourStats)

router
    .route('/monthly-plan/:year')
    .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan)


// to find the tours within particular radius
router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(getToursWithin)

router
    .route('/distances/:latlng/unit/:unit')
    .get(getDistances)


router
    .route('/')
    .get(getAllTours)
    .post(protect, restrictTo('admin', 'lead-guide'), createTour)

router
    .route('/:id')
    .get(getTour)
    .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
    .delete(
        protect,
        // NOTE: ONLY USER WITH SPECIFIC ROLES CAN PERFORM THIS OPERATION
        restrictTo('admin', 'lead-guide'),
        deleteTour
    );


module.exports = router;
