/**
 * Migration Script: wonderlust --> StayLio
 * Copies all collections (listings, users, reviews, bookings)
 * from the old database to the new one.
 * Run once: node migrate_db.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const SOURCE_DB = "mongodb://127.0.0.1:27017/StayLio";
const TARGET_DB = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/StayLio";

const COLLECTIONS = ["listings", "users", "reviews", "bookings", "sessions"];

async function migrate() {
  console.log("Connecting to source database:", SOURCE_DB);
  const sourceConn = await mongoose.createConnection(SOURCE_DB).asPromise();
  
  console.log("Connecting to target database:", TARGET_DB);
  const targetConn = await mongoose.createConnection(TARGET_DB).asPromise();

  const sourceDb = sourceConn.db;
  const targetDb = targetConn.db;

  for (const collName of COLLECTIONS) {
    const sourceColl = sourceDb.collection(collName);
    const count = await sourceColl.countDocuments();

    if (count === 0) {
      console.log(`[SKIP] Collection '${collName}' is empty.`);
      continue;
    }

    const docs = await sourceColl.find({}).toArray();
    const targetColl = targetDb.collection(collName);

    // Drop existing and re-insert to avoid duplicates
    await targetColl.deleteMany({});
    await targetColl.insertMany(docs);

    console.log(`[OK] Migrated ${docs.length} documents from '${collName}'.`);
  }

  console.log("\nMigration complete!");
  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
