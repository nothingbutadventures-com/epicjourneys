// One-off: give older tours a basePriceInr (their current price) so city supplements can be added on top.
// Usage: node scripts/migrate-base-price.js
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const envFile = path.join(__dirname, "..", ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envFile, "utf8").split("\n").filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || env.MONGODB_URI, { dbName: "epicjourneys" });
  const res = await mongoose.connection.db
    .collection("tours")
    .updateMany({ $or: [{ basePriceInr: { $exists: false } }, { basePriceInr: 0 }], priceInr: { $gt: 0 } }, [{ $set: { basePriceInr: "$priceInr" } }]);
  console.log(`Updated ${res.modifiedCount} tour(s)`);
  await mongoose.disconnect();
})();
