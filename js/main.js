import {
    state
} from "./state.js";

import {
    $,
    setStatus
} from "./utils.js";

import {
    initializeMap,
    centerOnPlayer
} from "./map.js";

import {
    initializeAuth
} from "./auth.js";


// =========================
// START GAME
// =========================

function initializeGame() {

    console.log(
        "🪙 GPS COIN starting..."
    );


    // -------------------------
    // Start authentication
    // -------------------------

    initializeAuth();


    // -------------------------
    // Start map
    // -------------------------

    initializeMap(
        0,
        0
    );


    // -------------------------
    // Buttons
    // -------------------------

    bindButtons();


    console.log(
        "🪙 GPS COIN initialized"
    );
}


// =========================
// BUTTONS
// =========================

function bindButtons() {

    // Center player

    const centerButton =
        $("centerPlayerButton");

    if (centerButton) {

        centerButton.addEventListener(
            "click",
            centerOnPlayer
        );
    }


    // Shop

    const shopButton =
        $("shopButton");

    if (shopButton) {

        shopButton.addEventListener(
            "click",
            openShop
        );
    }


    // Account

    const accountButton =
        $("accountButton");

    if (accountButton) {

        accountButton.addEventListener(
            "click",
            openAccount
        );
    }


    // Close shop

    const closeShop =
        $("closeShop");

    if (closeShop) {

        closeShop.addEventListener(
            "click",
            closeShopOverlay
        );
    }


    // Close account

    const closeAccount =
        $("closeAccount");

    if (closeAccount) {

        closeAccount.addEventListener(
            "click",
            closeAccountOverlay
        );
    }
}


// =========================
// SHOP
// =========================

function openShop() {

    const shop =
        $("shopOverlay");

    if (shop) {
        shop.style.display = "block";
    }
}


function closeShopOverlay() {

    const shop =
        $("shopOverlay");

    if (shop) {
        shop.style.display = "none";
    }
}


// =========================
// ACCOUNT
// =========================

function openAccount() {

    const account =
        $("accountOverlay");

    if (account) {
        account.style.display = "block";
    }
}


function closeAccountOverlay() {

    const account =
        $("accountOverlay");

    if (account) {
        account.style.display = "none";
    }
}


// =========================
// DOM READY
// =========================

document.addEventListener(
    "DOMContentLoaded",
    initializeGame
);
