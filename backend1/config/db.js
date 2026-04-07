const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const hasDiscretePgConfig = Boolean(
  process.env.PG_HOST ||
  process.env.PG_USER ||
  process.env.PG_DATABASE ||
  process.env.PG_PASSWORD ||
  process.env.PG_PORT
);

const defaultLocalConfig = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "maati_ai",
};

const defaultLocalConnection = "postgresql://postgres:postgres@localhost:5432/maati_ai";

const poolConfig = hasDiscretePgConfig
  ? {
      host: process.env.PG_HOST || defaultLocalConfig.host,
      port: Number(process.env.PG_PORT || defaultLocalConfig.port),
      user: process.env.PG_USER || defaultLocalConfig.user,
      password: process.env.PG_PASSWORD || defaultLocalConfig.password,
      database: process.env.PG_DATABASE || defaultLocalConfig.database,
      ssl: false,
    }
  : {
      connectionString:
        process.env.DATABASE_URL ||
        process.env.LOCAL_DATABASE_URL ||
        defaultLocalConnection,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(poolConfig);
const dbTarget = hasDiscretePgConfig
  ? `${poolConfig.user}@${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`
  : poolConfig.connectionString;

pool.connect()
  .then(() => console.log(`PostgreSQL Connected: ${dbTarget}`))
  .catch((err) => {
    console.error("PostgreSQL connection error:", err.message);
    process.exit(1);
  });

module.exports = pool;
