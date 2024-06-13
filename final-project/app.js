// Packages and express setup
const express = require('express');
const fs = require('fs/promises');
const multer = require("multer");
const app = express();

// Port number
const PORT = 3000;

// Error codes
const SERVER_ERROR_CODE = 500;
const CARD_ID_ERROR_CODE = 404;
const PARAM_ERROR_CODE = 400;

// Error messages
const SERVER_ERROR = 'Server error. Please try again later.';
const CARD_ID_ERROR = 'Card ID not found.';

// Card parameters
const CARD_PARAMETERS = ['name', 'type', 'level', 'attribute', 'archetype', 
                         'price', 'sale_price', 'image_url', 'gen'];

// Feedback parameters
const FEEDBACK_PARAMETERS = ['name', 'email', 'message'];

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Add POST endpoint middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(multer().none());

// Get all cards
app.get('/api/cards', async (req, res, next) => {
    // Attempts to read from 'cards.json'. If an error is encountered, cards is
    // guaranteed to be null, and the following if block will not run.
    const cards = await readFromFile('cards.json', res, next);

    // Will not run if an error occurred when reading from 'cards.json'.
    if (cards) {
        let filteredCards = cards;

        // Checks each parameter's validity. Since these are optional parameters, the function
        // will skip over missing or invalid parameters.
        if (req.query.name) {
            filteredCards = filteredCards.filter(card =>
                card.name.toLowerCase().includes(req.query.name.toLowerCase()));
        }
        if (req.query.type) {
            filteredCards = filteredCards.filter(card => card.type === req.query.type);
        }
        if (req.query.level) {
            filteredCards = filteredCards.filter(card => card.level == req.query.level);
        }
        if (req.query.attribute) {
            filteredCards = filteredCards.filter(card => card.attribute && 
                card.attribute.toLowerCase() === req.query.attribute.toLowerCase());
        }
        if (req.query.archetype) {
            filteredCards = filteredCards.filter(card => card.archetype &&
                card.archetype.toLowerCase().includes(req.query.archetype.toLowerCase()));
        }

        res.json(filteredCards);
    }
});

// Get card by ID
app.get('/api/cards/:id', async (req, res, next) => {
    // Attempts to read from 'cards.json'. If an error is encountered, cards is
    // guaranteed to be null, and the following if block will not run.
    const cards = await readFromFile('cards.json', res, next);

    // Will not run if an error occurred when reading from 'cards.json'.
    if (cards) {
        const card = cards.find(c => c.id === parseInt(req.params.id));

        // Sends a 404 error code and reports if the card ID wasn't found
        if (!card) {
            raiseError(Error(), res, next, CARD_ID_ERROR_CODE, CARD_ID_ERROR);
            return;
        }

        res.json(card);
    }
});

// Create a new card
app.post('/api/cards', async (req, res, next) => {
    // Attempts to read from 'cards.json'. If an error is encountered, cards is
    // guaranteed to be null, and the following if block will not run.
    const cards = await readFromFile('cards.json', res, next);

    // Will not run if an error occurred when reading from 'cards.json'.
    if (cards) {
        const card = { id: cards.length + 1 };

        // Checks each parameter's validity. Since these are required parameters, with the 
        // exception of 'sale_price', the function will send a 400 error code and uses the 
        // middleware error handler to handle the error. In the case of the optional 'sale_price', 
        // it is set to null if the parameter is missing or invalid.
        for (const parameter of CARD_PARAMETERS) {
            if (!(parameter in req.body)) {
                if (parameter !== 'sale_price') {
                    const errMsg = `Missing required parameter: ${parameter}.`;
                    raiseError(Error(), res, next, PARAM_ERROR_CODE, errMsg);
                    return;
                }
                else {
                    card[parameter] = null;
                }
            }
            else {
                card[parameter] = req.body[parameter];
            }
        }

        cards.push(card);

        // Converts object to JSON string that includes all parameters and indentations of 2 spaces
        try {
            await fs.writeFile('cards.json', JSON.stringify(cards, null, 2));
        }
        catch(err) {
            // Sends a 500 error code and uses the middleware error handler to handle the error
            raiseError(err, res, next, SERVER_ERROR_CODE, SERVER_ERROR);
            return;
        }

        res.type('text');
        res.status(201).send(`Successfully created the card ${card.name}!`);
    }
});

