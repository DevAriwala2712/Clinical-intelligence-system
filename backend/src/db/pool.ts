// pool.ts
//
// WHAT: creates one shared MySQL "connection pool" when the server starts.
// WHY: opening a brand-new database connection for every single API request
//      is slow and can exhaust the database's connection limit. A pool keeps
//      a small number of connections open and hands them out to whichever
//      request needs one, then takes them back when the query finishes.
// HOW IT'S USED: every controller file does `import { pool } from '../db/pool'`
//      and then `await pool.query(sql, params)`.

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // loads variables from the .env file into process.env

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // if all connections are busy, wait instead of erroring
  connectionLimit: 10,      // max number of simultaneous connections in the pool
});
