// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const mongoose = require("mongoose");
const { generateEntityId } = require("../utils/id");

const userSchema = new mongoose.Schema(
  {
    // Stable business identifier for user records.
    userId: { type: String, unique: true, sparse: true, index: true, default: () => generateEntityId("USR") },
    // Human-friendly account name displayed in UI.
    name: { type: String, required: true, trim: true },
    // Email used for identification and communication.
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    // Primary phone contact for the user.
    phone: { type: String, required: true, trim: true },
    // Unique login username.
    username: { type: String, required: true, trim: true, unique: true, lowercase: true },
    // BCrypt-hashed password used for authentication.
    passwordHash: { type: String, required: true },
    // Failed login attempt counter used for account lockout.
    failedLoginAttempts: { type: Number, default: 0, min: 0 },
    // Lock expiration timestamp; user cannot login while now < lockUntil.
    lockUntil: { type: Date, default: null },
    // Role-based access control value.
    role: { type: String, enum: ["Manager", "SalesAgent", "Director"], required: true },
    // Branch scope for operational data access.
    branch: { type: String, required: true, trim: true },
    // Optional profile image (data URL) uploaded when creating/updating a user.
    profileImage: { type: String, default: "" },
    // Soft activation flag managed by Director.
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

