// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const mongoose = require("mongoose");
const { generateEntityId } = require("../utils/id");

const saleSchema = new mongoose.Schema(
  {
    saleId: { type: String, unique: true, sparse: true, index: true, default: () => generateEntityId("SAL") },
    saleType: { type: String, enum: ["cash", "credit"], required: true },
    produce: { type: String, required: true, trim: true },
    tonnage: { type: Number, required: true, min: 1 },
    amountPaid: { type: Number, min: 0, default: 0 },
    amountDue: { type: Number, min: 0, default: 0 },
    buyer: { type: String, required: true, trim: true },
    nin: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    contact: { type: String, trim: true, default: "" },
    agent: { type: String, required: true, trim: true },
    dueDate: { type: String, default: "" },
    dispatchDate: { type: String, default: "" },
    branch: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);

