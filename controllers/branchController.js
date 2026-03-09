// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const Branch = require("../models/Branch");

async function listBranches(req, res) {
  const rows = await Branch.find().sort({ name: 1 });
  return res.json(rows.map((row) => ({
    ...row.toObject(),
    branchId: row.branchId || `BRH-${String(row._id).slice(-8).toUpperCase()}`,
    id: String(row._id)
  })));
}

async function createBranch(req, res) {
  const name = String(req.body.name || "").trim();
  const address = String(req.body.address || "").trim();

  if (!name || !address) {
    return res.status(400).json({ message: "Branch name and address are required." });
  }

  const exists = await Branch.findOne({ name });
  if (exists) {
    return res.status(409).json({ message: "Branch already exists." });
  }

  const created = await Branch.create({ name, address, active: true });
  return res.status(201).json({
    ...created.toObject(),
    branchId: created.branchId || `BRH-${String(created._id).slice(-8).toUpperCase()}`,
    id: String(created._id)
  });
}

async function updateBranch(req, res) {
  const targetId = String(req.params.id || "");
  const updates = {};

  if (req.body.name !== undefined) updates.name = String(req.body.name || "").trim();
  if (req.body.address !== undefined) updates.address = String(req.body.address || "").trim();

  if (updates.name !== undefined && !updates.name) {
    return res.status(400).json({ message: "Branch name is required." });
  }
  if (updates.address !== undefined && !updates.address) {
    return res.status(400).json({ message: "Branch address is required." });
  }

  if (updates.name) {
    const exists = await Branch.findOne({ name: updates.name, _id: { $ne: targetId } }).select("_id");
    if (exists) return res.status(409).json({ message: "Branch name already exists." });
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: "No updates provided." });
  }

  const branch = await Branch.findByIdAndUpdate(targetId, updates, { new: true, runValidators: true });
  if (!branch) return res.status(404).json({ message: "Branch not found." });
  return res.json({
    ...branch.toObject(),
    branchId: branch.branchId || `BRH-${String(branch._id).slice(-8).toUpperCase()}`,
    id: String(branch._id)
  });
}

async function setBranchActive(req, res) {
  const active = Boolean(req.body.active);
  const branch = await Branch.findByIdAndUpdate(req.params.id, { active }, { new: true });
  if (!branch) return res.status(404).json({ message: "Branch not found." });
  return res.json({
    ...branch.toObject(),
    branchId: branch.branchId || `BRH-${String(branch._id).slice(-8).toUpperCase()}`,
    id: String(branch._id)
  });
}

async function removeBranch(req, res) {
  const removed = await Branch.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ message: "Branch not found." });
  return res.json({ message: "Branch removed." });
}

module.exports = { listBranches, createBranch, updateBranch, setBranchActive, removeBranch };

