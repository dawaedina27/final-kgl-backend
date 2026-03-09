// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const Sale = require("../models/Sale");
const Stock = require("../models/Stock");
const { publishStockUpdate } = require("../realtime/stockRealtime");

// This gets sales records based on role and filter options.
async function listSales(req, res) {
  const query = {};
  if (req.query.branch) query.branch = req.query.branch;
  if (req.query.saleType) query.saleType = req.query.saleType;
  if (req.query.agent) query.agent = req.query.agent;

  // Sales agent should only see own branch and own sales.
  if (req.user.role === "SalesAgent") {
    query.agent = req.user.username;
    query.branch = req.user.branch;
  }

  const rows = await Sale.find(query).sort({ createdAt: -1 });
  return res.json(rows.map((row) => ({
    ...row.toObject(),
    saleId: row.saleId || `SAL-${String(row._id).slice(-8).toUpperCase()}`,
    id: String(row._id)
  })));
}

// This records a sale and reduces stock from inventory.
async function createSale(req, res) {
  const saleType = String(req.body.saleType || "").trim().toLowerCase();
  const produce = String(req.body.produce || "").trim().toLowerCase();
  const tonnage = Number(req.body.tonnage || 0);
  const branch = String(req.user.role === "SalesAgent" ? req.user.branch : (req.body.branch || req.user.branch || "")).trim();
  const agent = String(req.user.role === "SalesAgent" ? req.user.username : (req.body.agent || req.user.username || "")).trim();
  const buyer = String(req.body.buyer || "").trim();
  const amountPaid = Number(req.body.amountPaid || 0);
  const amountDue = Number(req.body.amountDue || 0);

  if (!["cash", "credit"].includes(saleType) || !produce || tonnage <= 0 || !branch) {
    return res.status(400).json({ message: "Invalid sale payload." });
  }
  if (!buyer || buyer.length < 2) {
    return res.status(400).json({ message: "Buyer name is required." });
  }
  if (!agent) {
    return res.status(400).json({ message: "Agent is required." });
  }
  if (saleType === "cash" && amountPaid <= 0) {
    return res.status(400).json({ message: "amountPaid must be greater than zero for cash sales." });
  }
  if (saleType === "credit" && amountDue <= 0) {
    return res.status(400).json({ message: "amountDue must be greater than zero for credit sales." });
  }

  const stock = await Stock.findOne({ produceName: produce, branch });
  if (!stock) {
    return res.status(400).json({ message: "Cannot update record: selected produce is missing in inventory." });
  }
  if (Number(stock.availableStock || 0) < tonnage) {
    return res.status(400).json({ message: "Insufficient stock." });
  }

  const payload = {
    saleType,
    produce,
    tonnage,
    amountPaid: saleType === "cash" ? amountPaid : 0,
    amountDue: saleType === "credit" ? amountDue : 0,
    buyer,
    nin: String(req.body.nin || "").trim(),
    location: String(req.body.location || "").trim(),
    contact: String(req.body.contact || "").trim(),
    agent,
    dueDate: String(req.body.dueDate || ""),
    dispatchDate: String(req.body.dispatchDate || ""),
    branch,
    createdBy: req.user.username
  };

  const created = await Sale.create(payload);
  stock.availableStock = Math.max(Number(stock.availableStock || 0) - tonnage, 0);
  stock.updatedBy = req.user.username;
  await stock.save();
  publishStockUpdate({ branch, source: "sale" });

  return res.status(201).json({
    ...created.toObject(),
    saleId: created.saleId || `SAL-${String(created._id).slice(-8).toUpperCase()}`,
    id: String(created._id)
  });
}

module.exports = { listSales, createSale };

