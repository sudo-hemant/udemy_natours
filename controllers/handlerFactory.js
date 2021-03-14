
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');
const { APIFeatures } = require('../utils/apiFeatures');


const deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
        return next(new AppError('No doc found with that ID', 404));
    };

    res.status(204).json({
        status: 'success',
        data: {
            message: 'successfully deleted the document!'
        },
    });
});


const updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        // NOTE: to get the updated data from db, which we ll send back to user
        new: true,

        // NOTE: to run validator again when we are trying to update a particular value
        runValidators: true
    });

    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    };

    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        },
    });
});


const createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        },
    });
});


const getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {

    let query = Model.findById(req.params.id);
    if (popOptions) {
        query = query.populate(popOptions);
    }
    const doc = await query;

    // const doc = await Model.findById(req.params.id).populate('reviews');
    // we have made a query middleware for this
    // .populate({
    //     path: 'guides',
    //     // to exclude or include particular fields
    //     select: '-__v -passwordChangedAt',
    // });

    if (!doc) {
        return next(new AppError('No document found with that ID', 404));
    };

    res.status(200).json({
        status: 'success',
        data: {
            data: doc,
        },
    });
});


const getAll = Model => catchAsync(async (req, res, next) => {

    // to allow for nested get reviews on tour
    let filter = {};
    if (req.params.tourId) {
        filter = { tour: req.params.tourId }
    }

    // TODO:    DIDN'T UNDERSTAND THE CONSTURCTOR FUNCTION
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate()
    const doc = await features.query;
    // const doc = await features.query.explain();

    // NOTE: BY THIS METHOD WE WON'T BE ABLE TO EXECUTE FILTER, PAGINATION ETC, BCOS IT IMMEDIATELY 
    // PERFROM QUERY ON DB, INSTEAD WE FIRST CHAIN QUERY AND THEN PERFORM THE QUERY IN DB
    // const tours = await Tour.find();

    // NOTE: OTHER way to chain query
    // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');

    res.status(200).json({
        status: 'success',
        results: doc.length,
        data: {
            data: doc,
        },
    });
});



module.exports = {
    createOne,
    getOne,
    updateOne,
    deleteOne,
    getAll,
}

