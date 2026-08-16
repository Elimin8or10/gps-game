// =========================
// GLOBAL GAME STATE
// =========================

export const state = {

    // -------------------------
    // ACCOUNT
    // -------------------------

    currentUser: null,

    playerData: null,

    gameMode: null,


    // -------------------------
    // MAP
    // -------------------------

    map: null,

    playerMarker: null,

    accuracyCircle: null,


    // -------------------------
    // COINS
    // -------------------------

    coins: [],

    roadNetwork: [],

    collectedCoinMarkers: [],


    // -------------------------
    // ROADS
    // -------------------------

    lastRoadLat: null,

    lastRoadLon: null,

    loadingRoads: false,


    // -------------------------
    // GPS
    // -------------------------

    watchId: null,

    currentGPSLat: null,

    currentGPSLon: null,

    lastGPSLat: null,

    lastGPSLon: null,

    lastMovementLat: null,

    lastMovementLon: null,


    // -------------------------
    // HEADING
    // -------------------------

    deviceHeading: null,

    gpsHeading: null,

    compassListening: false,


    // -------------------------
    // VISITED AREAS
    // -------------------------

    visitedAreas: new Map(),

    recentCollectedLocations: new Map(),


    // -------------------------
    // SPEED
    // -------------------------

    lastSpeedSampleLat: null,

    lastSpeedSampleLon: null,

    lastSpeedSampleTime: null,

    currentMovementSpeedMPS: 0,

    lastSpeedStatusTime: 0,

    highSpeedReadings: 0,


    // -------------------------
    // UI
    // -------------------------

    toastTimer: null

};
