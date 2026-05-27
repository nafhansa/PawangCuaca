require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} migration files`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Running migration: ${file}`);
    try {
      await pool.query(sql);
      console.log(`✅ ${file} completed`);
    } catch (err) {
      const alreadyExists = ['42P07', '42701', '42710'].includes(err.code);
      if (alreadyExists) {
        console.log(`⏭️  ${file} already exists, skipping`);
      } else {
        console.error(`❌ ${file} failed:`, err.message);
        process.exit(1);
      }
    }
  }

  console.log('All migrations completed');
  await pool.end();
}

runMigrations();
