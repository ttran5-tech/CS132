/*
 * Author: Thang Tran
 * CS 132 Spring 2024
 * Date: June 9th, 2024
 *
 * This is the review.js page for my site where users can submit and look at
 * movie reviews. It currently features a form where users can submit their
 * own reviews and a search filter where users can look at other reviews.
 */

(function() {
    "use strict";

    const TIMER_DELAY = 3000;
    const MAX_STARS = 5;

    const BASE_URL = "http://localhost:8000/reviews";
    const SEARCH_URL = BASE_URL + "?";

    const SUCCESS_MESSAGE = "Thank you for submitting your review!";
    const NO_REVIEWS = "The search didn't return any reviews. Please try again.";

    const STARS = qsa("#star-rating > span");
    const RECOMMENDED = qsa("#recommended-rating > span");
    const MESSAGE_AREA = qs("#message-area > p");

    /**
     * Initializes the review form and search filter's interactive elements.
     * @returns {void}
     */
    async function init() {
        for (const star of STARS) {
            star.addEventListener("click", updateStars);
        }

        for (const recommended of RECOMMENDED) {
            recommended.addEventListener("click", updateRecommended);
        }

        qs("#review-form").addEventListener("submit", function(event) {
            event.preventDefault();
            postReview(); 
        });
        
        const searchBar = qs("#search-bar");
        searchBar.addEventListener("change", () => {
            if (searchBar.value) {
                fetchReviews(searchBar.value, null, null, null);
            }
        });
    }

    /**
     * Uses the movie review API to fetch movie reviews using the given query
     * parameters to filter the search as necessary, then populates the review
     * view area with the returned searches.
     * @param {string} name - search query for the movie name.
     * @param {string} review - search query for the review text.
     * @param {number} stars - search query for the star rating.
     * @param {string} recommended - search query for the recommendation status.
     * @returns {void}
     */
    async function fetchReviews(name, review, stars, recommended) {
        let url = SEARCH_URL;

        if (name) {
            const nameQuery = encodeURIComponent(name);
            url += `name=${nameQuery}&`;
        }
        if (review) {
            const reviewQuery = encodeURIComponent(review);
            url += `review=${reviewQuery}&`;
        }
        if (stars) {
            url += `stars=${stars}&`;
        }
        if (recommended !== null) {
            if (recommended) {
                url += `recommended=yes`;
            }
            else {
                url += `recommended=no`;
            }
        }

        await fetch(url)
        .then(checkStatus)
        .then(response => response.json())
        .then(populateReviewsView)
        .catch(handleError);
    }

    /**
     * Uses the form data to submit a user's movie review, then displays a 
     * success message.
     * @returns {void}
     */
    async function postReview() {
        let url = BASE_URL;

        const params = new FormData(qs("#review-form"));

        let body = {};
        for (const pair of params.entries()) {
            if (pair[0] === "stars") {
                body[pair[0]] = parseInt(pair[1]);
            }
            else {
                body[pair[0]] = pair[1];
            }
        }

        await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        })
        .then(checkStatus)
        .catch(handleError);

        displaySuccessMessage();
    }

    /**
     * Populates the review view area using the retrieved movie review API data.
     * @param {Object} reviewsData - data returned from the movie review API.
     * @returns {void}
     */
    function populateReviewsView(reviewsData) {
        if (reviewsData.length === 0) {
            handleError(NO_REVIEWS);
        }

        const articles = qs("#review-articles");
        for (let i = articles.children.length - 1; i >= 0; i--) {
            articles.removeChild(articles.children[i]);
        }

        for (const reviewData of reviewsData) {
            const article = genReviewCard(reviewData);
            articles.appendChild(article);
        }
    }

    /**
     * Generates an article based on a given movie review.
     * @param {Object} reviewData - one review datapoint from the movie review API.
     * @returns {Object} - the returned article DOM element.
     */
    function genReviewCard(reviewData) {
        const article = gen("article");

        const header = gen("h3");
        header.textContent = reviewData.name;
        article.appendChild(header);

        const review = gen("p");
        review.textContent = reviewData.review;
        article.appendChild(review);

        const starRating = gen("div");
        starRating.classList.add("stars");
        article.appendChild(starRating);

        for (let i = 0; i < MAX_STARS; i++) {
            const img = gen("img");
            img.src = "img/rainbow-star.png";
            img.alt = "Rainbow Star";

            if (i >= reviewData.stars) {
                img.classList.add("inactive");
            }

            starRating.appendChild(img);
        }

        const recommendedRating = gen("div");
        recommendedRating.classList.add("recommendations");
        article.appendChild(recommendedRating);

        const thumbsUp = gen("img");
        thumbsUp.src = "img/thumbs-up.png";
        thumbsUp.alt = "Thumbs Up";

        const thumbsDown = gen("img");
        thumbsDown.src = "img/thumbs-down.png";
        thumbsDown.alt = "Thumbs Down";

        if (reviewData.recommended === "yes") {
            thumbsDown.classList.add("inactive");
        }
        else {
            thumbsUp.classList.add("inactive");
        }

        recommendedRating.appendChild(thumbsUp);
        recommendedRating.appendChild(thumbsDown);

        return article;
    }

    /**
     * Updates the review form's star interface.
     * @returns {void}
     */
    function updateStars() {
        const value = this.getAttribute('data-value');
        qs("#stars").value = value;

        for (const star of STARS) {
            star.classList.remove('inactive');
        }

        for (let i = STARS.length - 1; i >= value; i--) {
            STARS[i].classList.add("inactive")
        }
    }

    /**
     * Updates the review form's recommendation interface.
     * @returns {void}
     */
    function updateRecommended() {
        const value = this.getAttribute('data-value');
        qs("#recommended").value = value;

        for (const recommended of RECOMMENDED) {
            recommended.classList.toggle('inactive');
        }
    }

    /**
     * Displays a preset success message, then clears it after some time.
     * @returns {void}
     */
    function displaySuccessMessage() {
        MESSAGE_AREA.classList.remove("hidden");
        MESSAGE_AREA.textContent = SUCCESS_MESSAGE;
        setTimeout(resetMessageArea, TIMER_DELAY);
    }

    /**
     * Displays an error message on the page, then clears it after some time. 
     * Can be configured to show a custom error message, and otherwise displays 
     * a generic message.
     * @param {String} message - optional specific error message to display.
     * @returns {void}
     */
    function handleError(message) {
        MESSAGE_AREA.classList.remove("hidden");
        if (typeof message === "string") {
            MESSAGE_AREA.textContent = message;
        } 
        else {
            MESSAGE_AREA.textContent = 
            "An error occurred while posting the movie review. Please try again later.";
        }

        setTimeout(resetMessageArea, TIMER_DELAY);
    }

    /**
     * Clears the website's message area.
     * @returns {void}
     */
    function resetMessageArea() {
        MESSAGE_AREA.textContent = "";
        MESSAGE_AREA.classList.add("hidden");
    }

    init();
})();
