import {
    state
} from "./state.js";

import {
    $
} from "./utils.js";

import {
    centerOnPlayer
} from "./map.js";


function initializeGame() {

    console.log("GPS Coin starting...");

    bindEvents();
}


function bindEvents() {

    const centerButton =
        $("centerPlayerButton");

    if (centerButton) {

        centerButton.addEventListener(
            "click",
            centerOnPlayer
        );
    }
}


document.addEventListener(
    "DOMContentLoaded",
    initializeGame
);
