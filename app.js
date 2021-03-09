const express = require('express');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const { AppError } = require('./utils/appError');
const { globalErrorHandler } = require('./controllers/errorController');


// calling express functions, which gives us access to all the functions
const app = express();


// NOTE:    MIDDLEWAREs

// order always matter
app.use(express.json());

// to server static files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
//    console.log('req headers', req.headers); 

   next();
});



// this is called mounting
// this is also middleware
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);


// if it doesn't reach any of the routes mentioned above
app.all('*', (req, res, next) => {
    next(new AppError(`can't find requested URL : ${req.originalUrl} !`, 404))
})

app.use(globalErrorHandler);


module.exports = {
    app
}


// // own middleware 
// app.use((req, res, next) => {
//     console.log('Hello, from our custom middleware');
    
//     // never forget to call next() while creating own middleware,
//     // otherwise it ll not be able to move to next middleware and send response back to the client
       // if we pass any parameter to next, it ll automatically assume that, it is an error and 
       // will skip all the middleware and send the error to global handling middleware 
//     next();
// })