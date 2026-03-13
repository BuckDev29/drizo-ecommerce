const db = require("../config/db");

async function run() {
  try {
    console.log("Adding image_url column to categories table...");
    await db.query(
      "ALTER TABLE categories ADD COLUMN image_url VARCHAR(255) NULL",
    );
    console.log("Column added successfully!");
  } catch (error) {
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("Column image_url already exists.");
    } else {
      console.error("Error adding column:", error);
    }
  } finally {
    process.exit(0);
  }
}

run();
