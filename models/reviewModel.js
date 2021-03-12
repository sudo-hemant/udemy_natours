
const mongoose = require('mongoose');


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
    // }).

    next();
})



const Review = mongoose.model('review', reviewSchema);


module.exports = {
    Review
}