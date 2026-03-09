// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const express = require("express");
const { authRequired } = require("../config/jwt");
const asyncHandler = require("../middleware/async-handler");
const stockController = require("../controllers/stockController");

const router = express.Router();

// Stock listing endpoint for dashboards and validation.
router.get("/", authRequired, asyncHandler(stockController.listStocks));

module.exports = router;

