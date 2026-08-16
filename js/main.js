import { supabase } from "./supabase.js";

// Game State
let currentUser = null;
let mapInstance = null;
let playerMarker = null;
let watchPositionId = null;

let userProfile = {
    coins: 0,
    level: 1,
    skins: ["default"],
    activeSkin: "default"
};

// Available Skins Catalog
const SHOP_ITEMS = [
    { id: "default", name: "Classic Gold", price: 0, icon: "🪙" },
    { id: "neon_blue", name: "Neon Blue", price: 250, icon: "💧" },
    { id: "ruby_red", name: "Ruby Red", price: 500, icon: "🔥" },
    { id: "galaxy", name: "Galaxy", price: 1000, icon: "✨" }
];

// DOM Elements
const authScreen = document.getElementById("authScreen");
const modeScreen = document.getElementById("modeScreen");
const loadingScreen = document.getElementById("loadingScreen");
const shopOverlay = document.getElementById("shopOverlay");
const accountOverlay = document.getElementById("accountOverlay");

const emailInput = document.getElementById("emailInput");
const signInButton = document.getElementById("signInButton");
const authStatus = document.getElementById("authStatus");

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    initMap();
    renderShopItems();
    await checkExistingSession();
}

// --------------------------------------------------
// 1. MAP & GEOLOCATION TRACKING
// --------------------------------------------------
function initMap() {
    if (document.getElementById("map")) {
        // Initialize map centered at default coordinates
        mapInstance = L.map("map").setView([0, 0], 2);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19
        }).addTo(mapInstance);
    }
}

function startLocationTracking() {
    if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser.");
        return;
    }

    // Clear previous tracker if active
    if (watchPositionId !== null) {
        navigator.geolocation.clearWatch(watchPositionId);
    }

    watchPositionId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            if (!playerMarker) {
                // Create player marker on first coordinate fix
                playerMarker = L.marker([latitude, longitude]).addTo(mapInstance);
                mapInstance.setView([latitude, longitude], 16);
            } else {
                // Move existing marker smoothly
                playerMarker.setLatLng([latitude, longitude]);
            }
        },
        (error) => {
            console.error("GPS Error:", error);
            showToast("GPS Error: Unable to fetch location.");
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        }
    );
}

function centerOnPlayer() {
    if (playerMarker && mapInstance) {
        mapInstance.setView(playerMarker.getLatLng(), 16);
    } else {
        showToast("Acquiring GPS location...");
    }
}

// --------------------------------------------------
// 2. AUTHENTICATION & SESSION MANAGEMENT
// --------------------------------------------------
async function checkExistingSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && session.user) {
            currentUser = session.user;
            await loadUserProfile();
            showScreen(modeScreen);
        } else {
            showScreen(authScreen);
        }
    } catch (err) {
        console.error("Session check error:", err);
        showScreen(authScreen);
    }
}

async function handleSignIn() {
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
        showStatus("Please enter a valid email.", true);
        return;
    }

    try {
        showStatus("Sending login email...");
        if (signInButton) signInButton.disabled = true;

        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: { emailRedirectTo: window.location.href }
        });

        if (error) throw error;
        showStatus("Check your email for the magic login link!");
    } catch (err) {
        console.error("Sign-in error:", err);
        showStatus(err.message || "Sign-in failed.", true);
    } finally {
        if (signInButton) signInButton.disabled = false;
    }
}

async function handleSignOut() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        if (watchPositionId !== null) navigator.geolocation.clearWatch(watchPositionId);
        accountOverlay.classList.remove("active");
        showScreen(authScreen);
    } catch (err) {
        console.error("Sign-out error:", err);
    }
}

// --------------------------------------------------
// 3. DATABASE PROFILE LOAD & SAVE
// --------------------------------------------------
async function loadUserProfile() {
    if (!currentUser) return;

    try {
        // Fetch existing profile from Supabase
        let { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching profile:", error);
            return;
        }

        // Create new record if profile doesn't exist yet
        if (!data) {
            const newProfile = {
                id: currentUser.id,
                coins: 100, // Give starting coins
                level: 1,
                skins: ["default"],
                active_skin: "default"
            };

            const { data: insertedData, error: insertError } = await supabase
                .from("profiles")
                .insert([newProfile])
                .select()
                .single();

            if (insertError) {
                console.error("Profile creation error:", insertError);
                return;
            }
            data = insertedData;
        }

        // Set user profile state
        userProfile = {
            coins: data.coins ?? 100,
            level: data.level ?? 1,
            skins: data.skins || ["default"],
            activeSkin: data.active_skin || "default"
        };

        updateHUD();
        updateAccountUI();
        renderShopItems();
    } catch (err) {
        console.error("Failed to load user profile:", err);
    }
}

async function saveUserProfile() {
    if (!currentUser) return;

    try {
        const { error } = await supabase
            .from("profiles")
            .update({
                coins: userProfile.coins,
                level: userProfile.level,
                skins: userProfile.skins,
                active_skin: userProfile.activeSkin
            })
            .eq("id", currentUser.id);

        if (error) throw error;
    } catch (err) {
        console.error("Failed to save profile update:", err);
    }
}

