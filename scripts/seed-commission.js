// One-off: give every partner a 5% commission and tie existing bookings to the partner of their location.
// Usage: node scripts/seed-commission.js
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const envFile = [".env.local", ".env"].map((f) => path.join(__dirname, "..", f)).find((f) => fs.existsSync(f));
const env = Object.fromEntries(
  fs.readFileSync(envFile, "utf8").split("\n").filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")])
);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || env.MONGODB_URI, { dbName: "epicjourneys" });
  const db = mongoose.connection.db;
  const p = await db.collection("users").updateMany({ role: "partner", commissionPercent: { $exists: false } }, { $set: { commissionPercent: 5 } });
  const dests = new Map((await db.collection("destinations").find({ partnerId: { $ne: null } }).project({ partnerId: 1 }).toArray()).map((d) => [String(d._id), d.partnerId]));
  let b = 0;
  for (const bk of await db.collection("bookings").find({ commissionPartnerId: { $in: [null] }, locationId: { $ne: null } }).toArray()) {
    const partner = dests.get(String(bk.locationId));
    if (partner) {
      await db.collection("bookings").updateOne({ _id: bk._id }, { $set: { commissionPartnerId: partner } });
      b++;
    }
  }
  console.log(`Set 5% commission on ${p.modifiedCount} partner(s); linked ${b} booking(s) to their location's partner`);
  await mongoose.disconnect();
})();
