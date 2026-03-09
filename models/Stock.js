// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const mongoose = require("mongoose");
const { generateEntityId } = require("../utils/id");

const stockSchema = new mongoose.Schema(
  {
    stockId: { type: String, unique: true, sparse: true, index: true, default: () => generateEntityId("STK") },
    produceName: { type: String, required: true, trim: true },
    produceType: { type: String, required: true, trim: true },
    produceImage: { type: String, default: "" },
    branch: { type: String, required: true, trim: true },
    availableStock: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    updatedBy: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

stockSchema.index({ produceName: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model("Stock", stockSchema);

