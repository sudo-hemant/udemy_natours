const express = require('express');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const { AppError } = require('./utils/appError');
const { globalErrorHandler } = require('./controllers/errorController');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');


// calling express functions, which gives us access to all the functions
const app = express();


// NOTE:   GLOBAL  MIDDLEWAREs    ------   order always matter

    // never forget to call next() while creating own middleware,
    // otherwise it ll not be able to move to next middleware and send response back to the client
    // if we pass any parameter to next, it ll automatically assume that, it is an error and 
    // will skip all the middleware and send the error to global handling middleware 

// set security headers
app.use(helmet())

// limit request from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: `Too many request from an IP, please try again in an hour.`,
});
app.use('/api', limiter);

// body parser, reading data from body in req.body
// limit package to 10kb
app.use(express.json({ limit: '10kb' }));

// data sanitization against NoSQL query injection
// remove '$' sign etc 
app.use(mongoSanitize());

// Data sanitization against XSS
// remove user input from malicious HTML code
app.use(xss());

// prevent parameter pollution
// removes duplicates in query parameter 
// EX: if we use ?sort=price&sort=rate
app.use(hpp({
    // to allow user to write certain fields twice
    whitelist: [
        'duration', 'ratingsQuantity', 'ratingsAverage', 'price', 'maxGroupSize',
    ]
}));

// to server static files
app.use(express.static(`${__dirname}/public`));

// self made testing global middleware
app.use((req, res, next) => {
    //    console.log('req headers', req.headers); 

    next();
});



// this is called mounting
// this is also middleware
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);


// if it doesn't reach any of the routes mentioned above
app.all('*', (req, res, next) => {
    next(new AppError(`can't find requested URL : ${req.originalUrl} !`, 404))
})

app.use(globalErrorHandler);


module.exports = {
    app
}

