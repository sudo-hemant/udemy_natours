const express = require('express');

const {
    getAllTours,
    createTour,
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


const router = express.Router();

// middleware to check if url contains id, it should be valid id
// router.param('id', checkId);

// way to chain middleware
// router.route('/').get(getAllTours).post(checkBody, createTour);


//  NOTE: WE HAVE PUT A MIDDLEWARE NAMED "aliasTopTours" TO FILTER TOP BY CHEAP TOURS BY DEFAULT
router
    .route('/top-5-cheap')
    .get(aliasTopTours, getAllTours);


// NOTE: AGGREGATION PIPELING
router
    .route('/tour-stats')
    .get(getTourStats);

router
    .route('/monthly-plan/:year')
    .get(getMonthlyPlan)


router
    .route('/')
    .get(protect, getAllTours)
    .post(createTour);

router
    .route('/:id')
    .get(getTour)
    .patch(updateTour)
    .delete(
        protect,
        // NOTE: ONLY USER WITH SPECIFIC ROLES CAN PERFORM THIS OPERATION
        restrictTo('admin', 'lead-guide'),
        deleteTour
    );

module.exports = router;
