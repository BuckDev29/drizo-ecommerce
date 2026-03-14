const mysql = require("mysql2");

const connectionString = process.env.DATABASE_URL;

const pool = mysql.createPool(connectionString);

module.exports = pool.promise();
