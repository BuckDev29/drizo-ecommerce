const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function initDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    });

    const dbName = process.env.DB_NAME;

    console.log("Creando base de datos si no existe...");

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);

    await connection.query(`USE \`${dbName}\``);

    const schemaPath = path.join(
      __dirname,
      "../database/sql/feature_setup.sql",
    );

    const sql = fs.readFileSync(schemaPath, "utf8");

    console.log("Ejecutando schema inicial...");

    await connection.query(sql, [], { multipleStatements: true });
    console.log("Base de datos inicializada correctamente");

    await connection.end();
  } catch (error) {
    console.error("Error inicializando DB:", error);
  }
}

initDatabase();
