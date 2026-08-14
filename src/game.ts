import {
  createClient,
  SupabaseClient,
  User
} from "@supabase/supabase-js";


/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://yrcitnuuskcbiuryyytu.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_REmdL8nVsuxhOsRMTZlGFg_YILsQIVK";

const supabase: SupabaseClient =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   TYPES
   ========================================================= */

interface PlayerData {

  id: string;

  username: string | null;

  coins: number;

  xp: number;

  level: number;

  unlocked_skins: string[];

  equipped_skin: string;

  collected_coins: string[];

  created_at: string;

  updated_at: string;

}


interface Skin {

  name: string;

  color: string;

  price: number;

}


interface GameCoin {

  id: string;

  marker: L.Marker;

  latitude: number;

  longitude: number;

  collected: boolean;

}


interface Way {

  id: number;

  geometry: Array<{
    lat: number;
    lon: number;
  }>;

  tags: Record<string, string>;

}


interface NetworkPoint {

  way: Way;

  index: number;

  distance: number;

  point: {
    lat: number;
    lon: number;
  };

}


/* =========================================================
   SKINS
   ========================================================= */

const SKINS: Record<string, Skin> = {

  blue: {
    name: "Blue",
    color: "#00aaff",
    price: 0
  },

  red: {
    name: "Red",
    color: "#ff3030",
    price: 50
  },

  green: {
    name: "Green",
    color: "#22dd55",
    price: 100
  },

  purple: {
    name: "Purple",
    color: "#aa55ff",
    price: 150
  },

  gold: {
    name: "Gold",
    color: "#ffd000",
    price: 250
  },

  pink: {
    name: "Pink",
    color: "#ff4fa3",
    price: 350
  }

};


/* =========================================================
   GAME SETTINGS
   ========================================================= */

const SEARCH_RADIUS = 800;

const COIN_SPACING = 65;

const MAIN_COINS = 5;

const BRANCH_COINS = 3;

const COLLECTION_DISTANCE = 15;

const REFRESH_DISTANCE = 200;


/* =========================================================
   OVERPASS
   ========================================================= */

const OVERPASS_SERVERS = [

  "https://overpass-api.de/api/interpreter",

  "https://overpass.kumi.systems/api/interpreter"

];


/* =========================================================
   STATE
   ========================================================= */

let currentUser: User | null = null;

let playerData: PlayerData | null = null;

let map: L.Map | null = null;

let playerMarker: L.Marker | null = null;

let coins: GameCoin[] = [];

let gameMode:
  "PUBLIC" |
  "UNLIMITED" =
  "PUBLIC";

let currentLatitude: number | null = null;

let currentLongitude: number | null = null;

let loadingTrail = false;

let gpsStarted = false;


/* =========================================================
   DOM
   ========================================================= */

const loadingScreen =
  document.getElementById(
    "loadingScreen"
  ) as HTMLElement;

const loadingText =
  document.getElementById(
    "loadingText"
  ) as HTMLElement;

const loadingBar =
  document.getElementById(
    "loadingBarInner"
  ) as HTMLElement;

const modeSelect =
  document.getElementById(
    "modeSelect"
  ) as HTMLElement;

const statusElement =
  document.getElementById(
    "status"
  ) as HTMLElement;

const coinsDisplay =
  document.getElementById(
    "coinsDisplay"
  ) as HTMLElement;

const shopOverlay =
  document.getElementById(
    "shopOverlay"
  ) as HTMLElement;

const shopItems =
  document.getElementById(
    "shopItems"
  ) as HTMLElement;

const shopBalance =
  document.getElementById(
    "shopBalance"
  ) as HTMLElement;

const accountOverlay =
  document.getElementById(
    "accountOverlay"
  ) as HTMLElement;

const accountEmail =
  document.getElementById(
    "accountEmail"
  ) as HTMLElement;


/* =========================================================
   LOADING
   ========================================================= */

function loading(
  text: string,
  progress: number
): void {

  loadingText.innerText =
    text;

  loadingBar.style.width =
    `${progress}%`;

}


