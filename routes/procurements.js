// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const express = require("express");
const { authRequired, requireRoles } = require("../config/jwt");
const asyncHandler = require("../middleware/async-handler");
const procurementController = require("../controllers/procurementController");

const router = express.Router();

// Procurement data read/write endpoints.
router.get("/", authRequired, asyncHandler(procurementController.listProcurements));
router.post("/", authRequired, requireRoles("Manager"), asyncHandler(procurementController.createProcurement));

module.exports = router;

