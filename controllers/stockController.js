// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const Stock = require("../models/Stock");

// This returns stock list sorted by latest update.
async function listStocks(req, res) {
  const query = {};

  if (req.user.role === "SalesAgent" || req.user.role === "Manager") {
    query.branch = req.user.branch;
  } else if (req.query.branch) {
    query.branch = req.query.branch;
  }

  const rows = await Stock.find(query).sort({ updatedAt: -1 });
  return res.json(rows.map((row) => ({
    ...row.toObject(),
    stockId: row.stockId || `STK-${String(row._id).slice(-8).toUpperCase()}`,
    id: String(row._id)
  })));
}

module.exports = { listStocks };