/* =========================================================
   START
   ========================================================= */

async function boot(): Promise<void> {

  try {

    loading(
      "Connecting to account...",
      20
    );

    const {
      data,
      error
    } =
      await supabase.auth.getUser();

    if (error) {

      console.log(
        "Auth check:",
        error
      );

    }

    currentUser =
      data.user;

    if (!currentUser) {

      loading(
        "No account session found.",
        100
      );

      setTimeout(() => {

        window.location.href =
          "/login.html";

      }, 800);

      return;

    }


    loading(
      "Loading player...",
      40
    );


    await loadPlayer();


    loading(
      "Getting GPS...",
      65
    );


    showModeSelection();

  } catch (error) {

    console.error(error);

    loading(
      "Something went wrong.",
      100
    );

    setStatus(
      "❌ Game failed to start."
    );

  }

}


/* =========================================================
   PLAYER
   ========================================================= */

async function loadPlayer(): Promise<void> {

  if (!currentUser) {
    return;
  }

  const {
    data,
    error
  } =
    await supabase

      .from("players")

      .select("*")

      .eq(
        "id",
        currentUser.id
      )

      .single();


  if (error) {

    console.error(
      "Player load error:",
      error
    );

    throw error;

  }


  playerData =
    data as PlayerData;


  updateCoinDisplay();

}


/* =========================================================
   MODE SELECTION
   ========================================================= */

function showModeSelection(): void {

  loading(
    "Choose how you want to play.",
    100
  );

  modeSelect.style.display =
    "block";

}


/* =========================================================
   MODE BUTTONS
   ========================================================= */

document
  .getElementById("publicMode")
  ?.addEventListener(
    "click",
    () => {

      chooseMode(
        "PUBLIC"
      );

    }
  );


document
  .getElementById("unlimitedMode")
  ?.addEventListener(
    "click",
    () => {

      chooseMode(
        "UNLIMITED"
      );

    }
  );


async function chooseMode(
  mode:
    "PUBLIC" |
    "UNLIMITED"
): Promise<void> {

  gameMode =
    mode;

  modeSelect.style.display =
    "none";

  loading(
    "Finding your location...",
    100
  );

  startGPS();

}


/* =========================================================
   GPS
   ========================================================= */

function startGPS(): void {

  if (gpsStarted) {
    return;
  }

  gpsStarted =
    true;


  if (
    !("geolocation" in navigator)
  ) {

    setStatus(
      "❌ GPS isn't available."
    );

    return;

  }


  navigator.geolocation.watchPosition(

    updateLocation,

    locationError,

    {

      enableHighAccuracy:
        true,

      maximumAge:
        2000,

      timeout:
        15000

    }

  );

}


/* =========================================================
   LOCATION UPDATE
   ========================================================= */

function updateLocation(
  position: GeolocationPosition
): void {

  const latitude =
    position.coords.latitude;

  const longitude =
    position.coords.longitude;


  if (!map) {

    startGame(
      latitude,
      longitude
    );

    return;

  }


  if (playerMarker) {

    playerMarker.setLatLng([
      latitude,
      longitude
    ]);

  }


  checkCoinCollection(
    latitude,
    longitude
  );


  if (
    currentLatitude !== null &&
    currentLongitude !== null
  ) {

    const distance =
      distanceMeters(
        currentLatitude,
        currentLongitude,
        latitude,
        longitude
      );


    if (
      distance >=
      REFRESH_DISTANCE
    ) {

      currentLatitude =
        latitude;

      currentLongitude =
        longitude;


      loadTrail(
        latitude,
        longitude
      );

    }

  }

}


/* =========================================================
   START GAME
   ========================================================= */

