import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { pool } from '../db/index.js';

async function main() {
  const hash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [env.ADMIN_EMAIL]);
  let userId = existing.rows[0]?.id;

  if (!userId) {
    const inserted = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, 'admin', TRUE)
       RETURNING id`,
      [env.ADMIN_NAME, env.ADMIN_EMAIL, env.ADMIN_PHONE, hash]
    );
    userId = inserted.rows[0].id;
  }

  await pool.query(
    `INSERT INTO pricing_rules (city_code, base_fare, per_km, per_min, minimum_fare, platform_commission_pct)
     SELECT 'default', 4.50, 2.10, 0.40, 10.00, 20.00
     WHERE NOT EXISTS (SELECT 1 FROM pricing_rules WHERE city_code = 'default' AND active = TRUE)`
  );

  console.log(`Seed finalizada. Admin: ${env.ADMIN_EMAIL} (${userId})`);
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
