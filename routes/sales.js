// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const express = require("express");
const { authRequired, requireRoles } = require("../config/jwt");
const asyncHandler = require("../middleware/async-handler");
const salesController = require("../controllers/salesController");

const router = express.Router();

// Sales read/write endpoints with role-based permissions.
router.get("/", authRequired, asyncHandler(salesController.listSales));
router.post("/", authRequired, requireRoles("Manager", "SalesAgent"), asyncHandler(salesController.createSale));

module.exports = router;