function startGame(
  latitude: number,
  longitude: number
): void {

  map =
    L.map("map", {

      zoomControl:
        true

    }).setView(
      [
        latitude,
        longitude
      ],
      17
    );


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {

      attribution:
        "© OpenStreetMap contributors"

    }
  ).addTo(map);


  currentLatitude =
    latitude;

  currentLongitude =
    longitude;


  createPlayer(
    latitude,
    longitude
  );


  loadingScreen.classList.add(
    "hidden"
  );


  setStatus(
    "🗺️ Finding the nearest path..."
  );


  loadTrail(
    latitude,
    longitude
  );

}


/* =========================================================
   PLAYER MARKER
   ========================================================= */

function createPlayer(
  latitude: number,
  longitude: number
): void {

  if (!map) {
    return;
  }


  const skin =
    getCurrentSkin();


  const icon =
    createPlayerIcon(
      skin.color
    );


  playerMarker =
    L.marker(
      [
        latitude,
        longitude
      ],
      {
        icon
      }
    ).addTo(map);

}


function createPlayerIcon(
  color: string
): L.DivIcon {

  return L.divIcon({

    className: "",

    html:
      `<div class="player"
       style="--player-color:${color}">
       </div>`,

    iconSize:
      [28, 28],

    iconAnchor:
      [14, 14]

  });

}


function updatePlayerSkin(): void {

  if (!playerMarker) {
    return;
  }


  const skin =
    getCurrentSkin();


  playerMarker.setIcon(
    createPlayerIcon(
      skin.color
    )
  );

}


function getCurrentSkin(): Skin {

  const id =
    playerData?.equipped_skin ||
    "blue";


  return (
    SKINS[id] ||
    SKINS.blue
  );

}


/* =========================================================
   LOAD TRAIL
   ========================================================= */

async function loadTrail(
  latitude: number,
  longitude: number
): Promise<void> {

  if (
    loadingTrail ||
    !map
  ) {

    return;

  }


  loadingTrail =
    true;


  setStatus(
    "🗺️ Finding the nearest path..."
  );


  removeUncollectedCoins();


  try {

    const ways =
      await getNearbyWays(
        latitude,
        longitude
      );


    if (
      ways.length === 0
    ) {

      setStatus(
        "🔎 No suitable paths nearby."
      );

      loadingTrail =
        false;

      return;

    }


    /*
     * IMPORTANT:
     *
     * Find the actual nearest point
     * on the mapped path network.
     *
     * This means the first coin route
     * begins from the road/path closest
     * to the player rather than from an
     * arbitrary location.
     */

    const start =
      findClosestNetworkPoint(
        ways,
        latitude,
        longitude
      );


    if (!start) {

      setStatus(
        "🔎 Couldn't find a nearby path."
      );

      loadingTrail =
        false;

      return;

    }


    const distanceToPath =
      start.distance;


    /*
     * Don't generate a path if the
     * closest mapped path is extremely
     * far away.
     */

    if (
      distanceToPath > 250
    ) {

      setStatus(
        `🚶 Nearest path is ${Math.round(
          distanceToPath
        )}m away.`
      );

      loadingTrail =
        false;

      return;

    }


    const mainRoute =
      buildNetworkRoute(
        ways,
        start,
        MAIN_COINS
      );


    const branchRoute =
      findNetworkBranch(
        ways,
        mainRoute,
        start
      );


    /*
     * FIRST POINT:
     *
     * Put a coin at the actual nearest
     * network point.
     *
     * This makes the path visibly start
     * at the player's nearest road/path.
     */

    createCoin(
      start.point.lat,
      start.point.lon
    );


    mainRoute.forEach(
      point => {

        createCoin(
          point.lat,
          point.lon
        );

      }
    );


    branchRoute.forEach(
      point => {

        createCoin(
          point.lat,
          point.lon
        );

      }
    );


    const total =
      mainRoute.length +
      branchRoute.length +
      1;


    setStatus(
      `🎮 ${total} coins generated along the nearest path`
    );


  } catch (error) {

    console.error(
      "Trail error:",
      error
    );

    setStatus(
      "⚠️ Couldn't load nearby paths."
    );

  }


  loadingTrail =
    false;

}


