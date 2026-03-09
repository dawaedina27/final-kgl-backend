// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const mongoose = require("mongoose");
const { generateEntityId } = require("../utils/id");

const branchSchema = new mongoose.Schema(
  {
    branchId: { type: String, unique: true, sparse: true, index: true, default: () => generateEntityId("BRH") },
    name: { type: String, required: true, trim: true, unique: true },
    address: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branch", branchSchema);

