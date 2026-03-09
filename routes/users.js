// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const express = require("express");
const { authRequired, requireRoles } = require("../config/jwt");
const asyncHandler = require("../middleware/async-handler");
const userController = require("../controllers/userController");

const router = express.Router();

// Director-only user administration endpoints.
router.get("/", authRequired, requireRoles("Director"), asyncHandler(userController.listUsers));
router.post("/", authRequired, requireRoles("Director"), asyncHandler(userController.createUser));
router.patch("/:id/active", authRequired, requireRoles("Director"), asyncHandler(userController.setUserActive));
router.patch("/:id", authRequired, requireRoles("Director"), asyncHandler(userController.updateUser));
router.delete("/:id", authRequired, requireRoles("Director"), asyncHandler(userController.removeUser));

module.exports = router;

