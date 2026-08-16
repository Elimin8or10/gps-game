// =========================
// DOM HELPER
// =========================

export function $(id) {
    return document.getElementById(id);
}


// =========================
// STATUS
// =========================

export function setStatus(text) {

    const status = $("status");

    if (status) {
        status.textContent = text;
    }
}


// =========================
// LOADING
// =========================

export function setLoading(
    text,
    progress
) {

    const loadingText =
        $("loadingText");

    const loadingBar =
        $("loadingBar");

    if (loadingText) {
        loadingText.textContent = text;
    }

    if (loadingBar) {
        loadingBar.style.width =
            `${progress}%`;
    }
}


// =========================
// TOAST
// =========================

let toastTimer = null;

export function showToast(text) {

    const toast = $("toast");

    if (!toast) {
        return;
    }

    toast.textContent = text;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 2200);
}


// =========================
// DISTANCE
// =========================

export function distanceMeters(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const p1 =
        lat1 * Math.PI / 180;

    const p2 =
        lat2 * Math.PI / 180;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(p1) *
        Math.cos(p2) *
        Math.sin(dLon / 2) ** 2;

    return (
        R *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );
}


// =========================
// HEADING
// =========================

export function normalizeHeading(value) {

    if (
        typeof value !== "number" ||
        Number.isNaN(value)
    ) {
        return null;
    }

    return (
        (value % 360) + 360
    ) % 360;
}
