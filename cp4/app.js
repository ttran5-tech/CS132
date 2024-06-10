// Packages and express setup
const express = require('express');
const fs = require('fs/promises');
const multer = require("multer");
const app = express();

// Port number
const PORT = 8000;

// Error codes
const SERVER_ERROR_CODE = 500;
const PARAM_ERROR_CODE = 400;

// Error messages
const SERVER_ERROR = 'Server error. Please try again later.';

// Success message
const POST_SUCCESS = 'Successfully submitted review!';

// Review parameters
const REVIEW_PARAMETERS = ['name', 'review', 'stars', 'recommended'];

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Add POST endpoint middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(multer().none());

// Get all reviews
app.get('/reviews', async (req, res, next) => {
    // Attempts to read from 'reviews.json'. If an error is encountered, reviews is
    // guaranteed to be null, and the following if block will not run.
    const reviews = await readFromFile('reviews.json', res, next);

    // Will not run if an error occurred when reading from 'reviews.json'.
    if (reviews) {
        let filteredReviews = reviews.reviews;

        // Checks each parameter's validity. Since these are optional parameters, the function
        // will skip over missing or invalid parameters.
        if (req.query.name) {
            filteredReviews = filteredReviews.filter(review =>
                review.name.toLowerCase().includes(req.query.name.toLowerCase()));
        }
        if (req.query.review) {
            filteredReviews = filteredReviews.filter(review =>
                review.review.toLowerCase().includes(req.query.review.toLowerCase()));
        }
        if (req.query.stars) {
            filteredReviews = filteredReviews.filter(review => review.stars == req.query.stars);
        }
        if (req.query.recommended) {
            filteredReviews = filteredReviews.filter(review => 
                review.recommended == req.query.recommended);
        }

        res.json(filteredReviews);
    }
});

// Create a new review
app.post('/reviews', async (req, res, next) => {
    // Attempts to read from 'reviews.json'. If an error is encountered, reviews is
    // guaranteed to be null, and the following if block will not run.
    const reviews = await readFromFile('reviews.json', res, next);

    // Will not run if an error occurred when reading from 'reviews.json'.
    if (reviews) {
        const review = {};

        // Checks each parameter's validity. Since these are required parameters, the function will 
        // send a 400 error code and uses the middleware error handler to handle the error. 
        for (const parameter of REVIEW_PARAMETERS) {
            if (!req.body[parameter]) {
                const errMsg = `Missing required parameter: ${parameter}.`;
                raiseError(Error(), res, next, PARAM_ERROR_CODE, errMsg);
                return;
            }
            else {
                if (parameter === 'stars' && (!Number.isInteger(req.body[parameter]) ||
                    req.body[parameter] < 1 || req.body[parameter] > 5)) {
                    const errMsg = `Invalid parameter: ${parameter} (must be an integer between 1 and 5).`;
                    raiseError(Error(), res, next, PARAM_ERROR_CODE, errMsg);
                    return;
                }
                review[parameter] = req.body[parameter];
            }
        }

        reviews.reviews.push(review);

        // Converts object to JSON string that includes all parameters and indentations of 4 spaces
        try {
            await fs.writeFile('reviews.json', JSON.stringify(reviews, null, 4));
        }
        catch(err) {
            // Sends a 500 error code and uses the middleware error handler to handle the error
            raiseError(err, res, next, SERVER_ERROR_CODE, SERVER_ERROR);
            return;
        }

        res.type('text');
        res.status(201).send(POST_SUCCESS);
    }
});

app.listen(PORT);

/**
 * Reads JSON data from a given file and returns a JSON object representing that data. Sends a
 * 500 error code and returns null if the given file cannot be read from.
 * @param {string} file - File name
 * @param {express.Response} res - Response to send error to if applicable
 * @param {express.NextFunction} next - The next middleware function
 * @returns {JSON} JSON object representing file data
 */
async function readFromFile(file, res, next) {
    try {
        const data = await fs.readFile(file, 'utf8');
        return JSON.parse(data);
    } 
    catch (err) {
        raiseError(err, res, next, SERVER_ERROR_CODE, SERVER_ERROR);
        return null;
    }
}

/**
 * Raises error with the given code and message for the error handler middleware to handle
 * appropriately.
 * @param {Error} err - Error that was encountered
 * @param {express.Response} res - The response object to send error message to
 * @param {express.NextFunction} next - The "next" middleware function
 * @param {number} code - The HTTP status code to return
 * @param {string} message - The error message to send
 * @returns {void}
 */
function raiseError(err, res, next, code, message) {
    res.status(code);
    err.message = message;
    next(err);
}

/**
 * Middleware that handles different types of errors. Functions that call "next" with an error 
 * object are handled by this middleware appropriately.
 * @param {Error} err - Error that was encountered
 * @param {express.Request} req - The request object
 * @param {express.Response} res - The response object to send error message to
 * @param {express.NextFunction} next - The "next" middleware function
 * @returns {void} 
 */
function errorHandler(err, req, res, next) {
    res.type("text");
    res.send(err.message);
}

// Adds error handling to the middleware stack
app.use(errorHandler);