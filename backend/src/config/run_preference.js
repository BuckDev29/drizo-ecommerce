require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runSetup() {
  try {
    const sqlPath = path.join(__dirname, 'add_preference.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = sql.split(';').filter((stmt) => stmt.trim() !== '');

    for (const statement of statements) {
      await db.query(statement);
      console.log('Executed statement successfully.');
    }
    
    console.log('Setup complete!');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
       console.log('Column already exists, ignoring.');
    } else {
       console.error('Error during setup:', err);
    }
  } finally {
    process.exit();
  }
}

runSetup();
