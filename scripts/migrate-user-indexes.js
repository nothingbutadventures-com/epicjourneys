// One-off: customers now sign in by mobile number, so email must be allowed to be missing and phone must be unique.
// Replaces the old unique email index with a partial one and reports any duplicate customer phone numbers.
// Usage: node scripts/migrate-user-indexes.js
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const envFile = [".env.local", ".env"].map((f) => path.join(__dirname, "..", f)).find((f) => fs.existsSync(f));
const env = Object.fromEntries(
  fs.readFileSync(envFile, "utf8").split("\n").filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")])
);

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || env.MONGODB_URI, { dbName: "epicjourneys" });
  const users = mongoose.connection.db.collection("users");
  const idx = await users.indexes();
  console.log("indexes before:", idx.map((i) => i.name).join(", "));

  // Tidy numbers first: digits only, without a leading 91, so login by phone matches.
  let tidied = 0;
  for (const u of await users.find({ phone: { $gt: "" } }).project({ phone: 1 }).toArray()) {
    const clean = String(u.phone).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (clean !== u.phone) { await users.updateOne({ _id: u._id }, { $set: { phone: clean } }); tidied++; }
  }
  console.log("phone numbers tidied:", tidied);

  if (idx.some((i) => i.name === "email_1")) { await users.dropIndex("email_1"); console.log("dropped email_1"); }
  await users.createIndex({ email: 1 }, { unique: true, name: "email_unique_partial", partialFilterExpression: { email: { $type: "string" } } });
  console.log("created email_unique_partial");

  const dups = await users.aggregate([{ $match: { role: "user", phone: { $gt: "" } } }, { $group: { _id: "$phone", n: { $sum: 1 }, ids: { $push: "$_id" } } }, { $match: { n: { $gt: 1 } } }]).toArray();
  if (dups.length) {
    console.log("DUPLICATE customer phones (resolve these, then re-run):", JSON.stringify(dups));
  } else {
    await users.createIndex({ phone: 1 }, { unique: true, name: "customer_phone_unique", partialFilterExpression: { role: "user", phone: { $gt: "" } } });
    console.log("created customer_phone_unique");
  }
  await mongoose.disconnect();
})();
