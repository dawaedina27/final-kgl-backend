// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const express = require("express");
const rateLimit = require("express-rate-limit");
const { authRequired } = require("../config/jwt");
const asyncHandler = require("../middleware/async-handler");
const authController = require("../controllers/authController");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_WINDOW_MS || 10 * 60 * 1000),
  limit: Number(process.env.AUTH_RATE_LIMIT || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." }
});

// Login endpoint issues JWT for valid credentials.
router.post("/login", loginLimiter, asyncHandler(authController.login));

// Authenticated profile endpoint.
router.get("/me", authRequired, asyncHandler(authController.me));
router.patch("/me/profile-image", authRequired, asyncHandler(authController.updateMyProfileImage));

module.exports = router;

