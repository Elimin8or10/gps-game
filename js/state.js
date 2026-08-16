export const state = {

    currentUser: null,

    playerData: null,

    gameMode: null,

    map: null,

    playerMarker: null,

    accuracyCircle: null,

    coins: [],

    roadNetwork: [],

    collectedCoinMarkers: [],

    lastRoadLat: null,

    lastRoadLon: null,

    loadingRoads: false,

    watchId: null,

    toastTimer: null,

    deviceHeading: null,

    gpsHeading: null,

    lastGPSLat: null,

    lastGPSLon: null,

    currentGPSLat: null,

    currentGPSLon: null,

    lastMovementLat: null,

    lastMovementLon: null,

    visitedAreas: new Map(),

    recentCollectedLocations: new Map(),

    compassListening: false,

    lastSpeedSampleLat: null,

    lastSpeedSampleLon: null,

    lastSpeedSampleTime: null,

    currentMovementSpeedMPS: 0,

    lastSpeedStatusTime: 0,

    highSpeedReadings: 0

};
