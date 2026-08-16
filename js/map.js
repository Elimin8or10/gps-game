import {
    state
} from "./state.js";

import {
    showToast
} from "./utils.js";


// =========================
// INITIALIZE MAP
// =========================

export function initializeMap(
    latitude = 0,
    longitude = 0
) {

    // Don't create the map twice.
    if (state.map) {
        return state.map;
    }

    state.map = L.map("map", {
        zoomControl: true
    });


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,

            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(state.map);


    state.map.setView(
        [
            latitude,
            longitude
        ],
        17
    );


    return state.map;
}


// =========================
// CENTER PLAYER
// =========================

export function centerOnPlayer() {

    if (
        state.currentGPSLat !== null &&
        state.currentGPSLon !== null &&
        state.map
    ) {

        state.map.setView(
            [
                state.currentGPSLat,
                state.currentGPSLon
            ],
            17,
            {
                animate: true
            }
        );

        showToast(
            "Centered on player 🎯"
        );

    } else {

        showToast(
            "Location not acquired yet!"
        );
    }
}


// =========================
// UPDATE MAP LOCATION
// =========================

export function updateMapLocation(
    latitude,
    longitude
) {

    state.currentGPSLat = latitude;

    state.currentGPSLon = longitude;


    if (!state.map) {

        initializeMap(
            latitude,
            longitude
        );

    } else {

        state.map.setView(
            [
                latitude,
                longitude
            ],
            state.map.getZoom()
        );
    }
}