/* =========================================================
   OVERPASS
   ========================================================= */

async function getNearbyWays(
  latitude: number,
  longitude: number
): Promise<Way[]> {

  const latOffset =
    SEARCH_RADIUS /
    111320;


  const lonOffset =
    SEARCH_RADIUS /
    (
      111320 *
      Math.cos(
        latitude *
        Math.PI /
        180
      )
    );


  const south =
    latitude -
    latOffset;

  const north =
    latitude +
    latOffset;

  const west =
    longitude -
    lonOffset;

  const east =
    longitude +
    lonOffset;


  const query = `

    [out:json]
    [timeout:20];

    way["highway"]
      (${south},${west},${north},${east});

    out tags geom;

  `;


  for (
    const server of
    OVERPASS_SERVERS
  ) {

    try {

      const response =
        await fetch(
          server,
          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/x-www-form-urlencoded"

            },

            body:
              "data=" +
              encodeURIComponent(
                query
              )

          }
        );


      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }


      const data =
        await response.json();


      return filterWays(
        data.elements
      );

    } catch (error) {

      console.log(
        "Overpass server failed:",
        error
      );

    }

  }


  return [];

}


/* =========================================================
   FILTER WAYS
   ========================================================= */

function filterWays(
  elements: any[]
): Way[] {

  const result: Way[] =
    [];


  for (
    const element of
    elements
  ) {

    if (
      element.type !==
      "way"
    ) {

      continue;

    }


    if (
      !element.geometry ||
      element.geometry.length < 2
    ) {

      continue;

    }


    const tags =
      element.tags || {};


    const highway =
      tags.highway;


    if (!highway) {
      continue;
    }


    const access =
      String(
        tags.access || ""
      ).toLowerCase();


    if (
      gameMode ===
      "PUBLIC"
    ) {

      if (

        access === "private" ||
        access === "no" ||
        access === "permit" ||
        access === "customers"

      ) {

        continue;

      }


      const allowed = [

        "footway",
        "path",
        "pedestrian",
        "steps",
        "cycleway",
        "bridleway",
        "living_street",
        "residential"

      ];


      if (
        !allowed.includes(
          highway
        )
      ) {

        continue;

      }

    }


    if (
      gameMode ===
      "UNLIMITED"
    ) {

      const forbidden = [

        "motorway",
        "motorway_link",
        "trunk",
        "trunk_link",
        "primary",
        "primary_link"

      ];


      if (
        forbidden.includes(
          highway
        )
      ) {

        continue;

      }

    }


    result.push({

      id:
        element.id,

      geometry:
        element.geometry,

      tags

    });

  }


  return result;

}


/* =========================================================
   CLOSEST NETWORK POINT
   ========================================================= */

function findClosestNetworkPoint(
  ways: Way[],
  latitude: number,
  longitude: number
): NetworkPoint | null {

  let best:
    NetworkPoint | null =
    null;


  for (
    const way of
    ways
  ) {

    for (
      let index = 0;
      index < way.geometry.length;
      index++
    ) {

      const point =
        way.geometry[index];


      const distance =
        distanceMeters(
          latitude,
          longitude,
          point.lat,
          point.lon
        );


      if (
        best === null ||
        distance <
        best.distance
      ) {

        best = {

          way,

          index,

          distance,

          point

        };

      }

    }

  }


  return best;

}


/* =========================================================
   BUILD ROUTE
   ========================================================= */

