// One-off: every destination that existed before countries were added is in India.
// Usage: node scripts/backfill-country.js
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const envFile = [".env.local", ".env"].map((f) => path.join(__dirname, "..", f)).find((f) => fs.existsSync(f));
const env = Object.fromEntries(
  fs.readFileSync(envFile, "utf8").split("\n").filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")])
);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || env.MONGODB_URI, { dbName: "epicjourneys" });
  const r = await mongoose.connection.db.collection("destinations").updateMany({ $or: [{ country: { $exists: false } }, { country: null }, { country: "" }] }, { $set: { country: "India" } });
  console.log(`Set country = India on ${r.modifiedCount} destination(s)`);
  await mongoose.disconnect();
})();
