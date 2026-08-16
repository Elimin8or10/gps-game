import { supabase } from "./supabase.js";
import { $ } from "./utils.js";

export async function handleSignIn() {

    const emailInput = $("emailInput");
    const button = $("signInButton");
    const status = $("authStatus");

    const email = emailInput.value.trim();

    if (!email) {
        status.textContent = "Please enter your email.";
        return;
    }

    if (!emailInput.checkValidity()) {
        status.textContent = "Please enter a valid email.";
        return;
    }

    button.disabled = true;
    status.textContent = "Checking account...";

    try {

        /*
         * Send a magic-link email.
         *
         * Your Supabase project must have email
         * authentication enabled.
         */
        const { error } =
            await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo:
                        window.location.origin
                }
            });

        if (error) {
            throw error;
        }

        status.textContent =
            "Check your email for your login link! 📧";

    } catch (error) {

        console.error(
            "Sign-in error:",
            error
        );

        status.textContent =
            error.message ||
            "Unable to sign in.";

        button.disabled = false;
    }
}


export function initializeAuth() {

    const button =
        $("signInButton");

    const emailInput =
        $("emailInput");

    if (!button) {
        console.error(
            "signInButton was not found."
        );
        return;
    }

    button.addEventListener(
        "click",
        handleSignIn
    );

    /*
     * Allow pressing Enter in the email box.
     */
    if (emailInput) {

        emailInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {
                    handleSignIn();
                }

            }
        );
    }


    /*
     * Check whether the player is already
     * logged in.
     */
    supabase.auth.onAuthStateChange(
        (event, session) => {

            console.log(
                "Auth event:",
                event,
                session
            );

            if (session?.user) {

                console.log(
                    "Logged in:",
                    session.user.email
                );

                handleLoggedIn(
                    session.user
                );
            }
        }
    );
}


function handleLoggedIn(user) {

    const authScreen =
        $("authScreen");

    if (authScreen) {
        authScreen.style.display = "none";
    }

    console.log(
        "Player authenticated:",
        user.email
    );

    /*
     * We'll connect this to your game
     * initialization next.
     */
}