function buildNetworkRoute(
  ways: Way[],
  start: NetworkPoint,
  numberOfCoins: number
): Array<{
  lat: number;
  lon: number;
}> {

  const route: Array<{
    lat: number;
    lon: number;
  }> = [];


  let currentWay =
    start.way;

  let currentIndex =
    start.index;


  let direction =
    currentIndex <
    currentWay.geometry.length - 1
      ? 1
      : -1;


  let accumulated =
    0;


  let lastPoint =
    currentWay.geometry[
      currentIndex
    ];


  const visited =
    new Set<string>();


  while (
    route.length <
    numberOfCoins
  ) {

    const key =
      `${currentWay.id}:${currentIndex}:${direction}`;


    if (
      visited.has(key)
    ) {

      break;

    }


    visited.add(key);


    const nextIndex =
      currentIndex +
      direction;


    if (
      nextIndex < 0 ||
      nextIndex >=
      currentWay.geometry.length
    ) {

      const endpoint =
        currentWay.geometry[
          direction === 1
            ? currentWay.geometry.length - 1
            : 0
        ];


      const next =
        findConnectedWay(
          ways,
          endpoint,
          currentWay.id
        );


      if (!next) {

        break;

      }


      currentWay =
        next.way;

      currentIndex =
        next.index;

      direction =
        next.direction;

      lastPoint =
        currentWay.geometry[
          currentIndex
        ];

      continue;

    }


    const point =
      currentWay.geometry[
        nextIndex
      ];


    accumulated +=
      distanceMeters(
        lastPoint.lat,
        lastPoint.lon,
        point.lat,
        point.lon
      );


    if (
      accumulated >=
      COIN_SPACING
    ) {

      route.push({

        lat:
          point.lat,

        lon:
          point.lon

      });


      accumulated =
        0;

    }


    lastPoint =
      point;

    currentIndex =
      nextIndex;

  }


  return route;

}


/* =========================================================
   CONNECTED WAY
   ========================================================= */

function findConnectedWay(
  ways: Way[],
  endpoint: {
    lat: number;
    lon: number;
  },
  currentWayId: number
): {
  way: Way;
  index: number;
  direction: number;
} | null {

  let best:
    {
      way: Way;
      index: number;
      direction: number;
    } | null =
    null;


  let bestDistance =
    35;


  for (
    const way of
    ways
  ) {

    if (
      way.id ===
      currentWayId
    ) {

      continue;

    }


    const first =
      way.geometry[0];

    const last =
      way.geometry[
        way.geometry.length - 1
      ];


    const d1 =
      distanceMeters(
        endpoint.lat,
        endpoint.lon,
        first.lat,
        first.lon
      );


    const d2 =
      distanceMeters(
        endpoint.lat,
        endpoint.lon,
        last.lat,
        last.lon
      );


    if (
      d1 <
      bestDistance
    ) {

      best = {

        way,

        index: 0,

        direction: 1

      };

      bestDistance =
        d1;

    }


    if (
      d2 <
      bestDistance
    ) {

      best = {

        way,

        index:
          way.geometry.length - 1,

        direction: -1

      };

      bestDistance =
        d2;

    }

  }


  return best;

}


/* =========================================================
   BRANCH
   ========================================================= */

function findNetworkBranch(
  ways: Way[],
  mainRoute: Array<{
    lat: number;
    lon: number;
  }>,
  start: NetworkPoint
): Array<{
  lat: number;
  lon: number;
}> {

  if (
    mainRoute.length <
    2
  ) {

    return [];

  }


  for (
    const routePoint of
    mainRoute
  ) {

    for (
      const way of
      ways
    ) {

      if (
        way.id ===
        start.way.id
      ) {

        continue;

      }


      const first =
        way.geometry[0];

      const last =
        way.geometry[
          way.geometry.length - 1
        ];


      const firstDistance =
        distanceMeters(
          routePoint.lat,
          routePoint.lon,
          first.lat,
          first.lon
        );


      const lastDistance =
        distanceMeters(
          routePoint.lat,
          routePoint.lon,
          last.lat,
          last.lon
        );


      if (
        firstDistance <= 30
      ) {

        return buildBranch(
          way,
          0,
          1
        );

      }


      if (
        lastDistance <= 30
      ) {

        return buildBranch(
          way,
          way.geometry.length - 1,
          -1
        );

      }

    }

  }


  return [];

}


/* =========================================================
   BUILD BRANCH
   ========================================================= */

