import { Pool } from 'pg'

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_DATABASE,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : 5432,
    connectionTimeoutMillis: process.env.DATABASE_TIMEOUT ? parseInt(process.env.DATABASE_TIMEOUT) : 2000,
});

export default pool;