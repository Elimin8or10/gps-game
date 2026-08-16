import { GAME_CONFIG } from "./config.js";

export function distanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(p1) *
        Math.cos(p2) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function normalizeHeading(v) {
    if (typeof v !== "number" || Number.isNaN(v)) return null;
    return ((v % 360) + 360) % 360;
}

export function updatePlayerHeading(playerMarker, deviceHeading, gpsHeading) {
    if (!playerMarker) return;

    const p = document.querySelector(".playerPointer");
    if (!p) return;

    const h = deviceHeading !== null ? deviceHeading : gpsHeading;
    if (h === null) {
        p.style.opacity = ".45";
        return;
    }

    p.style.opacity = "1";
    p.style.transform = `translateX(-50%) rotate(${h}deg)`;
}

export function updateMovementSpeed(lat, lon, gpsSpeed, state) {
    if (typeof gpsSpeed === "number" && Number.isFinite(gpsSpeed) && gpsSpeed >= 0) {
        state.currentMovementSpeedMPS = gpsSpeed;
    } else {
        const now = Date.now();
        if (state.lastSpeedSampleLat !== null && state.lastSpeedSampleLon !== null && state.lastSpeedSampleTime !== null) {
            const elapsed = (now - state.lastSpeedSampleTime) / 1000;
            if (elapsed > 0.2 && elapsed < 30) {
                const distance = distanceMeters(state.lastSpeedSampleLat, state.lastSpeedSampleLon, lat, lon);
                const calculated = distance / elapsed;
                if (calculated < 70) {
                    state.currentMovementSpeedMPS = state.currentMovementSpeedMPS * 0.35 + calculated * 0.65;
                }
            }
        }
        state.lastSpeedSampleLat = lat;
        state.lastSpeedSampleLon = lon;
        state.lastSpeedSampleTime = now;
    }

    if (typeof gpsSpeed === "number" && Number.isFinite(gpsSpeed)) {
        state.lastSpeedSampleLat = lat;
        state.lastSpeedSampleLon = lon;
        state.lastSpeedSampleTime = Date.now();
    }

    if (state.currentMovementSpeedMPS >= GAME_CONFIG.MAX_COLLECTION_SPEED_MPS) {
        state.highSpeedReadings = Math.min(GAME_CONFIG.HIGH_SPEED_CONFIRMATIONS, state.highSpeedReadings + 1);
    } else {
        if (state.currentMovementSpeedMPS < GAME_CONFIG.MAX_COLLECTION_SPEED_MPS * 0.75) {
            state.highSpeedReadings = 0;
        }
    }
}

export function isMovingTooFastToCollect(highSpeedReadings) {
    return highSpeedReadings >= GAME_CONFIG.HIGH_SPEED_CONFIRMATIONS;
}

export function showCollectedCoinLocations(collectedCoinMarkers, map) {
    for (const marker of collectedCoinMarkers) {
        if (map && map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    }
    return [];
}