// --------------------------------------------------
// 4. SHOP & PURCHASING SYSTEM
// --------------------------------------------------
function renderShopItems() {
    const shopGrid = document.getElementById("shopItems");
    if (!shopGrid) return;

    shopGrid.innerHTML = "";

    SHOP_ITEMS.forEach((item) => {
        const isOwned = userProfile.skins.includes(item.id);
        const isActive = userProfile.activeSkin === item.id;

        const card = document.createElement("div");
        card.style.cssText = "background:#2a2a2a; padding:15px; border-radius:8px; text-align:center;";

        let buttonText = `🪙 ${item.price}`;
        let buttonDisabled = false;

        if (isActive) {
            buttonText = "EQUIPPED";
            buttonDisabled = true;
        } else if (isOwned) {
            buttonText = "EQUIP";
        }

        card.innerHTML = `
            <div style="font-size: 2.5rem;">${item.icon}</div>
            <div style="font-weight: bold; margin: 8px 0;">${item.name}</div>
            <button class="bigButton shopBuyBtn" style="font-size:0.85rem; padding:8px;" ${buttonDisabled ? "disabled" : ""}>
                ${buttonText}
            </button>
        `;

        const buyBtn = card.querySelector(".shopBuyBtn");
        buyBtn.addEventListener("click", () => handleShopAction(item));

        shopGrid.appendChild(card);
    });

    // Handle Featured item button separately
    const featuredBtn = document.getElementById("featuredButton");
    if (featuredBtn) {
        const galaxyOwned = userProfile.skins.includes("galaxy");
        const galaxyActive = userProfile.activeSkin === "galaxy";

        if (galaxyActive) {
            featuredBtn.textContent = "EQUIPPED";
            featuredBtn.disabled = true;
        } else if (galaxyOwned) {
            featuredBtn.textContent = "EQUIP";
            featuredBtn.disabled = false;
        } else {
            featuredBtn.textContent = "🪙 1,000";
            featuredBtn.disabled = false;
        }

        featuredBtn.onclick = () => {
            const galaxyItem = SHOP_ITEMS.find(i => i.id === "galaxy");
            if (galaxyItem) handleShopAction(galaxyItem);
        };
    }
}

async function handleShopAction(item) {
    const isOwned = userProfile.skins.includes(item.id);

    if (isOwned) {
        // Equip skin
        userProfile.activeSkin = item.id;
        showToast(`Equipped ${item.name}!`);
    } else {
        // Buy skin
        if (userProfile.coins < item.price) {
            showToast("Not enough coins!");
            return;
        }

        userProfile.coins -= item.price;
        userProfile.skins.push(item.id);
        userProfile.activeSkin = item.id;
        showToast(`Unlocked ${item.name}!`);
    }

    updateHUD();
    updateAccountUI();
    renderShopItems();
    await saveUserProfile();
}

// --------------------------------------------------
// 5. EVENT LISTENERS & UI UPDATES
// --------------------------------------------------
function setupEventListeners() {
    if (signInButton) signInButton.addEventListener("click", handleSignIn);

    // Mode Selection Buttons
    const publicModeBtn = document.getElementById("publicMode");
    const unlimitedModeBtn = document.getElementById("unlimitedMode");

    if (publicModeBtn) publicModeBtn.addEventListener("click", () => selectMode("public"));
    if (unlimitedModeBtn) unlimitedModeBtn.addEventListener("click", () => selectMode("unlimited"));

    // HUD Actions
    const centerBtn = document.getElementById("centerPlayerButton");
    const shopButton = document.getElementById("shopButton");
    const accountButton = document.getElementById("accountButton");
    const closeShop = document.getElementById("closeShop");
    const closeAccount = document.getElementById("closeAccount");
    const signOutButton = document.getElementById("signOutButton");

    if (centerBtn) centerBtn.addEventListener("click", centerOnPlayer);

    if (shopButton) shopButton.addEventListener("click", () => {
        renderShopItems();
        shopOverlay.classList.add("active");
    });
    if (closeShop) closeShop.addEventListener("click", () => shopOverlay.classList.remove("active"));
    
    if (accountButton) accountButton.addEventListener("click", () => {
        updateAccountUI();
        accountOverlay.classList.add("active");
    });
    if (closeAccount) closeAccount.addEventListener("click", () => accountOverlay.classList.remove("active"));

    if (signOutButton) signOutButton.addEventListener("click", handleSignOut);
}

function selectMode(mode) {
    showScreen(loadingScreen);
    const loadingText = document.getElementById("loadingText");
    if (loadingText) loadingText.textContent = `Loading ${mode.toUpperCase()} mode...`;

    setTimeout(() => {
        hideAllScreens();
        startLocationTracking(); // Trigger GPS request once mode is chosen
        if (mapInstance) {
            mapInstance.invalidateSize();
        }
        showToast(`Game started in ${mode.toUpperCase()} mode!`);
    }, 1200);
}

function hideAllScreens() {
    authScreen.classList.remove("active");
    modeScreen.classList.remove("active");
    loadingScreen.classList.remove("active");
    shopOverlay.classList.remove("active");
    accountOverlay.classList.remove("active");
}

function showScreen(targetScreen) {
    hideAllScreens();
    if (targetScreen) targetScreen.classList.add("active");
}

function updateHUD() {
    const coinsDisplay = document.getElementById("coinsDisplay");
    const shopBalance = document.getElementById("shopBalance");

    if (coinsDisplay) coinsDisplay.textContent = `🪙 Coins: ${userProfile.coins}`;
    if (shopBalance) shopBalance.textContent = `🪙 ${userProfile.coins}`;
}

function updateAccountUI() {
    const accountEmail = document.getElementById("accountEmail");
    const profileCoins = document.getElementById("profileCoins");
    const profileLevel = document.getElementById("profileLevel");
    const profileSkinCount = document.getElementById("profileSkinCount");

    if (accountEmail) accountEmail.textContent = currentUser ? currentUser.email : "Guest Account";
    if (profileCoins) profileCoins.textContent = userProfile.coins;
    if (profileLevel) profileLevel.textContent = userProfile.level;
    if (profileSkinCount) profileSkinCount.textContent = userProfile.skins.length;
}

function showStatus(message, isError = false) {
    if (authStatus) {
        authStatus.textContent = message;
        authStatus.style.color = isError ? "#ff5252" : "#4caf50";
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }
}
