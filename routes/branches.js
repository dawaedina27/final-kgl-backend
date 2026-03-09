// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const express = require("express");
const { authRequired, requireRoles } = require("../config/jwt");
const asyncHandler = require("../middleware/async-handler");
const branchController = require("../controllers/branchController");

const router = express.Router();

router.get("/", authRequired, requireRoles("Director"), asyncHandler(branchController.listBranches));
router.post("/", authRequired, requireRoles("Director"), asyncHandler(branchController.createBranch));
router.patch("/:id", authRequired, requireRoles("Director"), asyncHandler(branchController.updateBranch));
router.patch("/:id/active", authRequired, requireRoles("Director"), asyncHandler(branchController.setBranchActive));
router.delete("/:id", authRequired, requireRoles("Director"), asyncHandler(branchController.removeBranch));

module.exports = router;

