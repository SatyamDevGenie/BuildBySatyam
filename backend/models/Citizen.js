// models/Citizen.js
const mongoose = require("mongoose");

const citizenSchema = new mongoose.Schema(
    {
        pseudonymId: { type: String, required: true, unique: true }, // e.g. "Anonymous Guardian #3094"
        displayAlias: { type: String, required: true }, // e.g. "Citizen Aarav"
        locality: { type: String, default: "Asalpha, Mumbai" },
        civicScore: { type: Number, default: 78420, min: 0, max: 99999 },
        availableWallet: { type: Number, default: 2400, min: 0 },
        escrowWallet: { type: Number, default: 450, min: 0 }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Citizen", citizenSchema);