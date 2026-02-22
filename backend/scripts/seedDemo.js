/**
 * scripts/seedDemo.js
 * -------------------------------------------------------
 * Creates demo users, accounts, and an initial-funds
 * transaction so you can explore the API without manual
 * data entry.
 *
 * HOW TO RUN:
 *   1. Make sure MONGO_URI is set in your .env file.
 *   2. node scripts/seedDemo.js
 *
 * All email addresses are deliberate dummy values
 * (demo+*@example.com) — no real email is ever used.
 * -------------------------------------------------------
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// ── Models ────────────────────────────────────────────────────
const userModel = require("../src/models/user.model");
const accountModel = require("../src/models/account.model");
const transactionModel = require("../src/models/transaction.model");
const ledgerModel = require("../src/models/ledger.model");

// ── Demo data (purely fictional) ─────────────────────────────
const DEMO_USERS = [
  {
    name: "Demo Alice",
    email: "demo+alice@example.com",
    password: "DemoPass123!",
    phoneNumber: "+10000000001",
    address: "1 Demo Lane, Example City",
    dateOfBirth: "1990-01-15",
  },
  {
    name: "Demo Bob",
    email: "demo+bob@example.com",
    password: "DemoPass123!",
    phoneNumber: "+10000000002",
    address: "2 Demo Lane, Example City",
    dateOfBirth: "1992-03-22",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✔  Connected to MongoDB.");

    // ── Clean up previous demo data ───────────────────────────
    const existingEmails = DEMO_USERS.map((u) => u.email);
    const existingUsers = await userModel.find({ email: { $in: existingEmails } });
    const existingUserIds = existingUsers.map((u) => u._id);

    if (existingUserIds.length > 0) {
      const accounts = await accountModel.find({ user: { $in: existingUserIds } });
      const accountIds = accounts.map((a) => a._id);

      // Ledger entries reference transactions — remove in order.
      const txns = await transactionModel.find({
        $or: [{ fromAccount: { $in: accountIds } }, { toAccount: { $in: accountIds } }],
      });
      // Note: ledger model prevents updates but allows creation; we bypass with deleteMany on the model directly.
      if (txns.length > 0) {
        await mongoose.connection
          .collection("ledgers")
          .deleteMany({ transaction: { $in: txns.map((t) => t._id) } });
        await transactionModel.deleteMany({ _id: { $in: txns.map((t) => t._id) } });
      }
      await accountModel.deleteMany({ _id: { $in: accountIds } });
      await userModel.deleteMany({ _id: { $in: existingUserIds } });
      console.log("  ↩  Removed previous demo data.");
    }

    // ── Create demo users ─────────────────────────────────────
    const createdUsers = [];
    for (const userData of DEMO_USERS) {
      const user = new userModel({
        name: userData.name,
        email: userData.email,
        password: userData.password, // pre-save hook hashes this
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        dateOfBirth: userData.dateOfBirth,
      });
      await user.save();
      createdUsers.push(user);
      console.log(`  ✔  Created user: ${user.email} (id: ${user._id})`);
    }

    // ── Create one account per user ───────────────────────────
    const createdAccounts = [];
    for (const user of createdUsers) {
      const account = await accountModel.create({ user: user._id, currency: "INR" });
      createdAccounts.push(account);
      console.log(`  ✔  Created account ${account._id} for ${user.email}`);
    }

    // ── Seed a system user for initial-funds if needed ────────
    let systemUser = await userModel.findOne({ systemUser: true });
    if (!systemUser) {
      // Create a minimal system user (no real credentials)
      systemUser = new userModel({
        name: "System User",
        email: "demo+system@example.com",
        password: "SysPlaceholder999!",
        systemUser: true, // bypasses immutable via direct schema — set before save
      });
      // systemUser field is immutable after creation, so we bypass by setting on the document pre-save.
      await systemUser.save();
      console.log(`  ✔  Created system user (id: ${systemUser._id})`);
    }

    let sysAccount = await accountModel.findOne({ user: systemUser._id, currency: "INR" });
    if (!sysAccount) {
      sysAccount = await accountModel.create({ user: systemUser._id, currency: "INR" });
      console.log(`  ✔  Created system account (id: ${sysAccount._id})`);
    }

    // ── Seed initial funds for Demo Alice ─────────────────────
    const alice = createdUsers[0];
    const aliceAccount = createdAccounts[0];
    const idempotencyKey = `seed-initial-alice-${Date.now()}`;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const txn = (
        await transactionModel.create(
          [{ fromAccount: sysAccount._id, toAccount: aliceAccount._id, amount: 100000, idempotencyKey, status: "PENDING" }],
          { session }
        )
      )[0];

      await mongoose.connection.collection("ledgers").insertMany(
        [
          { account: sysAccount._id, amount: 100000, transaction: txn._id, type: "DEBIT", createdAt: new Date() },
          { account: aliceAccount._id, amount: 100000, transaction: txn._id, type: "CREDIT", createdAt: new Date() },
        ],
        { session }
      );

      await transactionModel.findByIdAndUpdate(txn._id, { status: "COMPLETED" }, { session });
      await session.commitTransaction();
    } catch (txnError) {
      await session.abortTransaction();
      throw txnError;
    } finally {
      session.endSession();
    }

    console.log(`  ✔  Seeded 100,000 INR initial funds into Alice's account.`);

    // ── Print summary ─────────────────────────────────────────
    console.log("\n──── Seed Summary ─────────────────────────────────────");
    for (let i = 0; i < createdUsers.length; i++) {
      console.log(`  User:    ${createdUsers[i].email}`);
      console.log(`  Account: ${createdAccounts[i]._id}`);
      console.log(`  Password: DemoPass123!  (demo only — change immediately)`);
      console.log("");
    }
    console.log("────────────────────────────────────────────────────────\n");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✔  Disconnected from MongoDB.");
  }
}

seed();
