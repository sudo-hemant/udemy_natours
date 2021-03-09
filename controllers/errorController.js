const { AppError } = require("../utils/appError");





// NOTE:    ERROR TO GET WHILE WE ARE IN DEVELOPMENT PHASE
const sendErrorDev = (err, res) => {
    // console.log('error at : send error dev');

    res.status(err.statusCode).json({
        status: err.status,
        err: err,
        message: err.message,
        stack: err.stack,
    })
}

// NOTE:    ERROR TO GET WHILE WE ARE IN PRODUCTION PHASE
const sendErrorProduction = (err, res) => {

    if (err.isOperational) {

        // Operational, trusted error : send the true error
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })

    } else {

        console.error('ERROR', err);
        // programming or other unknown error: don't leak details to client
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        })
    }
}

//-----------------------------------------------------------------------
// NOTE:    ALL CUSOTM ERRORs MADE BY US.

const handleCastErrorDB = err => {
    return new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
}

const handleDuplicateFieldError = err => {
    const value = err.message.match(/(["'])(\\?.)*?\1/)[0];

    return new AppError(`duplicate field value: ${value}. plz use another field`, 400);
}

const handleValidationErrorDB = err => {
    return new AppError('invalid data', 400);
}

const handleJWTError = err => {
    return new AppError('Invalid token, please login again.', 401);
}

const handleTokenExpiredError = err => {
    return new AppError('Token expired, please login again', 401);
}






// error handling middleware  
const globalErrorHandler = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);

    } else if (process.env.NODE_ENV === 'production') {
        
        let error = { ...err };

        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldError(error);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
        if (error.name === 'TokenExpiredError') error = handleTokenExpiredError(error);


        sendErrorProduction(error, res);
    }

}

module.exports = {
    globalErrorHandler
}