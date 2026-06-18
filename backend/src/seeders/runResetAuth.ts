import { Client } from 'pg';
import bcrypt from 'bcrypt';
import config from '../config';

const DEMO_PASSWORD = 'Manager@123';
const DEMO_USERS = ['manager@bank.com', 'admin@bank.com'];

async function resetAuth(): Promise<void> {
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });

  try {
    await client.connect();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    for (const email of DEMO_USERS) {
      const result = await client.query(
        `UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id`,
        [passwordHash, email]
      );
      if (result.rowCount) {
        console.log(`  ✓ Reset password for ${email}`);
      } else {
        await client.query(
          `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
          [
            email === 'manager@bank.com' ? 'Rajesh Kumar' : 'Admin User',
            email,
            passwordHash,
            email === 'manager@bank.com' ? 'bank_manager' : 'admin',
          ]
        );
        console.log(`  + Created ${email}`);
      }
    }

    console.log(`\n✅ Demo login ready: manager@bank.com / ${DEMO_PASSWORD}`);
  } catch (error) {
    console.error('Auth reset failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  resetAuth();
}

export default resetAuth;
