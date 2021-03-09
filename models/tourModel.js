
const mongoose = require('mongoose');
const slugify = require('slugify');


const tourSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'A tour must have less than 41 characters'],
    minlength: [10, 'A tour must have more than 10 characters'],
    
    // FEATURES PROVIDED BY VALIDATOR LIBRARY
    // validate: validator.isAlpha
  },
  // added later
  slug: String,
  duration: {
    type: Number,
    requried: [true, 'A tour must have duraitons'],
  },
  maxGroupSize: {
    type: Number,
    requried: [true, 'A tour must have a group size'],
  },
  difficulty: {
    type: String,
    requried: [true, 'A tour must have difficulty'],
    // this is only for strings
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'difficulty must be either: easy, medium, difficult',
    },
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'rating must be above 1'],
    max: [5, 'rating must be below 5'],
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price.']
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        // NOTE -  inside validator this is only going to point to the current doc while creating
        // now when updating
        return val < this.price;
      },
      message: 'discount should be below the selling price',
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a summary'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    requried: [true, 'A tour must have a cover image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});





// ----------------------------------------------------------------------------------------
// VIRTUAL PROPERTY
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})

// ----------------------------------------------------------------------------------------
// DOCUMENT MIDDLEWARE : run before .save() and .create() but not on insertMany() etc

tourSchema.pre('save', function (next) {
  // THIS WILL POINT TO THE DOCUMENT WE ARE GOING TO SAVE
  this.slug = slugify(this.name, { lower: true });
  next();
})

tourSchema.pre('save', function (next) {
  console.log('ready to save documnt');
  next()
})

tourSchema.post('save', function (doc, next) {
  console.log('document saved');
  next();
})

// -----------------------------------------------------------------------------------------
// QUERY MIDDLEWARE

// THIS WILL ONLY WORK FOR "FIND"
// tourSchema.pre('find', function (next) {
// SO WE USE REGEX FOR THIS
tourSchema.pre(/^find/, function (next) {
  // THIS WILL POINT TO THE CURRENT QUERY 
  this.find({ secretTour: { $ne: true } })

  // to get the time it took to execure query
  this.start = Date.now();
  next();
})

tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs, 'docs');
  console.log(Date.now() - this.start, 'ms time took to execute query');
  next();
})

// -----------------------------------------------------------------------------------------
// AGGRETATION MIDDLEWARE

tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })

  console.log(this);

  next();
})

// -----------------------------------------------------------------------------------------



const Tour = mongoose.model('tour', tourSchema);


module.exports = {
  Tour
}

