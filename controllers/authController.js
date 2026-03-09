// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../config/jwt");

const MAX_FAILED_LOGINS = Number(process.env.AUTH_LOCK_MAX_ATTEMPTS || 5);
const LOCK_WINDOW_MS = Number(process.env.AUTH_LOCK_WINDOW_MS || 15 * 60 * 1000);

function normalizeProfileImage(profileImage) {
  const value = String(profileImage || "").trim();
  if (!value) return "";
  const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(value);
  if (!isDataImage) return null;
  if (value.length > 3 * 1024 * 1024) return null;
  return value;
}

// This checks login credentials and gives back a JWT token.
async function login(req, res) {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const user = await User.findOne({ username, active: true });
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  const now = Date.now();
  const lockUntil = user.lockUntil ? new Date(user.lockUntil).getTime() : 0;
  if (lockUntil && lockUntil > now) {
    const waitMinutes = Math.ceil((lockUntil - now) / 60000);
    return res.status(423).json({ message: `Account is locked. Try again in ${waitMinutes} minute(s).` });
  }

  if (!user.passwordHash || typeof user.passwordHash !== "string") {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  let ok = false;
  try {
    ok = await bcrypt.compare(password, user.passwordHash);
  } catch (error) {
    ok = false;
  }
  if (!ok) {
    const attempts = Number(user.failedLoginAttempts || 0) + 1;
    const shouldLock = attempts >= MAX_FAILED_LOGINS;
    user.failedLoginAttempts = shouldLock ? 0 : attempts;
    user.lockUntil = shouldLock ? new Date(now + LOCK_WINDOW_MS) : null;
    await user.save();
    return res.status(401).json({ message: "Invalid username or password." });
  }

  if (Number(user.failedLoginAttempts || 0) > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }

  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: String(user._id),
      userId: user.userId || `USR-${String(user._id).slice(-8).toUpperCase()}`,
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
      branch: user.branch,
      profileImage: user.profileImage || ""
    }
  });
}

// This returns the current logged-in user profile.
async function me(req, res) {
  const user = await User.findById(req.user.sub).select("-passwordHash -passwordText -failedLoginAttempts -lockUntil");
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  return res.json({
    ...user.toObject(),
    userId: user.userId || `USR-${String(user._id).slice(-8).toUpperCase()}`,
    id: String(user._id)
  });
}

// This lets the authenticated user update their own profile image.
async function updateMyProfileImage(req, res) {
  const profileImage = normalizeProfileImage(req.body.profileImage);
  if (profileImage === null) {
    return res.status(400).json({ message: "Profile image must be a valid image file (png, jpg, webp, gif)." });
  }

  const user = await User.findByIdAndUpdate(
    req.user.sub,
    { profileImage },
    { new: true, runValidators: true }
  ).select("-passwordHash -passwordText -failedLoginAttempts -lockUntil");

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({
    ...user.toObject(),
    userId: user.userId || `USR-${String(user._id).slice(-8).toUpperCase()}`,
    id: String(user._id)
  });
}

module.exports = { login, me, updateMyProfileImage };

