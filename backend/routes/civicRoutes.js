// routes/civicRoutes.js
const express = require("express");
const router = express.Router();
const Citizen = require("../models/Citizen");
const Incident = require("../models/Incident");
const WalletLedger = require("../models/WalletLedger");
const { createPseudonym, getDistanceMeters, sealEvidenceBuffer } = require("../utils/security");

// Seed default demo records if database is empty (great for live client demos)
async function ensureDemoSeed() {
    let citizen = await Citizen.findOne({ displayAlias: "Citizen Aarav" });
    if (!citizen) {
        citizen = await Citizen.create({
            pseudonymId: createPseudonym("9845012844"),
            displayAlias: "Citizen Aarav",
            locality: "Asalpha, Mumbai",
            civicScore: 78420,
            availableWallet: 2400,
            escrowWallet: 450
        });
    }

    let incident = await Incident.findOne({ incidentCode: "#20194" });
    if (!incident) {
        // Asalpha, Mumbai coordinates: [lng: 72.8902, lat: 19.0968]
        incident = await Incident.create({
            incidentCode: "#20194",
            category: "Public & Transit Safety",
            headline: "Van Blocking Ambulance Gate",
            locality: "Asalpha, Mumbai",
            location: { type: "Point", coordinates: [72.8902, 19.0968] },
            witnessCount: 2,
            requiredWitnesses: 3,
            escrowReward: 450,
            status: "PENDING_CONSENSUS"
        });
    }

    return { citizen, incident };
}

// 1. Get Current Live State
router.get("/state", async (req, res) => {
    try {
        const { citizen, incident } = await ensureDemoSeed();
        res.json({ citizen, incident });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Witness Check-In (500m Geo-Fence + Anti-GPS Spoof Shield)
router.post("/witness-confirm", async (req, res) => {
    try {
        const {
            incidentCode = "#20194",
            latitude,
            longitude,
            isMockLocation = false,
            speedMps = 1.2
        } = req.body;

        // Anti-Spoof Check: Mock location app or unrealistic GPS jump/speed
        if (isMockLocation || speedMps > 45) {
            return res.status(403).json({
                blocked: true,
                code: 403,
                reason: "ANTI-SPOOF SHIELD TRIGGERED: Mock GPS / Impossible Velocity detected."
            });
        }

        const { citizen, incident } = await ensureDemoSeed();
        const target = await Incident.findOne({ incidentCode });
        if (!target) return res.status(404).json({ error: "Incident not found" });

        // Check distance against incident GeoJSON [lng, lat]
        const [incLng, incLat] = target.location.coordinates;
        const distanceMeters = getDistanceMeters(incLat, incLng, Number(latitude), Number(longitude));

        if (distanceMeters > 500) {
            return res.status(403).json({
                blocked: true,
                code: 403,
                distanceMeters: Math.round(distanceMeters),
                reason: `GEO-FENCE REJECTED: Witness is ${Math.round(distanceMeters)}m away (limit: 500m).`
            });
        }

        // Increment consensus count up to requiredWitnesses (3)
        const nextCount = Math.min(target.witnessCount + 1, target.requiredWitnesses);
        const reachedConsensus = nextCount >= target.requiredWitnesses;

        target.witnessCount = nextCount;
        target.status = reachedConsensus ? "CONFIRMED_PUBLIC" : "PENDING_CONSENSUS";
        await target.save();

        let releasedAmount = 0;
        if (reachedConsensus && citizen.escrowWallet >= target.escrowReward) {
            releasedAmount = target.escrowReward;
            citizen.escrowWallet -= releasedAmount;
            citizen.availableWallet += releasedAmount;
            citizen.civicScore = Math.min(citizen.civicScore + 250, 99999);
            await citizen.save();

            await WalletLedger.create({
                citizenId: citizen._id,
                idempotencyKey: `ESCROW_${target.incidentCode}_${Date.now()}`,
                entryType: "ESCROW_RELEASE",
                amount: releasedAmount,
                note: `Released ₹${releasedAmount} escrow upon 3/3 consensus for ${target.incidentCode}`
            });
        }

        res.json({
            verified: true,
            distanceMeters: Math.round(distanceMeters),
            consensus: `${target.witnessCount}/${target.requiredWitnesses}`,
            incidentStatus: target.status,
            escrowReleased: releasedAmount,
            citizen
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. BBPS Wallet Recharge with Idempotency Protection (Prevents Double-Spending)
router.post("/bbps-recharge", async (req, res) => {
    try {
        const idempotencyKey = req.header("Idempotency-Key");
        if (!idempotencyKey) {
            return res.status(400).json({ error: "Idempotency-Key header is required" });
        }

        // Reject duplicate tap / replay attack immediately
        const duplicate = await WalletLedger.findOne({ idempotencyKey });
        if (duplicate) {
            return res.status(409).json({
                blocked: true,
                code: 409,
                reason: "DOUBLE-SPEND BLOCKED (409): Duplicate Idempotency-Key already processed."
            });
        }

        const { operator = "Jio", mobileNumber = "+91 98450 12844", amount = 299 } = req.body;
        const debitAmount = Number(amount);
        const { citizen } = await ensureDemoSeed();

        if (citizen.availableWallet < debitAmount) {
            return res.status(400).json({ error: "Insufficient available wallet balance" });
        }

        citizen.availableWallet -= debitAmount;
        await citizen.save();

        await WalletLedger.create({
            citizenId: citizen._id,
            idempotencyKey,
            entryType: "BBPS_RECHARGE_DEBIT",
            amount: -debitAmount,
            note: `BBPS ${operator} ₹${debitAmount} recharge for ${mobileNumber}`
        });

        res.json({
            success: true,
            debited: debitAmount,
            availableWallet: citizen.availableWallet,
            civicScore: citizen.civicScore,
            idempotencyKey
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Whistle-Blower Video/Evidence Upload (EXIF Strip + SHA-256 Hash)
router.post("/whistle-upload", async (req, res) => {
    try {
        const {
            rawPhone = "+91 98450 12844",
            category = "Public & Transit Safety",
            headline = "Anonymous Evidence Clip",
            fileName = "whistle_clip.mp4"
        } = req.body;

        const anonymousAlias = createPseudonym(rawPhone);
        const sealed = sealEvidenceBuffer(`${fileName}|${headline}|${Date.now()}`);

        const incident = await Incident.findOneAndUpdate(
            { incidentCode: "#20194" },
            {
                evidenceSha256: sealed.sha256,
                metadataStripped: sealed.metadataStripped
            },
            { new: true }
        );

        res.json({
            protected: true,
            reporterIdentityStored: false,
            anonymousAlias,
            category,
            headline,
            metadataStripped: sealed.metadataStripped,
            strippedFields: sealed.strippedFields,
            evidenceSha256: sealed.sha256,
            incident
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;