function buildBranch(
  way: Way,
  startIndex: number,
  direction: number
): Array<{
  lat: number;
  lon: number;
}> {

  const result: Array<{
    lat: number;
    lon: number;
  }> = [];


  let accumulated =
    0;


  let lastPoint =
    way.geometry[
      startIndex
    ];


  for (
    let step = 1;
    step < way.geometry.length;
    step++
  ) {

    const index =
      startIndex +
      step *
      direction;


    if (
      index < 0 ||
      index >=
      way.geometry.length
    ) {

      break;

    }


    const point =
      way.geometry[index];


    accumulated +=
      distanceMeters(
        lastPoint.lat,
        lastPoint.lon,
        point.lat,
        point.lon
      );


    if (
      accumulated >=
      COIN_SPACING
    ) {

      result.push({

        lat:
          point.lat,

        lon:
          point.lon

      });


      accumulated =
        0;


      if (
        result.length >=
        BRANCH_COINS
      ) {

        break;

      }

    }


    lastPoint =
      point;

  }


  return result;

}


/* =========================================================
   CREATE COIN
   ========================================================= */

function createCoin(
  latitude: number,
  longitude: number
): void {

  if (!map) {
    return;
  }


  if (!playerData) {
    return;
  }


  const id =
    makeCoinId(
      latitude,
      longitude
    );


  if (
    playerData.collected_coins.includes(
      id
    )
  ) {

    return;

  }


  for (
    const existing of
    coins
  ) {

    if (
      distanceMeters(
        latitude,
        longitude,
        existing.latitude,
        existing.longitude
      ) < 20
    ) {

      return;

    }

  }


  const icon =
    L.divIcon({

      className: "",

      html:
        `<div class="coin">🪙</div>`,

      iconSize:
        [34, 34],

      iconAnchor:
        [17, 17]

    });


  const marker =
    L.marker(
      [
        latitude,
        longitude
      ],
      {
        icon
      }
    ).addTo(map);


  coins.push({

    id,

    marker,

    latitude,

    longitude,

    collected:
      false

  });

}


/* =========================================================
   COIN ID
   ========================================================= */

function makeCoinId(
  latitude: number,
  longitude: number
): string {

  return (

    Math.round(
      latitude * 100000
    ) +

    "_" +

    Math.round(
      longitude * 100000
    )

  );

}


/* =========================================================
   REMOVE COINS
   ========================================================= */

function removeUncollectedCoins(): void {

  if (!map) {
    return;
  }


  const remaining:
    GameCoin[] =
    [];


  for (
    const coin of
    coins
  ) {

    if (
      coin.collected
    ) {

      remaining.push(
        coin
      );

    } else {

      if (
        map.hasLayer(
          coin.marker
        )
      ) {

        map.removeLayer(
          coin.marker
        );

      }

    }

  }


  coins =
    remaining;

}


/* =========================================================
   COLLECTION
   ========================================================= */

function checkCoinCollection(
  latitude: number,
  longitude: number
): void {

  for (
    const coin of
    coins
  ) {

    if (
      coin.collected
    ) {

      continue;

    }


    const distance =
      distanceMeters(
        latitude,
        longitude,
        coin.latitude,
        coin.longitude
      );


    if (
      distance <=
      COLLECTION_DISTANCE
    ) {

      collectCoin(
        coin
      );

    }

  }

}


/* =========================================================
   COLLECT
   ========================================================= */

async function collectCoin(
  coin: GameCoin
): Promise<void> {

  if (
    !playerData
  ) {

    return;

  }


  if (
    coin.collected
  ) {

    return;

  }


  coin.collected =
    true;


  if (
    map &&
    map.hasLayer(
      coin.marker
    )
  ) {

    map.removeLayer(
      coin.marker
    );

  }


  if (
    !playerData.collected_coins.includes(
      coin.id
    )
  ) {

    playerData.collected_coins.push(
      coin.id
    );

  }


  playerData.coins +=
    10;


  playerData.xp +=
    10;


  checkLevel();


  updateCoinDisplay();


  showToast(
    "🪙 COIN COLLECTED! +10"
  );


  setStatus(
    "🎮 Keep exploring!"
  );


  await savePlayer();

}


