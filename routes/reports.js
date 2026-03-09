// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const express = require("express");
const { authRequired, requireRoles } = require("../config/jwt");
const asyncHandler = require("../middleware/async-handler");
const reportController = require("../controllers/reportController");

const router = express.Router();

// Director reporting endpoint.
router.get("/director-summary", authRequired, requireRoles("Director"), asyncHandler(reportController.directorSummary));

module.exports = router;