// Update a card
app.put('/api/cards/:id', async (req, res, next) => {
    // Attempts to read from 'cards.json'. If an error is encountered, cards is
    // guaranteed to be null, and the following if block will not run.
    const cards = await readFromFile('cards.json', res, next);

    // Will not run if an error occurred when reading from 'cards.json'.
    if (cards) {
        const card = cards.find(c => c.id === parseInt(req.params.id));

        // Sends a 404 error code and reports if the card ID wasn't found
        if (!card) {
            raiseError(Error(), res, next, CARD_ID_ERROR_CODE, CARD_ID_ERROR);
            return;
        }

        // Checks each parameter's validity. Since these are optional parameters, the function
        // will skip over missing or invalid parameters.
        CARD_PARAMETERS.forEach((parameter) => {
            if (req.body[parameter]) {
                card[parameter] = req.body[parameter];
            }
        })
        
        // Converts object to JSON string that includes all parameters and indentations of 2 spaces
        try {
            await fs.writeFile('cards.json', JSON.stringify(cards, null, 2));
        }
        catch(err) {
            // Sends a 500 error code and uses the middleware error handler to handle the error
            raiseError(err, res, next, SERVER_ERROR_CODE, SERVER_ERROR);
            return;
        }

        res.type('text');
        res.send(`Successfully updated the card ${card.name}!`);
    }
});

// Delete a card
app.delete('/api/cards/:id', async (req, res, next) => {
    // Attempts to read from 'cards.json'. If an error is encountered, cards is
    // guaranteed to be null, and the following if block will not run.
    let cards = await readFromFile('cards.json', res, next);

    // Will not run if an error occurred when reading from 'cards.json'.
    if (cards) {
        const card = cards.find(c => c.id === parseInt(req.params.id));

        // Sends a 404 error code and reports if the card ID wasn't found
        if (!card) {
            raiseError(Error(), res, next, CARD_ID_ERROR_CODE, CARD_ID_ERROR);
            return;
        }

        cards = cards.filter(c => c.id !== parseInt(req.params.id));

        // Converts object to JSON string that includes all parameters and indentations of 2 spaces
        try {
            await fs.writeFile('cards.json', JSON.stringify(cards, null, 2));
        }
        catch(err) {
            // Sends a 500 error code and uses the middleware error handler to handle the error
            raiseError(err, res, next, SERVER_ERROR_CODE, SERVER_ERROR);
            return;
        }

        res.type('text');
        res.send(`Successfully deleted the card ${card.name}!`);
    }
});

// Create a new feedback
app.post('/api/feedback', async (req, res, next) => {
    // Attempts to read from 'feedback.json'. If an error is encountered, cards is
    // guaranteed to be null, and the following if block will not run.
    let feedbacks = await readFromFile('feedback.json', res, next);

    // Will not run if an error occurred when reading from 'feedback.json'.
    if (feedbacks) {
        const feedback = { id: Date.now() };

        // Checks each parameter's validity. Since these are required parameters, the function
        // will send a 400 error code and uses the middleware error handler to handle the error.
        for (const parameter of FEEDBACK_PARAMETERS) {
            if (!req.body[parameter]) {
                const errMsg = `Please provide a valid ${parameter}.`;
                raiseError(Error(), res, next, PARAM_ERROR_CODE, errMsg);
                return;
            }
            else {
                feedback[parameter] = req.body[parameter];
            }
        }

        // Push the new feedback into the existing set of feedbacks
        feedbacks.push(feedback);

        // Converts object to JSON string that includes all parameters and indentations of 2 spaces
        try {
            await fs.writeFile('feedback.json', JSON.stringify(feedbacks, null, 2));
        }
        catch(err) {
            // Sends a 500 error code and uses the middleware error handler to handle the error
            raiseError(err, res, next, SERVER_ERROR_CODE, SERVER_ERROR);
            return;
        }

        res.type('text');
        res.status(201).send(`Successfully submitted feedback by ${feedback.name}!`);
    }
});

// Get all FAQs
app.get('/api/faq', async (req, res, next) => {
    // Attempts to read from 'faq.json'. If an error is encountered, cards is
    // guaranteed to be null, and the following if block will not run.
    const faqs = await readFromFile('faq.json', res, next);

    // Will not run if an error occurred when reading from 'faq.json'.
    if (faqs) {
        res.json(faqs);
    }
});

// Get promo cards
app.get('/api/promos', async (req, res, next) => {
    // Attempts to read from 'cards.json'. If an error is encountered, cards is
    // guaranteed to be null, and the following if block will not run.
    const cards = await readFromFile('cards.json', res, next);

    // Will not run if an error occurred when reading from 'cards.json'.
    if (cards) {
        const promoCards = cards.filter(card => card.sale_price !== null);
        res.json(promoCards);
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
