// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const Sale = require("../models/Sale");
const Procurement = require("../models/Procurement");
const CreditPayment = require("../models/CreditPayment");

// This prepares director summary for sales, costs, and credit status.
async function directorSummary(req, res) {
  const sales = await Sale.find().lean();
  const procurements = await Procurement.find().lean();
  const payments = await CreditPayment.find().lean();

  const totalSales = sales.reduce((sum, s) => sum + Number(s.saleType === "cash" ? s.amountPaid : s.amountDue), 0);
  const totalProcurement = procurements.reduce((sum, p) => sum + Number(p.cost || 0), 0);
  const totalProfit = totalSales - totalProcurement;

  const paidBySale = {};
  payments.forEach((p) => {
    const id = String(p.creditSaleId || "");
    paidBySale[id] = (paidBySale[id] || 0) + Number(p.amount || 0);
  });

  let outstandingCredit = 0;
  let overdueCredits = 0;
  const now = Date.now();
  sales.filter((s) => s.saleType === "credit").forEach((s) => {
    const original = Number(s.amountDue || 0);
    const paid = Number(paidBySale[String(s._id)] || 0);
    const balance = Math.max(original - paid, 0);
    outstandingCredit += balance;
    if (balance > 0 && s.dueDate) {
      const due = new Date(s.dueDate).getTime();
      if (!Number.isNaN(due) && due < now) overdueCredits += 1;
    }
  });

  const branchBucket = {};
  const produceBucket = {};
  sales.forEach((s) => {
    const amount = Number(s.saleType === "cash" ? s.amountPaid : s.amountDue);
    const branch = String(s.branch || "Unknown");
    const produce = String(s.produce || "Unknown");

    if (!branchBucket[branch]) branchBucket[branch] = { branch, cash: 0, credit: 0, total: 0 };
    if (s.saleType === "cash") branchBucket[branch].cash += amount;
    else branchBucket[branch].credit += amount;
    branchBucket[branch].total += amount;

    produceBucket[produce] = (produceBucket[produce] || 0) + amount;
  });

  const byBranch = Object.values(branchBucket).sort((a, b) => b.total - a.total);
  const byProduce = Object.entries(produceBucket)
    .map(([produce, total]) => ({ produce, total }))
    .sort((a, b) => b.total - a.total);

  return res.json({
    totalSales,
    totalProcurement,
    totalProfit,
    outstandingCredit,
    overdueCredits,
    byBranch,
    byProduce
  });
}

module.exports = { directorSummary };

