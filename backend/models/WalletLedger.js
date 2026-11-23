// models/WalletLedger.js
const mongoose = require("mongoose");

const walletLedgerSchema = new mongoose.Schema(
  {
    citizenId: { type: mongoose.Schema.Types.ObjectId, ref: "Citizen", required: true },
    idempotencyKey: { type: String, required: true, unique: true },
    entryType: {
      type: String,
      enum: ["ESCROW_RELEASE", "BBPS_RECHARGE_DEBIT"],
      required: true
    },
    amount: { type: Number, required: true },
    note: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletLedger", walletLedgerSchema);