// Developer note from me: I wrote and maintain this file for the KGL system, and I keep this logic explicit so future updates are safer.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const Branch = require("./models/Branch");
const Stock = require("./models/Stock");
const Sale = require("./models/Sale");
const { generateEntityId } = require("./utils/id");

async function seedUsers() {
  await connectDB();

  const seeds = [
    { name: "Dawa Edina Hillary", email: "dawa@karibugroceries.com", phone: "+256701000111", username: "dawa", password: "manager123", role: "Manager", branch: "Maganjo" },
    { name: "Orban", email: "orban@karibugroceries.com", phone: "+256702000222", username: "orban", password: "director123", role: "Director", branch: "Head Office" },
    { name: "Hana Debay", email: "hana@karibugroceries.com", phone: "+256703000333", username: "hana", password: "sales123", role: "SalesAgent", branch: "Maganjo" }
  ];

  for (const user of seeds) {
    const exists = await User.findOne({ $or: [{ username: user.username }, { email: user.email }] });
    if (exists) {
      if (!exists.phone) {
        exists.phone = user.phone;
        await exists.save();
      }
      continue;
    }
    const passwordHash = await bcrypt.hash(user.password, 10);
    await User.create({
      name: user.name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      passwordHash,
      role: user.role,
      branch: user.branch,
      active: true
    });
  }

  const stockSeeds = [
    { produceName: "beans", produceType: "Legume", branch: "Maganjo", availableStock: 5200, sellingPrice: 3800, updatedBy: "dawa" },
    { produceName: "grain maize", produceType: "Cereal", branch: "Maganjo", availableStock: 6900, sellingPrice: 2100, updatedBy: "dawa" },
    { produceName: "cow peas", produceType: "Legume", branch: "Matugga", availableStock: 3100, sellingPrice: 5400, updatedBy: "dawa" },
    { produceName: "g-nuts", produceType: "Nut", branch: "Matugga", availableStock: 4700, sellingPrice: 4200, updatedBy: "dawa" },
    { produceName: "soybeans", produceType: "Legume", branch: "Matugga", availableStock: 2600, sellingPrice: 4900, updatedBy: "dawa" }
  ];

  for (const row of stockSeeds) {
    await Stock.updateOne(
      { produceName: row.produceName, branch: row.branch },
      {
        $set: row,
        $setOnInsert: { stockId: generateEntityId("STK") }
      },
      { upsert: true }
    );
  }

  const branchSeeds = [
    { name: "Matugga", address: "Matugga Trading Centre, Wakiso", active: true },
    { name: "Maganjo", address: "Maganjo Market Road, Kampala", active: true }
  ];

  for (const row of branchSeeds) {
    await Branch.updateOne(
      { name: row.name },
      {
        $set: row,
        $setOnInsert: { branchId: generateEntityId("BRH") }
      },
      { upsert: true }
    );
  }

  const saleSeeds = [
    {
      saleType: "cash",
      produce: "beans",
      tonnage: 300,
      amountPaid: 1140000,
      amountDue: 0,
      buyer: "Kampala Retail Hub",
      nin: "",
      location: "Kampala",
      contact: "+256700111222",
      agent: "hana",
      dueDate: "",
      dispatchDate: "",
      branch: "Maganjo",
      createdBy: "hana"
    },
    {
      saleType: "credit",
      produce: "grain maize",
      tonnage: 450,
      amountPaid: 0,
      amountDue: 945000,
      buyer: "Nansana Grains Dealers",
      nin: "",
      location: "Nansana",
      contact: "+256700333444",
      agent: "hana",
      dueDate: "2026-03-20",
      dispatchDate: "",
      branch: "Maganjo",
      createdBy: "hana"
    },
    {
      saleType: "cash",
      produce: "g-nuts",
      tonnage: 200,
      amountPaid: 1080000,
      amountDue: 0,
      buyer: "Matugga Foods Ltd",
      nin: "",
      location: "Matugga",
      contact: "+256700555666",
      agent: "dawa",
      dueDate: "",
      dispatchDate: "",
      branch: "Matugga",
      createdBy: "dawa"
    },
    {
      saleType: "credit",
      produce: "soybeans",
      tonnage: 260,
      amountPaid: 0,
      amountDue: 1092000,
      buyer: "Wakiso Wholesalers",
      nin: "",
      location: "Wakiso",
      contact: "+256700777888",
      agent: "dawa",
      dueDate: "2026-03-25",
      dispatchDate: "",
      branch: "Matugga",
      createdBy: "dawa"
    }
  ];

  for (const row of saleSeeds) {
    const exists = await Sale.findOne({
      saleType: row.saleType,
      produce: row.produce,
      buyer: row.buyer,
      branch: row.branch
    }).select("_id");
    if (exists) continue;
    await Sale.create(row);
  }

  console.log("Seed completed.");
  process.exit(0);
}

seedUsers().catch((error) => {
  console.error(error);
  process.exit(1);
});

