const { Tour } = require('../models/tourModel');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const factory = require('./handlerFactory');


// middleware to get top 5 cheap routes
const aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}


// NOTE: AGGREGATION PIPELING
const getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                // _id: null,
                _id: '$difficulty',
                numTours: { $sum: 1 },  //  IT WILL GO THROUGH EACH DOCUMENT AND WILL ADD 1 FOR EACH
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: {
                avgPrice: 1
            }
        }
    ])

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })

});


const getMonthlyPlan = catchAsync(async (req, res, next) => {
    const { year } = req.params

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: {
                month: '$_id',
            }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {
                numTourStarts: -1
            }
        },
        {
            $limit: 12
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    })
});


// to find the tours within particular radius
const getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [latitude, longitude] = latlng.split(',');

    // const radius = unit === 'mi' ? distance / 3962.2 : distance / 6378.1;
    const radius = distance / (unit === 'mi' ? 3962.2 : 6378.1);

    if (!latitude || !longitude) {
        next(new AppError('please provide latitude & longitude in format lat,lng', 400));
    }

    const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[longitude, latitude], radius] } } })

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours,
        }
    });
});


const getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [latitude, longitude] = latlng.split(',');

    if (!latitude || !longitude) {
        next(new AppError('please provide latitude & longitude in format lat, lng', 400));
    }
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [longitude * 1, latitude * 1]
                }, 
                distanceField: 'distance',
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: tours,
        }
    })
});


const getTour = factory.getOne(Tour, { path: 'reviews' });
const getAllTours = factory.getAll(Tour);
const createTour = factory.createOne(Tour);
const updateTour = factory.updateOne(Tour);

// FIXME: ITS DELETING DATA FROM DB, BUT SENDING THE FAILED STATUS
const deleteTour = factory.deleteOne(Tour);


module.exports = {
    aliasTopTours,
    getTourStats,
    getMonthlyPlan,
    getToursWithin,
    getDistances,
    getTour,
    getAllTours,
    createTour,
    updateTour,
    deleteTour,
};


// ----------------------------------------------------------------------------------

    // inefficient method of executing query by params

        // // FILTERING
        // const queryObj = { ...req.query };
        // const excludeFields = ['page', 'sort', 'limit', 'fields'];

        // excludeFields.forEach(el => delete queryObj[el]);

        // // NOTE:    ADVANCE FILTERING
        // let queryStr = JSON.stringify(queryObj);
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);


        // let query = Tour.find(JSON.parse(queryStr));



        // NOTE:    SORTING
        // if (req.query.sort) {
        //     const sortBy = req.query.sort.replaceAll(',', ' ');
        //     query = query.sort(sortBy);
        // } else {
        //     query = query.sort('-createdAt');
        // }

        // // NOTE:    LIMITING
        // if (req.query.fields) {
        //     const fields = req.query.fields.replaceAll(',', ' ');
        //     console.log(fields)
        //     query = query.select(fields);
        // } else {
        //     query = query.select('-__v')
        // }

        // // NOTE:     PAGINATION
        // const page = req.query.page * 1 || 1;
        // const limit = req.query.limit * 1 || 100;
        // const skip = (page - 1) * limit;

        // query = query.skip(skip).limit(limit);

        // // IF USER TRY TO ACCESS NON EXISTING PAGE
        // if (req.query.page) {
        //     const numTours = await Tour.countDocuments();
        //     if (skip >= numTours) {
        //         throw new Error('This page doesn\'t exist');
        //     }
        // }



// ------------------------------------------------------------------



// it was just for testing purpose

// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// NOTE: NO LONGER NEEDED BCOS, THIS IS OUR CUSTOM MIDDLEWARE, AND WE WILL USE THE UNIQUE ID ERROR 
// WHICH MONGO GIVES US BYDEFAULT, IF WE TRY TO ACESS INVALID ID
// function for middleware
// const checkId = (req, res, next, val) => {
//     console.log('tour val', val);

//     if (req.params.id * 1 >= tours.length) {
//         return res.status(404).json({
//             status: 'failed',
//             message: `Couldn\'t find the tour with id ${id} !`,
//         });
//     }
//     next();
// }

// const checkBody = (req, res, next) => {
//     console.log('inside check body middleware');

//     if (!req.body.name || !req.body.price) {
//         return res.status(500).json({
//             status: 'failed',
//             message: `bad request !`
//         })
//     }
//     next();
// }


// ------------------------------------------------------------------
