// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const crypto = require("crypto");

function generateEntityId(prefix) {
  const safePrefix = String(prefix || "ID").trim().toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase();
  return `${safePrefix}-${stamp}-${random}`;
}

module.exports = { generateEntityId };

