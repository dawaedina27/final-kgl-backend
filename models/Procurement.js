// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const mongoose = require("mongoose");

const procurementSchema = new mongoose.Schema(
  {
    produceName: { type: String, required: true, trim: true },
    produceType: { type: String, required: true, trim: true },
    produceImage: { type: String, default: "" },
    tonnage: { type: Number, required: true, min: 1 },
    cost: { type: Number, required: true, min: 0 },
    dealerName: { type: String, required: true, trim: true },
    dealerContact: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    branch: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Procurement", procurementSchema);

