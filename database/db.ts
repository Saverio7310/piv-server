import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: process.env.DATABASE_CONN_TIMEOUT ? parseInt(process.env.DATABASE_CONN_TIMEOUT) : 10000,
    idleTimeoutMillis: process.env.DATABASE_IDLE_TIMEOUT ? parseInt(process.env.DATABASE_IDLE_TIMEOUT) : 30000,
    max: 50
});

export default pool;