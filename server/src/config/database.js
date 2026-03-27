import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

// Resolve .env from the server root regardless of CWD
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const { Pool } = pkg;

// Supabase direct connections (port 5432) work without SSL from local dev.
// Use SSL only in production or when the URL contains "supabase.co" via pooler port 6543.
const connectionString = process.env.DATABASE_URL || '';
const useSSL = process.env.NODE_ENV === 'production' || connectionString.includes(':6543');

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  allowExitOnIdle: false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
