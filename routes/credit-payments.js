// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const express = require("express");
const { authRequired, requireRoles } = require("../config/jwt");
const asyncHandler = require("../middleware/async-handler");
const creditPaymentController = require("../controllers/creditPaymentController");

const router = express.Router();

// Credit payment read/write endpoints.
router.get("/", authRequired, asyncHandler(creditPaymentController.listCreditPayments));
router.post("/", authRequired, requireRoles("Manager", "SalesAgent"), asyncHandler(creditPaymentController.createCreditPayment));

module.exports = router;

