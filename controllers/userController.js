// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// I normalize the role text to match system roles.
function normalizeRole(role) {
  const compact = String(role || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (compact === "manager") return "Manager";
  if (compact === "director") return "Director";
  if (compact === "salesagent") return "SalesAgent";
  return "";
}

// Basic email format check.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function normalizePhone(phone) {
  return String(phone || "").trim().replace(/[\s()-]/g, "");
}

function normalizeProfileImage(profileImage) {
  const value = String(profileImage || "").trim();
  if (!value) return "";
  const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value);
  if (!isDataImage) return null;
  // Keep payload bounded so user records remain reasonably sized.
  if (value.length > 3 * 1024 * 1024) return null;
  return value;
}

// Basic international/local phone format check.
function isValidPhone(phone) {
  return /^\+?[0-9]{7,15}$/.test(String(phone || ""));
}

// Director can use this to view all users.
async function listUsers(req, res) {
  const users = await User.find().select("-passwordHash -passwordText -failedLoginAttempts -lockUntil").sort({ createdAt: -1 });
  return res.json(users.map((row) => ({
    ...row.toObject(),
    userId: row.userId || `USR-${String(row._id).slice(-8).toUpperCase()}`,
    id: String(row._id)
  })));
}

// Director uses this to create a new user account.
async function createUser(req, res) {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = normalizePhone(req.body.phone);
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = normalizeRole(req.body.role);
  const branch = String(req.body.branch || "").trim();
  const profileImage = normalizeProfileImage(req.body.profileImage);

  if (!name || !email || !phone || !username || !password || !role || !branch) {
    return res.status(400).json({ message: "Name, email, phone, username, password, role and branch are required." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Email format is invalid." });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: "Phone format is invalid." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }
  if (profileImage === null) {
    return res.status(400).json({ message: "Profile image must be a valid image file (png, jpg, webp, gif)." });
  }

  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    return res.status(409).json({ message: "Username already exists." });
  }
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return res.status(409).json({ message: "Email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await User.create({
    name,
    email,
    phone,
    username,
    passwordHash,
    role,
    branch,
    profileImage: profileImage || "",
    active: true
  });
  return res.status(201).json({
    id: String(created._id),
    userId: created.userId || `USR-${String(created._id).slice(-8).toUpperCase()}`,
    name: created.name,
    email: created.email,
    phone: created.phone,
    username: created.username,
    role: created.role,
    branch: created.branch,
    profileImage: created.profileImage || "",
    active: created.active
  });
}

// This activates or deactivates a user.
async function setUserActive(req, res) {
  const active = Boolean(req.body.active);
  const user = await User.findByIdAndUpdate(req.params.id, { active }, { new: true }).select("-passwordHash -passwordText -failedLoginAttempts -lockUntil");
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  return res.json({
    ...user.toObject(),
    userId: user.userId || `USR-${String(user._id).slice(-8).toUpperCase()}`,
    id: String(user._id)
  });
}

// This updates selected fields for a user account.
async function updateUser(req, res) {
  const targetId = String(req.params.id || "");
  const updates = {};
  if (req.body.name !== undefined) updates.name = String(req.body.name || "").trim();
  if (req.body.email !== undefined) {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email format is invalid." });
    }
    const existing = await User.findOne({ email, _id: { $ne: targetId } }).select("_id");
    if (existing) {
      return res.status(409).json({ message: "Email already exists." });
    }
    updates.email = email;
  }
  if (req.body.phone !== undefined) {
    const phone = normalizePhone(req.body.phone);
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: "Phone format is invalid." });
    }
    updates.phone = phone;
  }
  if (req.body.role !== undefined) {
    const role = normalizeRole(req.body.role);
    if (!role) {
      return res.status(400).json({ message: "Invalid role." });
    }
    updates.role = role;
  }
  if (req.body.branch !== undefined) updates.branch = String(req.body.branch || "").trim();
  if (req.body.profileImage !== undefined) {
    const profileImage = normalizeProfileImage(req.body.profileImage);
    if (profileImage === null) {
      return res.status(400).json({ message: "Profile image must be a valid image file (png, jpg, webp, gif)." });
    }
    updates.profileImage = profileImage;
  }
  if (req.body.username !== undefined) {
    const username = String(req.body.username || "").trim().toLowerCase();
    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }
    const existing = await User.findOne({ username, _id: { $ne: targetId } }).select("_id");
    if (existing) {
      return res.status(409).json({ message: "Username already exists." });
    }
    updates.username = username;
  }
  if (req.body.password !== undefined) {
    const password = String(req.body.password || "");
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    updates.passwordHash = await bcrypt.hash(password, 10);
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: "No updates provided." });
  }

  const user = await User.findByIdAndUpdate(targetId, updates, { new: true, runValidators: true }).select("-passwordHash -passwordText -failedLoginAttempts -lockUntil");
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  return res.json({
    ...user.toObject(),
    userId: user.userId || `USR-${String(user._id).slice(-8).toUpperCase()}`,
    id: String(user._id)
  });
}

// This permanently removes a user.
async function removeUser(req, res) {
  const removed = await User.findByIdAndDelete(req.params.id);
  if (!removed) {
    return res.status(404).json({ message: "User not found." });
  }
  return res.json({ message: "User removed." });
}

module.exports = { listUsers, createUser, setUserActive, updateUser, removeUser };

