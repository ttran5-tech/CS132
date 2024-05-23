/*
    Author: Thang Tran
    CS 132 Spring 2024
    Date: May 22nd, 2024

    This is the view-switching.js for my e-commerce site selling Yu-Gi-Oh cards.
    It currently features togglability between the main view (hot releases and
    all products) and the single product view.
*/

(function() {
    "use strict";

    /**
     * Initializes the images and x button to change views when clicked.
     * @returns {void} 
     */
    function init() {
        for (const img of qsa(".card-display img")) {
            img.addEventListener("click", toggleView);
        }
        qs("#back-btn").addEventListener("click", toggleView);
    }

    /**
     * Switches between single product and all product views.
     * @returns {void} 
     */
    function toggleView() {
        qs("main").classList.toggle("hidden");
        qs("#product").classList.toggle("hidden");
    }
  
    init();
})();