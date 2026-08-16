import {
    state
} from "./state.js";

import {
    showToast
} from "./utils.js";


export function initializeMap(
    latitude = 0,
    longitude = 0
) {

    state.map = L.map("map");

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(state.map);

    state.map.setView(
        [latitude, longitude],
        17
    );
}


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
