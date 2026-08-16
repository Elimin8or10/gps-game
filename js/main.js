import { supabase } from "./supabase.js";
import { GAME_CONFIG, SKINS } from "./config.js";
import {
    distanceMeters,
    normalizeHeading,
    updatePlayerHeading,
    updateMovementSpeed,
    isMovingTooFastToCollect,
    showCollectedCoinLocations
} from "./map.js";

/* =========================
   STATE VARIABLES
========================= */

let currentUser = null;
let playerData = null;
let gameMode = null;

let map = null;
let playerMarker = null;
let accuracyCircle = null;

let coins = [];
let roadNetwork = [];
let collectedCoinMarkers = [];

let lastRoadLat = null;
let lastRoadLon = null;

let loadingRoads = false;
let watchId = null;

let toastTimer = null;

let deviceHeading = null;
let gpsHeading = null;

let lastGPSLat = null;
let lastGPSLon = null;

let currentGPSLat = null;
let currentGPSLon = null;

let lastMovementLat = null;
let lastMovementLon = null;

let visitedAreas = new Map();
let recentCollectedLocations = new Map();
let compassListening = false;

/* Speed tracking state */
const speedState = {
    lastSpeedSampleLat: null,
    lastSpeedSampleLon: null,
    lastSpeedSampleTime: null,
    currentMovementSpeedMPS: 0,
    highSpeedReadings: 0,
    lastSpeedStatusTime: 0
};

/* =========================
   UI HELPERS
========================= */

const $ = id => document.getElementById(id);

function setStatus(text) {
    const el = $("status");
    if (el) el.textContent = text;
}

function setLoading(text, percent) {
    const textEl = $("loadingText");
    const barEl = $("loadingBar");
    if (textEl) textEl.textContent = text;
    if (barEl) barEl.style.width = percent + "%";
}

function showToast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        el.classList.remove("show");
    }, 2200);
}

function getSpeedMPH() {
    return speedState.currentMovementSpeedMPS * 2.236936;
}

function updateSpeedStatus() {
    if (!isMovingTooFastToCollect(speedState.highSpeedReadings)) return;
    const now = Date.now();
    if (now - speedState.lastSpeedStatusTime < 3000) return;
    speedState.lastSpeedStatusTime = now;
    setStatus(`🚗 Moving too fast to collect coins • ${Math.round(getSpeedMPH())} mph`);
}

function centerOnPlayer() {
    if (currentGPSLat !== null && currentGPSLon !== null && map) {
        map.setView([currentGPSLat, currentGPSLon], 17, { animate: true });
        showToast("Centered on player 🎯");
    } else {
        showToast("Location not acquired yet!");
    }
}

/* =========================
   GAME FLOW & SCREEN SWITCHING
========================= */

function handleSignIn() {
    const emailInput = $("emailInput");
    const statusEl = $("authStatus");
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email || !email.includes("@")) {
        if (statusEl) statusEl.textContent = "Please enter a valid email address.";
        return;
    }

    if (statusEl) statusEl.textContent = "Logging in...";

    currentUser = { email };

    $("authScreen").style.display = "none";
    $("modeScreen").style.display = "flex";
}

function selectMode(mode) {
    gameMode = mode;
    $("modeScreen").style.display = "none";
    $("loadingScreen").style.display = "flex";

    setLoading("Initializing map...", 40);

    setTimeout(() => {
        initGameMap();
    }, 500);
}

function initGameMap() {
    setLoading("Locating player...", 70);

    if (!map) {
        map = L.map("map", { zoomControl: false }).setView([0, 0], 2);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap"
        }).addTo(map);
    }

    if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
            onLocationSuccess,
            onLocationError,
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
    } else {
        setStatus("Geolocation is not supported by your browser.");
        $("loadingScreen").style.display = "none";
    }
}

function onLocationSuccess(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    const speed = position.coords.speed;
    const heading = position.coords.heading;

    currentGPSLat = lat;
    currentGPSLon = lon;
    if (heading !== null && !isNaN(heading)) {
        gpsHeading = normalizeHeading(heading);
    }

    updateMovementSpeed(lat, lon, speed, speedState);
    updateSpeedStatus();

    if ($("loadingScreen").style.display !== "none") {
        setLoading("Ready!", 100);
        setTimeout(() => {
            $("loadingScreen").style.display = "none";
        }, 300);
        map.setView([lat, lon], 17);
    }

    const playerIcon = L.divIcon({
        className: "player-wrapper",
        html: `
            <div class="player skin-blue" style="--player-color: #00aaff;">
                <div class="playerPointer"><div class="playerPointerInner"></div></div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    if (!playerMarker) {
        playerMarker = L.marker([lat, lon], { icon: playerIcon }).addTo(map);
    } else {
        playerMarker.setLatLng([lat, lon]);
    }

    if (!accuracyCircle) {
        accuracyCircle = L.circle([lat, lon], { radius: accuracy, color: "#00aaff", opacity: 0.2, fillOpacity: 0.05 }).addTo(map);
    } else {
        accuracyCircle.setLatLng([lat, lon]);
        accuracyCircle.setRadius(accuracy);
    }

    updatePlayerHeading(playerMarker, deviceHeading, gpsHeading);
    setStatus(`GPS Active • ${Math.round(accuracy)}m accuracy`);
}

function onLocationError(err) {
    setStatus(`GPS Error: ${err.message}`);
}

/* =========================
   EVENT BINDINGS
========================= */

document.addEventListener("DOMContentLoaded", () => {
    const signInBtn = $("signInButton");
    if (signInBtn) {
        signInBtn.addEventListener("click", handleSignIn);
    }

    const publicBtn = $("publicMode");
    if (publicBtn) {
        publicBtn.addEventListener("click", () => selectMode("public"));
    }

    const unlimitedBtn = $("unlimitedMode");
    if (unlimitedBtn) {
        unlimitedBtn.addEventListener("click", () => selectMode("unlimited"));
    }

    const centerBtn = $("centerPlayerButton");
    if (centerBtn) {
        centerBtn.addEventListener("click", centerOnPlayer);
    }

    const shopBtn = $("shopButton");
    if (shopBtn) {
        shopBtn.addEventListener("click", () => {
            $("shopOverlay").style.display = "block";
        });
    }

    const closeShopBtn = $("closeShop");
    if (closeShopBtn) {
        closeShopBtn.addEventListener("click", () => {
            $("shopOverlay").style.display = "none";
        });
    }

    const accountBtn = $("accountButton");
    if (accountBtn) {
        accountBtn.addEventListener("click", () => {
            $("accountOverlay").style.display = "block";
        });
    }

    const closeAccountBtn = $("closeAccount");
    if (closeAccountBtn) {
        closeAccountBtn.addEventListener("click", () => {
            $("accountOverlay").style.display = "none";
        });
    }

    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", (e) => {
            if (e.webkitCompassHeading !== undefined) {
                deviceHeading = normalizeHeading(e.webkitCompassHeading);
            } else if (e.alpha !== null) {
                deviceHeading = normalizeHeading(360 - e.alpha);
            }
            updatePlayerHeading(playerMarker, deviceHeading, gpsHeading);
        }, true);
    }
});
