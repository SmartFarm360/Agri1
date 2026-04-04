const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const defaultLocalConnection = 'postgresql://postgres:postgres@localhost:5432/maati_ai';
const connectionString =
  process.env.DATABASE_URL ||
  process.env.LOCAL_DATABASE_URL ||
  defaultLocalConnection;

const pool = new Pool({
  connectionString,
  ssl: false, // local default (set DATABASE_URL/LOCAL_DATABASE_URL if you need SSL)
});

pool.connect()
  .then(() => console.log('✅ PostgreSQL Connected'))
  .catch((err) => {
    console.error('❌ PostgreSQL connection error:', err.message);
    process.exit(1);
  });

module.exports = pool;
