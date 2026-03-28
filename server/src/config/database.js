import pkg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

// Resolve .env from the server root regardless of CWD
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const { Pool } = pkg;

// Supabase pooler & direct connections both need SSL in production
// or when connecting via pooler.supabase.com / supabase.co hostnames.
const connectionString = process.env.DATABASE_URL || '';
const isSupabase = connectionString.includes('supabase');
const useSSL = process.env.NODE_ENV === 'production' || isSupabase;

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 5,                     // Stay well under Supabase free-tier pool_size (15)
  idleTimeoutMillis: 20_000,  // Close idle clients after 20s
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: true,      // Let serverless functions exit cleanly
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
