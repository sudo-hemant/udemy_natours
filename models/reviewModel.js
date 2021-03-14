const mongoose = require('mongoose');

const { Tour } = require('./tourModel');


const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        required: [true, 'A review must not be empty'],
        trim: true,
    },
    rating: {
        type: Number,
        default: 5,
        min: [1, 'rating must be atleast 1'],
        max: [5, 'rating must have max value of 5'],
        // enum: {
        //     values: [1, 2, 3, 4, 5],
        //     message: 'rating must be an integer value between 1 and 5'
        // },
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'tour',
        required: [true, 'Review must belong to a tour'],
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: [true, 'Review must have an author'],
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
}
);

// a user is allowed to write 1 review for 1 tour
// each combination of tour and user has to be unique
reviewSchema.index({tour: 1, createdBy: 1} , {unique: true})



// NOTE:    DOCUMENT MIDDLEWARE
// reviewSchema.pre('save', function (next) {
//     console.log('working')
//     console.log(req.user.id);
//     this.createdBy = req.user.id;
//     next();
// });


// NOTE:    QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'createdBy',
        select: 'name photo',
    })
    // populate({
    //     path: 'tour',
    //     select: 'name '
    // })

    next();
});

// TODO:    DOUBT
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            }
        }
    ]);

    if (stats.length) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
        })
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
        })
    }
}

reviewSchema.post('save', function () {
    this.constructor.calcAverageRatings(this.tour);
});


reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne();
    console.log(this.r);
    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    await this.r.constructor.calcAverageRatings(this.r.tour);
});



const Review = mongoose.model('review', reviewSchema);


module.exports = {
    Review
}