import {
    state
} from "./state.js";

import {
    MAX_COLLECTION_SPEED_MPS,
    HIGH_SPEED_CONFIRMATIONS
} from "./config.js";

import {
    distanceMeters,
    setStatus
} from "./utils.js";


export function updateMovementSpeed(
    lat,
    lon,
    gpsSpeed
) {

    if (
        typeof gpsSpeed === "number" &&
        Number.isFinite(gpsSpeed) &&
        gpsSpeed >= 0
    ) {

        state.currentMovementSpeedMPS =
            gpsSpeed;

    } else {

        const now = Date.now();

        if (
            state.lastSpeedSampleLat !== null &&
            state.lastSpeedSampleLon !== null &&
            state.lastSpeedSampleTime !== null
        ) {

            const elapsed =
                (now -
                    state.lastSpeedSampleTime) /
                1000;

            if (
                elapsed > .2 &&
                elapsed < 30
            ) {

                const distance =
                    distanceMeters(
                        state.lastSpeedSampleLat,
                        state.lastSpeedSampleLon,
                        lat,
                        lon
                    );

                const calculated =
                    distance / elapsed;

                if (calculated < 70) {

                    state.currentMovementSpeedMPS =
                        state.currentMovementSpeedMPS * .35 +
                        calculated * .65;
                }
            }
        }

        state.lastSpeedSampleLat = lat;
        state.lastSpeedSampleLon = lon;
        state.lastSpeedSampleTime = now;
    }


    if (
        typeof gpsSpeed === "number" &&
        Number.isFinite(gpsSpeed)
    ) {

        state.lastSpeedSampleLat = lat;
        state.lastSpeedSampleLon = lon;
        state.lastSpeedSampleTime = Date.now();
    }


    if (
        state.currentMovementSpeedMPS >=
        MAX_COLLECTION_SPEED_MPS
    ) {

        state.highSpeedReadings =
            Math.min(
                HIGH_SPEED_CONFIRMATIONS,
                state.highSpeedReadings + 1
            );

    } else {

        if (
            state.currentMovementSpeedMPS <
            MAX_COLLECTION_SPEED_MPS * .75
        ) {
            state.highSpeedReadings = 0;
        }
    }
}


export function isMovingTooFastToCollect() {

    return (
        state.highSpeedReadings >=
        HIGH_SPEED_CONFIRMATIONS
    );
}


export function getSpeedMPH() {

    return (
        state.currentMovementSpeedMPS *
        2.236936
    );
}


export function updateSpeedStatus() {

    if (!isMovingTooFastToCollect()) {
        return;
    }

    const now = Date.now();

    if (
        now - state.lastSpeedStatusTime <
        3000
    ) {
        return;
    }

    state.lastSpeedStatusTime = now;

    setStatus(
        `🚗 Moving too fast to collect coins • ${Math.round(
            getSpeedMPH()
        )} mph`
    );
}
