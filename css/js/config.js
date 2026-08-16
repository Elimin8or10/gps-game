export const GAME_CONFIG = {
    OVERPASS_SERVERS: [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.private.coffee/api/interpreter"
    ],
    SEARCH_RADIUS: 1200,
    ROAD_REFRESH_DISTANCE: 40,
    MAX_COINS: 20,
    TARGET_MIN_COINS: 8,
    COLLECTION_DISTANCE: 25,
    MIN_NEW_LOCATION_DISTANCE: 40,
    COLLECTED_LOCATION_COOLDOWN: 12 * 60 * 1000,
    VISITED_AREA_TTL: 15 * 60 * 1000,
    VISIT_GRID_SIZE: 100,
    COIN_GENERATION_RADIUS: 350,
    EXPLORATION_MOVE_DISTANCE: 35,
    RESPAWN_CHECK_MS: 3000,
    ROAD_CONNECTION_TOLERANCE: 8,
    NETWORK_COIN_DISTANCE: 600,
    MAX_COLLECTION_SPEED_MPS: 13.4,
    HIGH_SPEED_CONFIRMATIONS: 2
};

export const SKINS = {
    blue: {
        name: "Blue",
        price: 0,
        type: "solid",
        color: "#00aaff"
    },
    red: {
        name: "Red",
        price: 50,
        type: "solid",
        color: "#ff3030"
    },
    green: {
        name: "Green",
        price: 100,
        type: "solid",
        color: "#22dd55"
    },
    purple: {
        name: "Purple",
        price: 150,
        type: "solid",
        color: "#aa55ff"
    },
    gold: {
        name: "Gold",
        price: 250,
        type: "gradient",
        background: "linear-gradient(135deg,#fff36b,#ff9d00 55%,#fff36b)",
        color: "#ffd000",
        effect: "gold"
    },
    pink: {
        name: "Pink",
        price: 350,
        type: "gradient",
        background: "linear-gradient(135deg,#ff4fa3,#ff8bd1,#a84dff)",
        color: "#ff4fa3",
        effect: "pink"
    },
    lava: {
        name: "Lava",
        price: 500,
        type: "gradient",
        background: "linear-gradient(135deg,#ff2400,#ff7a00 45%,#ffd000)",
        color: "#ff5a00",
        effect: "lava"
    },
    ice: {
        name: "Ice",
        price: 650,
        type: "gradient",
        background: "linear-gradient(135deg,#dfffff,#55ddff 45%,#147dff)",
        color: "#55ddff",
        effect: "ice"
    },
    toxic: {
        name: "Toxic",
        price: 800,
        type: "gradient",
        background: "linear-gradient(135deg,#d7ff00,#39ff14 45%,#00a83b)",
        color: "#39ff14",
        effect: "toxic"
    },
    galaxy: {
        name: "Galaxy",
        price: 1000,
        type: "image",
        image: "skins/galaxy.png",
        background: "radial-gradient(circle at 30% 30%,#ff4fd8,#5525c9 45%,#09001d)",
        color: "#b46cff",
        effect: "galaxy"
    },
    crystal: {
        name: "Crystal",
        price: 1250,
        type: "gradient",
        background: "linear-gradient(135deg,#ffffff,#9ffcff 35%,#7b6cff 70%,#ffffff)",
        color: "#9ffcff",
        effect: "crystal"
    }
};
