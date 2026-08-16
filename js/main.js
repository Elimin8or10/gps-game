import { supabase } from "./supabase.js";

// Game State
let currentUser = null;
let mapInstance = null;
let userProfile = { coins: 0, level: 1, skins: ["default"], activeSkin: "default" };

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
    await checkExistingSession();
}

function initMap() {
    // Initialize Leaflet map targeting the #map div
    if (document.getElementById("map")) {
        mapInstance = L.map("map").setView([51.505, -0.09], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors"
        }).addTo(mapInstance);
    }
}

function setupEventListeners() {
    if (signInButton) {
        signInButton.addEventListener("click", handleSignIn);
    }

    // Mode Selection Buttons
    const publicModeBtn = document.getElementById("publicMode");
    const unlimitedModeBtn = document.getElementById("unlimitedMode");

    if (publicModeBtn) publicModeBtn.addEventListener("click", () => selectMode("public"));
    if (unlimitedModeBtn) unlimitedModeBtn.addEventListener("click", () => selectMode("unlimited"));

    // HUD Button Toggles
    const shopButton = document.getElementById("shopButton");
    const accountButton = document.getElementById("accountButton");
    const closeShop = document.getElementById("closeShop");
    const closeAccount = document.getElementById("closeAccount");
    const signOutButton = document.getElementById("signOutButton");

    if (shopButton) shopButton.addEventListener("click", () => shopOverlay.classList.add("active"));
    if (closeShop) closeShop.addEventListener("click", () => shopOverlay.classList.remove("active"));
    
    if (accountButton) accountButton.addEventListener("click", () => accountOverlay.classList.add("active"));
    if (closeAccount) closeAccount.addEventListener("click", () => accountOverlay.classList.remove("active"));

    if (signOutButton) signOutButton.addEventListener("click", handleSignOut);
}

async function checkExistingSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && session.user) {
            currentUser = session.user;
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
        signInButton.disabled = true;

        const { error } = await supabase.auth.signInWithOtp({
            email: email,
            options: { emailRedirectTo: window.location.href }
        });

        if (error) throw error;
        showStatus("Check your email for the magic link!");
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
        accountOverlay.classList.remove("active");
        showScreen(authScreen);
    } catch (err) {
        console.error("Sign-out error:", err);
    }
}

function selectMode(mode) {
    showScreen(loadingScreen);
    const loadingText = document.getElementById("loadingText");
    if (loadingText) loadingText.textContent = `Loading ${mode.toUpperCase()} mode...`;

    setTimeout(() => {
        hideAllScreens();
        if (mapInstance) {
            mapInstance.invalidateSize(); // Fixes map rendering bugs after UI switch
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
