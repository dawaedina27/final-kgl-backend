// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const mongoose = require("mongoose");
const { generateEntityId } = require("../utils/id");

const creditPaymentSchema = new mongoose.Schema(
  {
    creditPaymentId: { type: String, unique: true, sparse: true, index: true, default: () => generateEntityId("SET") },
    creditSaleId: { type: mongoose.Schema.Types.ObjectId, ref: "Sale", required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: String, required: true },
    collectedBy: { type: String, required: true, trim: true },
    note: { type: String, default: "", trim: true },
    branch: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditPayment", creditPaymentSchema);

