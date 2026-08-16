export const $ = id =>
    document.getElementById(id);


export function setStatus(text) {
    $("status").textContent = text;
}


export function setLoading(text, progress) {
    $("loadingText").textContent = text;

    $("loadingBar").style.width =
        `${progress}%`;
}


let toastTimer = null;

export function showToast(text) {

    const element = $("toast");

    element.textContent = text;

    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        element.classList.remove("show");
    }, 2200);
}


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
        (lat2 - lat1) * Math.PI / 180;

    const dLon =
        (lon2 - lon1) * Math.PI / 180;

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
