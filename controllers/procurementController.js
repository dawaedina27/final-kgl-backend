// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const Procurement = require("../models/Procurement");
const Stock = require("../models/Stock");
const { generateEntityId } = require("../utils/id");
const { publishStockUpdate } = require("../realtime/stockRealtime");
const ALLOWED_PRODUCE_NAMES = new Set(["beans", "grain maize", "cow peas", "g-nuts", "soybeans"]);
const MAX_IMAGE_DATA_URL_LENGTH = 4_500_000;

// This gets procurement records, with optional filters.
async function listProcurements(req, res) {
  const query = {};
  if (req.query.branch) query.branch = req.query.branch;
  if (req.query.produceName) query.produceName = req.query.produceName;
  const rows = await Procurement.find(query).sort({ createdAt: -1 });
  return res.json(rows);
}

// This saves a procurement and updates stock for that produce.
async function createProcurement(req, res) {
  const produceImage = String(req.body.produceImage || "").trim();
  const payload = {
    produceName: String(req.body.produceName || "").trim().toLowerCase(),
    produceType: String(req.body.produceType || "").trim(),
    produceImage,
    tonnage: Number(req.body.tonnage || 0),
    cost: Number(req.body.cost || 0),
    dealerName: String(req.body.dealerName || "").trim(),
    dealerContact: String(req.body.dealerContact || "").trim(),
    date: String(req.body.date || ""),
    time: String(req.body.time || ""),
    sellingPrice: Number(req.body.sellingPrice || 0),
    branch: String(req.body.branch || req.user.branch || "").trim(),
    createdBy: req.user.username
  };

  if (!payload.produceName || payload.tonnage <= 0 || payload.cost <= 0 || payload.sellingPrice <= 0 || !payload.branch) {
    return res.status(400).json({ message: "Invalid procurement payload." });
  }
  if (!ALLOWED_PRODUCE_NAMES.has(payload.produceName)) {
    return res.status(400).json({ message: "Invalid produce name." });
  }
  if (payload.produceImage) {
    const isDataUrl = /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(payload.produceImage);
    if (!isDataUrl || payload.produceImage.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return res.status(400).json({ message: "Invalid produce image payload." });
    }
  }

  const row = await Procurement.create(payload);
  const updateSet = {
    sellingPrice: payload.sellingPrice,
    updatedBy: req.user.username
  };
  if (payload.produceImage) {
    updateSet.produceImage = payload.produceImage;
  }

  await Stock.findOneAndUpdate(
    { produceName: payload.produceName, branch: payload.branch },
    {
      $setOnInsert: {
        stockId: generateEntityId("STK"),
        produceName: payload.produceName,
        produceType: payload.produceType,
        produceImage: payload.produceImage || ""
      },
      $inc: { availableStock: payload.tonnage },
      $set: updateSet
    },
    { upsert: true, new: true }
  );
  publishStockUpdate({ branch: payload.branch, source: "procurement" });

  return res.status(201).json(row);
}

module.exports = { listProcurements, createProcurement };

