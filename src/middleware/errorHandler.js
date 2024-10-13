const errorHandler = (err, req, res, next) => {
    console.error(err);  // Log the full error for debugging

    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';
    const message = err.message || 'An unexpected error occurred';

    res.status(statusCode).json({
        status: status,
        message: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;