/* =========================================================
   LEVEL
   ========================================================= */

function checkLevel(): void {

  if (!playerData) {
    return;
  }


  const requiredXP =
    playerData.level *
    100;


  if (
    playerData.xp >=
    requiredXP
  ) {

    playerData.xp -=
      requiredXP;

    playerData.level++;


    showToast(
      `🎉 LEVEL ${playerData.level}!`
    );

  }

}


/* =========================================================
   SAVE PLAYER
   ========================================================= */

async function savePlayer(): Promise<void> {

  if (!playerData) {
    return;
  }


  playerData.updated_at =
    new Date().toISOString();


  const {
    error
  } =
    await supabase

      .from("players")

      .update({

        coins:
          playerData.coins,

        xp:
          playerData.xp,

        level:
          playerData.level,

        unlocked_skins:
          playerData.unlocked_skins,

        equipped_skin:
          playerData.equipped_skin,

        collected_coins:
          playerData.collected_coins,

        updated_at:
          playerData.updated_at

      })

      .eq(
        "id",
        playerData.id
      );


  if (error) {

    console.error(
      "Save error:",
      error
    );

    showToast(
      "⚠️ Couldn't save"
    );

  }

}


/* =========================================================
   COIN DISPLAY
   ========================================================= */

function updateCoinDisplay(): void {

  const amount =
    playerData?.coins ??
    0;


  coinsDisplay.innerText =
    `🪙 Coins: ${amount}`;

}


/* =========================================================
   SHOP
   ========================================================= */

function openShop(): void {

  shopOverlay.style.display =
    "block";


  renderShop();

}


function closeShop(): void {

  shopOverlay.style.display =
    "none";

}


