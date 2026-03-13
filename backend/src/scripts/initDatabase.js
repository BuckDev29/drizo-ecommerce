const fs = require("fs");
const path = require("path");
const db = require("./db");

async function initDatabase() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "database", "init.sql"),
      "utf8",
    );

    await db.query(sql);
    console.log("Database initialized");
  } catch (err) {
    console.error("Database init error:", err);
  }
}

module.exports = initDatabase;
