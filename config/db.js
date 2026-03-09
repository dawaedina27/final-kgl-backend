// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set.");
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true
  });
  console.log("MongoDB connected");
}

module.exports = connectDB;

