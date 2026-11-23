// models/Incident.js
const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
    {
        incidentCode: { type: String, required: true, unique: true }, // e.g. "#20194"
        category: { type: String, required: true },
        headline: { type: String, required: true },
        locality: { type: String, default: "Asalpha, Mumbai" },
        // GeoJSON Point [longitude, latitude] for 500m geospatial witness verification
        location: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: { type: [Number], required: true } // [lng, lat]
        },
        witnessCount: { type: Number, default: 2 },
        requiredWitnesses: { type: Number, default: 3 },
        witnessesVerified: [{ type: String }], // stores pseudonymIds only (no raw phone/identity)
        escrowReward: { type: Number, default: 450 },
        status: {
            type: String,
            enum: ["PENDING_CONSENSUS", "CONFIRMED_PUBLIC"],
            default: "PENDING_CONSENSUS"
        },
        evidenceSha256: { type: String, default: null },
        metadataStripped: { type: Boolean, default: false }
    },
    { timestamps: true }
);

incidentSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Incident", incidentSchema);