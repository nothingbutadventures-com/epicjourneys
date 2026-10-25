// One-off: tag existing bookings and leads with the location they belong to, so partners see data by location.
// Usage: node scripts/backfill-location-data.js
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
  const users = new Map((await db.collection("users").find({ role: "partner" }).project({ assignedDestination: 1 }).toArray()).map((u) => [String(u._id), u.assignedDestination]));
  const tours = new Map((await db.collection("tours").find({}).project({ destinationId: 1, departures: 1 }).toArray()).map((t) => [String(t._id), t]));

  let b = 0;
  for (const bk of await db.collection("bookings").find({ locationId: { $in: [null] } }).toArray()) {
    let loc = null;
    if (bk.bookedByRole === "partner" && bk.partnerId) loc = users.get(String(bk.partnerId)) || null;
    if (!loc) {
      const t = tours.get(String(bk.tourId));
      const dep = t?.departures?.find((d) => String(d._id) === String(bk.departureId));
      loc = dep ? (dep.launchId ? dep.cityId : t.destinationId) : bk.destinationId || t?.destinationId || null;
    }
    if (loc) {
      await db.collection("bookings").updateOne({ _id: bk._id }, { $set: { locationId: loc } });
      b++;
    }
  }

  let l = 0;
  for (const ld of await db.collection("leads").find({ locationId: { $in: [null] }, partnerId: { $ne: null } }).toArray()) {
    const loc = users.get(String(ld.partnerId));
    if (loc) {
      await db.collection("leads").updateOne({ _id: ld._id }, { $set: { locationId: loc } });
      l++;
    }
  }
  console.log(`Tagged ${b} booking(s) and ${l} lead(s) with their location`);
  await mongoose.disconnect();
})();
