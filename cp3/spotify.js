/*
 * Author: Thang Tran
 * CS 132 Spring 2024
 * Date: May 26th, 2024
 *
 * This is the spotify.js script for my Higher or Lower game using the Spotify 
 * API. Currently, the user is able to toggle views and make guesses, while
 * the backend operates to retrieve random artist data from the Spotify API.
 */

(function() {
    "use strict";

    const TIMER_DELAY = 3000;

    const BASE_URL = "https://api.spotify.com/v1/";
    const CATEGORIES_EP = BASE_URL + "browse/categories";
    const PLAYLIST_EP = BASE_URL + "playlists/"
    const ARTIST_EP = BASE_URL + "artists/";

    const CLIENT_ID = "85ce65f9d0474b1e855cf8a839a4d050";
    const CLIENT_SECRET = "52fdde05151e48c2914780b88462be21";

    const CURRENT_ARTIST = qs("#current-artist");
    const NEXT_ARTIST = qs("#next-artist");
    const MESSAGE_AREA = qs("#message-area > p");

    const START_BTN = qs("#start-btn");
    const HIGHER_BTN = qs("#higher-btn");
    const LOWER_BTN = qs("#lower-btn");

    let accessToken;

    let score = 0;

    let currentFollowers = 0;
    let nextFollowers = 0;

    /**
     * Sets up the game by obtaining an access token and initializing view
     * switching and score UIs.
     * @returns {void}
     */
    async function init() {
        getAccessToken();

        score = 0;
        setScore(score);

        START_BTN.addEventListener("click", startGame);
        START_BTN.addEventListener("click", toggleView);
        addEventListeners();
    }

    /**
     * Updates the accessToken given the response JSON's token to be used in
     * future fetch calls.
     * @returns {void}
     */
    async function getAccessToken() {
        let resp = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
              Authorization: "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
        })
        .then(checkStatus)
        .then(response => response.json())
        .catch(handleError);

        accessToken = resp.access_token;
    }

    /**
     * Prepares both artist cards at the start of the game.
     * @returns {void}
     */
    async function startGame() {
        await prepareArtistCard(CURRENT_ARTIST)
        .then(function() {
            prepareArtistCard(NEXT_ARTIST)
        })
        .catch(handleError);
    }

    /**
     * Prepares the given artist card (current or next).
     * @param {Object} card - Artist card DOMElement to be prepared with a
     * random artist's info.
     * @returns {void}
     */
    async function prepareArtistCard(card) {
        await fetchRandomCategory()
        .then(fetchRandomPlaylist)
        .then(fetchRandomTrack)
        .then(fetchRandomArtist)
        .then(function(artistInfo) {
            populateCard(artistInfo, card);
        })
        .catch(handleError);
    }
    
    /**
     * Uses the 'categories' Spotify API endpoint:
     * https://developer.spotify.com/documentation/web-api/reference/get-categories
     * 
     * Fetches categories from the Spotify API and returns a random one. 
     * Displays a useful error message if an error occurs during the request.
     * @returns {Object} - Data for one random music category.
     */
    async function fetchRandomCategory() {
        const url = `${CATEGORIES_EP}`;

        let resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
        .then(checkStatus)
        .then(response => response.json())
        .catch(handleError);

        const categories = resp.categories.items;
        const randomCategory = categories[Math.floor(Math.random() * 
                                          categories.length)].id;
        return randomCategory;
    }

    /**
     * Uses the 'playlists' Spotify API endpoint:
     * https://developer.spotify.com/documentation/web-api/reference/get-playlist
     * 
     * Fetches category playlists from the Spotify API and returns a random one. 
     * Displays a useful error message if an error occurs during the request.
     * @param {Object} category - Data for one music category.
     * @returns {Object} - Data for one random playlist.
     */
    async function fetchRandomPlaylist(category) {
        const url = `${CATEGORIES_EP}/${category}/playlists`;

        let resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
        .then(checkStatus)
        .then(response => response.json())
        .catch(handleError);

        const playlists = resp.playlists.items;
        const randomPlaylist = playlists[Math.floor(Math.random() * 
                                         playlists.length)].id;
        return randomPlaylist;
    }

    /**
     * Uses the 'playlists' Spotify API endpoint:
     * https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks
     * 
     * Fetches playlist tracks from the Spotify API and returns a random one. 
     * Displays a useful error message if an error occurs during the request.
     * @param {Object} playlist - Data for one playlist.
     * @returns {Object} - Data for one random track.
     */
    async function fetchRandomTrack(playlist) {
        const url = `${PLAYLIST_EP}${playlist}/tracks`;

        let resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
        .then(checkStatus)
        .then(response => response.json())
        .catch(handleError);

        const tracks = resp.items;
        const randomTrack = tracks[Math.floor(Math.random() * 
                                   tracks.length)].track;
        return randomTrack;
    }

    /**
     * Uses the 'artists' Spotify API endpoint:
     * https://developer.spotify.com/documentation/web-api/reference/get-an-artist
     * 
     * Fetches track artists from the Spotify API and returns a random one. 
     * Displays a useful error message if an error occurs during the request.
     * @param {Object} track - Data for one track.
     * @returns {Object} - Data for one random artist.
     */
    async function fetchRandomArtist(track) {
        const artistID = track.artists[Math.floor(Math.random() * 
                                           track.artists.length)].id;
        const url = `${ARTIST_EP}${artistID}`;

        let resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            }
        })
        .then(checkStatus)
        .then(response => response.json())
        .catch(handleError);

        return resp;
    }

    /**
     * Given an artist's info and the desired artist card, populate the card
     * with the artist's image, name, and number of followers.
     * @param {Object} artistInfo - Data for one artist.
     * @param {Object} card - Artist card DOMElement to be prepared with the 
     * artist's info.
     * @returns {void}
     */
    function populateCard(artistInfo, card) {
        const img = gen("img");
        img.src = artistInfo.images[0].url;
        img.alt = artistInfo.name;
        card.appendChild(img);

        const header = gen("h3");
        header.textContent = artistInfo.name;
        card.appendChild(header);

        const followers = gen("p");
        const totalFollowers = artistInfo.followers.total;
        followers.textContent = `Followers: ${totalFollowers}`;

        if (card.id === "next-artist") {
            followers.classList.add("hidden");
            nextFollowers = totalFollowers;
        }
        else {
            currentFollowers = totalFollowers;
        }
        
        card.appendChild(followers);
    }

    /**
     * Make a guess that the artist on the right has more followers than the
     * artist on the left.
     * @returns {void}
     */
    function guessHigher() {
        qs("#next-artist > p").classList.remove("hidden");
        if (nextFollowers >= currentFollowers) {
            continuePlaying();
        }
        else {
            defeat();
        }
    }

    /**
     * Make a guess that the artist on the right has fewer followers than the
     * artist on the left.
     * @returns {void}
     */
    function guessLower() {
        qs("#next-artist > p").classList.remove("hidden");
        if (nextFollowers <= currentFollowers) {
            continuePlaying();
        }
        else {
            defeat();
        }
    }

    /**
     * Informs the user of their correct guess, increments the score, and
     * prepares the next artist card.
     * @returns {void}
     */
    function continuePlaying() {
        removeEventListeners();

        HIGHER_BTN.classList.add("correct");
        LOWER_BTN.classList.add("correct");

        MESSAGE_AREA.textContent = "CORRECT!"

        setTimeout(prepareNextArtist, TIMER_DELAY);
        setTimeout(async function() {
            await prepareArtistCard(NEXT_ARTIST)
            .catch(handleError);
        }, TIMER_DELAY)
    }

    /**
     * Prepares the next artist card if the user has made a correct guess.
     * @returns {void}
     */
    function prepareNextArtist() {
        addEventListeners();
        HIGHER_BTN.classList.remove("correct");
        LOWER_BTN.classList.remove("correct");

        MESSAGE_AREA.textContent = "";

        for (let i = CURRENT_ARTIST.children.length - 1; i >= 0; i--) {
            CURRENT_ARTIST.replaceChild(NEXT_ARTIST.children[i], 
                                        CURRENT_ARTIST.children[i]);
        }
        currentFollowers = nextFollowers;

        score += 1;
        setScore(score);
    }

    /**
     * Informs the user of their incorrect guess and resets the game.
     * @returns {void}
     */
    function defeat() {
        HIGHER_BTN.classList.add("incorrect");
        LOWER_BTN.classList.add("incorrect");

        MESSAGE_AREA.textContent = "INCORRECT. GAME RESTARTING"

        setTimeout(function() {
            resetGame();
            score = 0;
            setScore(score);
        }, TIMER_DELAY);
    }

    /**
     * Resets the game if the user has made an incorrect guess.
     * @returns {void}
     */
    function resetGame() {
        HIGHER_BTN.classList.remove("incorrect");
        LOWER_BTN.classList.remove("incorrect");

        currentFollowers = 0;
        nextFollowers = 0

        for (let i = CURRENT_ARTIST.children.length - 1; i >= 0; i--) {
            CURRENT_ARTIST.removeChild(CURRENT_ARTIST.children[i]);
        }

        for (let i = NEXT_ARTIST.children.length - 1; i >= 0; i--) {
            NEXT_ARTIST.removeChild(NEXT_ARTIST.children[i]);
        }

        MESSAGE_AREA.textContent = "";

        toggleView();
    }

    /**
     * Adds event listeners to allow the user to make a guess.
     * @returns {void}
     */
    function addEventListeners() {
        HIGHER_BTN.addEventListener("click", guessHigher);
        LOWER_BTN.addEventListener("click", guessLower);
    }

    /**
     * Removes event listeners to prevent the user from making guesses during
     * downtime.
     * @returns {void}
     */
    function removeEventListeners() {
        HIGHER_BTN.removeEventListener("click", guessHigher);
        LOWER_BTN.removeEventListener("click", guessLower);
    }

    /**
     * Updates the score in the game's HUD to the given score.
     * @param {number} value - score to set.
     * @returns {void} 
     */
    function setScore(value) {
        qs("#score").textContent = value;
    }

    /**
     * Switches between menu and game views.
     * @returns {void} 
     */
    function toggleView() {
        qs("#menu-view").classList.toggle("hidden");
        qs("#game-view").classList.toggle("hidden");
    }


    /**
     * Displays an error message on the page and resets the game while 
     * maintaining the user's current score. Can be configured to show a custom
     * error message, and otherwise displays a generic message.
     * @param {String} message - optional specific error message to display.
     * @returns {void}
     */
     function handleError(message) {
        if (typeof message === "string") {
            MESSAGE_AREA.textContent = message;
        } 
        else {
            MESSAGE_AREA.textContent = 
            "An error ocurred fetching the Spotify data. " + 
            "The game will now restart (keeping your current score).";
        }

        setTimeout(resetGame, TIMER_DELAY);
    }

    init();
})();
