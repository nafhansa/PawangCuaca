const bcrypt = require('bcryptjs');
const { pool } = require('./src/db/pool');
const logger = require('./src/utils/logger');

const SALT_ROUNDS = 12;

async function seed() {
  try {
    const existingAdmin = await pool.query(
      "SELECT id FROM users WHERE email = 'admin@pawangcuaca.space'"
    );
    if (existingAdmin.rows.length > 0) {
      logger.info('SuperAdmin sudah ada, skip seeding.');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, status, pawang_level)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, role, status`,
      ['admin', 'admin@pawangcuaca.space', passwordHash, 'superadmin', 'approved', 'legenda']
    );

    logger.info('SuperAdmin created:');
    logger.info(`  Username: admin`);
    logger.info(`  Email:    admin@pawangcuaca.space`);
    logger.info(`  Password: admin123`);
    logger.info(`  ⚠️  Ganti password setelah login pertama!`);
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
