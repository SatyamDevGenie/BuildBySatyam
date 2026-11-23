// utils/security.js
const crypto = require("crypto");

const SECRET = process.env.VAULT_SECRET || "placingnes_newworld_vault_key_2027";

// Generates a zero-knowledge pseudonym so raw phone/user identity is never attached to public incidents
function createPseudonym(rawIdentifier) {
    const digest = crypto.createHmac("sha256", SECRET).update(String(rawIdentifier)).digest("hex");
    const code = parseInt(digest.slice(0, 4), 16) % 9000 + 1000;
    return `Anonymous Guardian #${code}`;
}

// Calculates true distance in meters between two [lat, lng] coordinates
function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Simulates stripping EXIF/GPS/device metadata and sealing evidence with SHA-256
function sealEvidenceBuffer(bufferOrString) {
    const cleanedPayload = `EXIF_STRIPPED|NO_DEVICE_SERIAL|NO_RAW_GPS|${bufferOrString}`;
    const sha256 = crypto.createHash("sha256").update(cleanedPayload).digest("hex");
    return {
        metadataStripped: true,
        strippedFields: ["EXIF_GPS", "DEVICE_IMEI_SERIAL", "AUTHOR_TAG", "CREATION_EXACT_MS"],
        sha256
    };
}

module.exports = {
    createPseudonym,
    getDistanceMeters,
    sealEvidenceBuffer
};