function renderShop(): void {

  if (!playerData) {
    return;
  }


  shopBalance.innerText =
    `🪙 Coins: ${playerData.coins}`;


  shopItems.innerHTML =
    "";


  Object.entries(
    SKINS
  ).forEach(
    ([id, skin]) => {

      const unlocked =
        playerData!
          .unlocked_skins
          .includes(id);


      const equipped =
        playerData!
          .equipped_skin ===
        id;


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "shopItem";


      const preview =
        document.createElement(
          "div"
        );


      preview.className =
        "skinPreview";


      preview.style.background =
        skin.color;


      preview.style.color =
        skin.color;


      const info =
        document.createElement(
          "div"
        );


      info.className =
        "skinInfo";


      info.innerHTML = `

        <div class="skinName">
          ${skin.name}
        </div>

        <div class="skinPrice">
          ${
            skin.price === 0
              ? "FREE"
              : "🪙 " +
                skin.price
          }
        </div>

      `;


      const button =
        document.createElement(
          "button"
        );


      button.className =
        "shopAction";


      if (equipped) {

        button.innerText =
          "EQUIPPED";

        button.disabled =
          true;

      } else if (unlocked) {

        button.innerText =
          "EQUIP";

        button.onclick =
          () => {

            equipSkin(
              id
            );

          };

      } else if (
        playerData!.coins >=
        skin.price
      ) {

        button.innerText =
          "BUY";

        button.onclick =
          () => {

            buySkin(
              id
            );

          };

      } else {

        button.innerText =
          "NEED COINS";

        button.disabled =
          true;

      }


      item.appendChild(
        preview
      );

      item.appendChild(
        info
      );

      item.appendChild(
        button
      );


      shopItems.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   BUY SKIN
   ========================================================= */

async function buySkin(
  id: string
): Promise<void> {

  if (!playerData) {
    return;
  }


  const skin =
    SKINS[id];


  if (!skin) {
    return;
  }


  if (
    playerData.unlocked_skins.includes(
      id
    )
  ) {

    return;

  }


  if (
    playerData.coins <
    skin.price
  ) {

    return;

  }


  playerData.coins -=
    skin.price;


  playerData.unlocked_skins.push(
    id
  );


  playerData.equipped_skin =
    id;


  await savePlayer();


  updateCoinDisplay();

  updatePlayerSkin();

  renderShop();


  showToast(
    `🎨 ${skin.name} unlocked!`
  );

}


/* =========================================================
   EQUIP
   ========================================================= */

async function equipSkin(
  id: string
): Promise<void> {

  if (!playerData) {
    return;
  }


  if (
    !playerData.unlocked_skins.includes(
      id
    )
  ) {

    return;

  }


  playerData.equipped_skin =
    id;


  await savePlayer();


  updatePlayerSkin();

  renderShop();


  showToast(
    `🎨 ${SKINS[id].name} equipped!`
  );

}


/* =========================================================
   SHOP EVENTS
   ========================================================= */

document
  .getElementById(
    "shopButton"
  )
  ?.addEventListener(
    "click",
    openShop
  );


document
  .getElementById(
    "closeShop"
  )
  ?.addEventListener(
    "click",
    closeShop
  );


/* =========================================================
   ACCOUNT
   ========================================================= */

document
  .getElementById(
    "accountButton"
  )
  ?.addEventListener(
    "click",
    () => {

      if (
        currentUser
      ) {

        accountEmail.innerText =
          currentUser.email ||
          "No email";

      }


      accountOverlay.style.display =
        "block";

    }
  );


document
  .getElementById(
    "closeAccount"
  )
  ?.addEventListener(
    "click",
    () => {

      accountOverlay.style.display =
        "none";

    }
  );


document
  .getElementById(
    "signOutButton"
  )
  ?.addEventListener(
    "click",
    async () => {

      await supabase.auth.signOut();

      window.location.href =
        "/login.html";

    }
  );


/* =========================================================
   GPS ERROR
   ========================================================= */

function locationError(
  error: GeolocationPositionError
): void {

  console.error(
    "GPS error:",
    error
  );


  switch (
    error.code
  ) {

    case error.PERMISSION_DENIED:

      setStatus(
        "📍 Location permission denied."
      );

      break;


    case error.POSITION_UNAVAILABLE:

      setStatus(
        "📍 Location unavailable."
      );

      break;


    case error.TIMEOUT:

      setStatus(
        "📍 GPS timed out. Trying again..."
      );

      break;


    default:

      setStatus(
        "📍 Couldn't get your location."
      );

  }

}


/* =========================================================
   STATUS
   ========================================================= */

function setStatus(
  text: string
): void {

  statusElement.innerText =
    text;

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer:
  number | null =
  null;


function showToast(
  text: string
): void {

  const toast =
    document.getElementById(
      "toast"
    ) as HTMLElement;


  toast.innerText =
    text;


  toast.classList.add(
    "show"
  );


  if (
    toastTimer !== null
  ) {

    window.clearTimeout(
      toastTimer
    );

  }


  toastTimer =
    window.setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2200
    );

}


/* =========================================================
   DISTANCE
   ========================================================= */

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {

  const R =
    6371000;


  const p1 =
    lat1 *
    Math.PI /
    180;


  const p2 =
    lat2 *
    Math.PI /
    180;


  const dLat =
    (
      lat2 -
      lat1
    ) *
    Math.PI /
    180;


  const dLon =
    (
      lon2 -
      lon1
    ) *
    Math.PI /
    180;


  const a =
    Math.sin(
      dLat / 2
    ) ** 2

    +

    Math.cos(p1) *
    Math.cos(p2) *

    Math.sin(
      dLon / 2
    ) ** 2;


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );


  return R * c;

}


/* =========================================================
   SUPABASE AUTH LISTENER
   ========================================================= */

supabase.auth.onAuthStateChange(
  (
    event,
    session
  ) => {

    console.log(
      "Auth event:",
      event
    );


    if (
      event ===
      "SIGNED_OUT"
    ) {

      window.location.href =
        "/login.html";

    }

  }
);


/* =========================================================
   START
   ========================================================= */

boot();