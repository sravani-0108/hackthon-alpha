import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import config from '../config';

async function runMigrations(): Promise<void> {
  try {
    const client = new Client({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      ssl: false,
    });

    await client.connect();
    console.log(`Connected to database: ${config.db.host}/${config.db.name}`);

    const schemaPath = path.join(__dirname, '../docs/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);

    await client.end();
    console.log('Database schema migrated successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Migration failed:', message);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}

export default runMigrations;
