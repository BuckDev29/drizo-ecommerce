const fs = require("fs");
const path = require("path");
const db = require("../config/db");

async function runMigrations() {
  try {
    const migrationsPath = path.join(__dirname, "../database/sql");

    const files = fs.readdirSync(migrationsPath);

    const migrationFiles = files.filter(
      (file) => file !== "feature_setup.sql" && file.endsWith(".sql"),
    );

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsPath, file);

      console.log(`Ejecutando migración: ${file}`);

      const sql = fs.readFileSync(filePath, "utf8");

      await db.query(sql);
    }

    console.log("Migraciones completadas");

    process.exit();
  } catch (error) {
    console.error("Error en migraciones:", error);
  }
}

runMigrations();
