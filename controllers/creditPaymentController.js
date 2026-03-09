// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const CreditPayment = require("../models/CreditPayment");
const Sale = require("../models/Sale");
const mongoose = require("mongoose");

// This gets credit payment records, optionally by branch.
async function listCreditPayments(req, res) {
  const query = {};
  if (req.query.branch) query.branch = req.query.branch;
  const rows = await CreditPayment.find(query).sort({ createdAt: -1 });
  return res.json(rows.map((row) => ({
    ...row.toObject(),
    creditPaymentId: row.creditPaymentId || `SET-${String(row._id).slice(-8).toUpperCase()}`,
    id: String(row._id)
  })));
}

// This records a payment for a credit sale.
async function createCreditPayment(req, res) {
  const creditSaleId = String(req.body.creditSaleId || "");
  const amount = Number(req.body.amount || 0);
  const paymentDate = String(req.body.paymentDate || "");
  const note = String(req.body.note || "");

  if (!creditSaleId || amount <= 0 || !paymentDate) {
    return res.status(400).json({ message: "creditSaleId, amount and paymentDate are required." });
  }
  if (!mongoose.Types.ObjectId.isValid(creditSaleId)) {
    return res.status(400).json({ message: "creditSaleId is invalid." });
  }

  const sale = await Sale.findById(creditSaleId);
  if (!sale || sale.saleType !== "credit") {
    return res.status(404).json({ message: "Credit sale not found." });
  }

  // Sales agent can only record payment for own credit sale.
  if (req.user.role === "SalesAgent" && req.user.username !== sale.agent) {
    return res.status(403).json({ message: "Cannot record payment for another agent's credit sale." });
  }

  const allPayments = await CreditPayment.find({ creditSaleId: sale._id }).select("amount");
  const paidSoFar = allPayments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const remaining = Math.max(Number(sale.amountDue || 0) - paidSoFar, 0);
  if (remaining <= 0) {
    return res.status(400).json({ message: "This credit sale is already fully paid." });
  }
  if (amount > remaining) {
    return res.status(400).json({ message: `Payment exceeds balance. Remaining balance is ${remaining}.` });
  }

  const row = await CreditPayment.create({
    creditSaleId: sale._id,
    amount,
    paymentDate,
    collectedBy: req.user.username,
    note,
    branch: sale.branch
  });

  return res.status(201).json({
    ...row.toObject(),
    creditPaymentId: row.creditPaymentId || `SET-${String(row._id).slice(-8).toUpperCase()}`,
    id: String(row._id)
  });
}

module.exports = { listCreditPayments, createCreditPayment };

