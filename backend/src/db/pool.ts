// pool.ts
//
// One shared MySQL connection pool (opening a new connection per request is
// slow and can exhaust the DB's connection limit).
//
// Time handling: every connection is switched to UTC and the driver reads and
// writes UTC, so a DATETIME stored by one machine is read back as the same
// instant on another. DATE columns are returned as plain 'YYYY-MM-DD' strings,
// and DECIMAL columns as JS numbers (not strings).

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
  dateStrings: ['DATE'],
  decimalNumbers: true,
});

// Make the DB session clock UTC too (CURRENT_TIMESTAMP / NOW() defaults).
(pool as any).pool.on('connection', (conn: any) => {
  conn.query("SET time_zone = '+00:00'");
});

/** Runs `work` inside a transaction; commits on success, rolls back on any error. */
export async function withTransaction<T>(work: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
