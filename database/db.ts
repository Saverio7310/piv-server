import { Pool } from 'pg'

const pool = new Pool({
    user: 'saverioperrone',
    host: '192.168.1.147',
    database: 'prezziinvista',
    password: 'modtoS-mudtuz-2gicnu',
    port: 5432,
    connectionTimeoutMillis: 2000
});

export default pool;