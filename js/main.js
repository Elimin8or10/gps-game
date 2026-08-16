import { supabase } from "./supabase.js";
import { GAME_CONFIG, SKINS } from "./config.js";

// State
let currentUser = null;
let userProfile = {
    coins: 0,
    level: 1,
    skins: ["default"],
    activeSkin: "default"
};

// DOM Elements
const authScreen = document.getElementById("authScreen");
const modeScreen = document.getElementById("modeScreen");
const loadingScreen = document.getElementById("loadingScreen");
const shopOverlay = document.getElementById("shopOverlay");
const accountOverlay = document.getElementById("accountOverlay");

const emailInput = document.getElementById("emailInput");
const signInButton = document.getElementById("signInButton");
const authStatus = document.getElementById("authStatus");

// Wait for DOM to load before attaching events
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    await checkExistingSession();
}

function setupEventListeners() {
    if (signInButton) {
        signInButton.addEventListener("click", handleSignIn);
    }

    // Mode selection
    const publicModeBtn = document.getElementById("publicMode");
    const unlimitedModeBtn = document.getElementById("unlimitedMode");

    if (publicModeBtn) {
        publicModeBtn.addEventListener("click", () => selectMode("public"));
    }
    if (unlimitedModeBtn) {
        unlimitedModeBtn.addEventListener("click", () => selectMode("unlimited"));
    }

    // HUD Buttons
    const shopButton = document.getElementById("shopButton");
    const accountButton = document.getElementById("accountButton");
    const closeShop = document.getElementById("closeShop");
    const closeAccount = document.getElementById("closeAccount");
    const signOutButton = document.getElementById("signOutButton");

    if (shopButton) shopButton.addEventListener("click", () => shopOverlay.classList.add("active"));
    if (closeShop) closeShop.addEventListener("click", () => shopOverlay.classList.remove("active"));
    
    if (accountButton) accountButton.addEventListener("click", () => {
        updateAccountUI();
        accountOverlay.classList.add("active");
    });
    if (closeAccount) closeAccount.addEventListener("click", () => accountOverlay.classList.remove("active"));

    if (signOutButton) signOutButton.addEventListener("click", handleSignOut);
}

// Check if user is already logged in
async function checkExistingSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && session.user) {
            currentUser = session.user;
            await loadUserProfile();
            showModeScreen();
        } else {
            showAuthScreen();
        }
    } catch (err) {
        console.error("Session check error:", err);
        showAuthScreen();
    }
}

// Handle Sign In / Up
async function handleSignIn() {
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
        showStatus("Please enter a valid email address.", true);
        return;
    }

    try {
        showStatus("Signing in...");
        signInButton.disabled = true;

        // Magic Link Authentication
        const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.href
            }
        });

        if (error) throw error;

        showStatus("Check your email for the login link!");
    } catch (err) {
        console.error("Sign-in error:", err);
        showStatus(err.message || "Failed to sign in. Check your API setup.", true);
    } finally {
        if (signInButton) signInButton.disabled = false;
    }
}

// Handle Sign Out
async function handleSignOut() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        accountOverlay.classList.remove("active");
        showAuthScreen();
    } catch (err) {
        console.error("Sign-out error:", err);
    }
}

// Load profile data from database
async function loadUserProfile() {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

        if (error && error.code !== "PGRST116") {
            console.error("Error fetching profile:", error);
            return;
        }

        if (data) {
            userProfile = {
                coins: data.coins || 0,
                level: data.level || 1,
                skins: data.skins || ["default"],
                activeSkin: data.active_skin || "default"
            };
        } else {
            // Create initial profile record
            await supabase.from("profiles").insert([{
                id: currentUser.id,
                coins: 0,
                level: 1,
                skins: ["default"],
                active_skin: "default"
            }]);
        }

        updateHUD();
    } catch (err) {
        console.error("Profile sync error:", err);
    }
}

// UI State Screen Switches
function showAuthScreen() {
    if (authScreen) authScreen.style.display = "flex";
    if (modeScreen) modeScreen.classList.remove("active");
    if (loadingScreen) loadingScreen.classList.remove("active");
}

function showModeScreen() {
    if (authScreen) authScreen.style.display = "none";
    if (modeScreen) modeScreen.classList.add("active");
    if (loadingScreen) loadingScreen.classList.remove("active");
}

function selectMode(mode) {
    if (modeScreen) modeScreen.classList.remove("active");
    if (loadingScreen) loadingScreen.classList.add("active");

    const loadingText = document.getElementById("loadingText");
    if (loadingText) loadingText.textContent = `Loading ${mode.toUpperCase()} mode...`;

    // Simulate game initialization
    setTimeout(() => {
        if (loadingScreen) loadingScreen.classList.remove("active");
        showToast(`Game loaded in ${mode.toUpperCase()} mode!`);
    }, 1500);
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

    if (accountEmail) {
        accountEmail.textContent = currentUser ? currentUser.email : "Guest Account";
    }
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
