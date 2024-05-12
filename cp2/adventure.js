/*
    Author: Thang Tran
    CS 132 Spring 2024
    Date: May 11th, 2024

    This is the adventure.js script for a choose-your-own-adventure zombie 
    survival game. It features a scoring system that determines the user's 
    victory status based on their choices, allows the user to collect items
    in their inventory, and an easter-egg for the user to instantly win.
*/

(function() {
    "use strict";

    // Define the Konami code
    const KONAMI_CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
                        "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
                        "KeyB", "KeyA"];

    // Image labels for the inventory
    const IMAGE_LABELS = {
        "baseball-bat": "Baseball Bat",
        "hammer": "Hammer",
        "machete": "Machete",
        "food": "Canned Food",
        "water": "Water Bottles",
        "furby": "Furby",
    }

    // Image scores to determine victory/defeat
    const IMAGE_SCORES = {
        "baseball-bat": 4,
        "hammer": 2,
        "machete": 5,
        "food": 5,
        "water": 5,
        "furby": 1,
        "mall": 3,
        "bunker": 5,
        "field": 1,
    }

    // Parents to populate
    const END_VIEW = qs("#end-view");
    const INVENTORY = qs("#inventory > div");

    // Score threshold to win
    const THRESHOLD = 10;

    let konamiIndex = 0;
    let score = 0;

    /**
     * Initializes the start button to change views when clicked.
     * @returns {void} 
     */
    function init() {
        document.addEventListener("keydown", checkKeyPress);
        qs("#start-btn").addEventListener("click", startGame);

        for (const image of qsa("#weapon-view > div > img")) {
            image.addEventListener("click", function() {
                populateParent(IMAGE_LABELS[this.id], INVENTORY);
                addScore(IMAGE_SCORES[this.id]);
                supplyPage();
            });
        }

        for (const image of qsa("#supply-view > div > img")) {
            image.addEventListener("click", function() {
                populateParent(IMAGE_LABELS[this.id], INVENTORY);
                addScore(IMAGE_SCORES[this.id]);
                locationPage();
            });
        }

        for (const image of qsa("#location-view > div > img")) {
            image.addEventListener("click", function() {
                addScore(IMAGE_SCORES[this.id]);
                checkVictory();
            });
        }
    }

    /**
     * Switches the current view of the game to the weapon choice screen.
     * @returns {void} 
     */
    function startGame() {
        qs("#menu-view").classList.toggle("hidden");
        qs("#weapon-view").classList.toggle("hidden");
    }

    /**
     * Switches the current view of the game to the supply choice screen.
     * @returns {void} 
     */
    function supplyPage() {
        qs("#weapon-view").classList.toggle("hidden");
        qs("#supply-view").classList.toggle("hidden");
    }

    /**
     * Switches the current view of the game to the location choice screen.
     * @returns {void} 
     */
    function locationPage() {
        qs("#supply-view").classList.toggle("hidden");
        qs("#location-view").classList.toggle("hidden");
    }

    /**
     * Switches the current view of the game to the end screen.
     * @returns {void} 
     */
    function endView() {
        qs("#game-view").classList.toggle("hidden");
        qs("#end-view").classList.toggle("hidden");
    }

    /**
     * Adds a value to the total running score.
     * @param {int} value - Value to add
     * @returns {void} 
     */
    function addScore(value) {
        score += value;
    }

    /**
     * Populates a given parent DOM element with the given text.
     * @param {string} item - Desired text to populate the parent element with
     * @param {object} parent - The DOM element to be populated
     * @returns {void} 
     */
    function populateParent(item, parent) {
        const p = document.createElement("p");
        p.textContent = item;
        parent.appendChild(p);
    }

    /**
     * Clears the current inventory.
     * @returns {void} 
     */
    function clearInventory() {
        for (const item of qsa("#inventory > div > p")) {
            INVENTORY.removeChild(item);
        }
    }

    /**
     * Clears the end view (typically when the game is restarted).
     * @returns {void} 
     */
    function clearEndView() {
        for (const item of qsa("#end-view > p")) {
            END_VIEW.removeChild(item);
        }
    }

    /**
     * Checks for user keypresses such as the konami code sequence or the
     * restart key.
     * @param {event} e - Keypress event
     * @returns {void} 
     */
    function checkKeyPress(e) {
        if (e.code === KONAMI_CODE[konamiIndex]) {
            konamiIndex++;

            if (konamiIndex == KONAMI_CODE.length) {
                victory();
                konamiIndex = 0;
            }
        } 
        else {
            konamiIndex = 0;
        }

        if (e.code === "KeyR") {
            restart();
        }
    }

    /**
     * Informs the user of their victory.
     * @returns {void} 
     */
    function victory() {
        populateParent("Congratulations! You live to see another day.", END_VIEW);
        populateParent("But there's always tomorrow...", END_VIEW);

        qs("#end-view").classList.add("victory");
        endView();
    }

    /**
     * Informs the user of their defeat.
     * @returns {void} 
     */
    function defeat() {
        populateParent("Unfortunately, you didn't make it.", END_VIEW);
        populateParent("Retry? (Press R)", END_VIEW);

        endView();
    }

    /**
     * Checks the game's score to determine the user's victory status.
     * @returns {void} 
     */
    function checkVictory() {
        if (score >= THRESHOLD) {
            victory();
        }
        else {
            defeat();
        }
    }

    /**
     * Resets the current game view and progress to the its initial state.
     * @returns {void} 
     */
    function restart() {
        qs("#end-view").classList.remove("victory");

        qs("#end-view").classList.add("hidden");
        qs("#weapon-view").classList.add("hidden");
        qs("#supply-view").classList.add("hidden");
        qs("#location-view").classList.add("hidden");

        qs("#game-view").classList.remove("hidden");
        qs("#menu-view").classList.remove("hidden");

        clearEndView();
        clearInventory();

        score = 0;
    }
  
    init();
})();