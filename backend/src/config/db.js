const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbClient = null;
const isPostgres = !!process.env.DATABASE_URL;

if (isPostgres) {
  const { Pool } = require('pg');
  dbClient = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  console.log('Connected to PostgreSQL database');
} else {
  // Use SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  const dbFile = path.join(__dirname, '..', '..', 'database.sqlite');
  const sqliteDb = new sqlite3.Database(dbFile);
  console.log(`Connected to local SQLite database at ${dbFile}`);

  // Promisify SQLite to have uniform query() interface
  dbClient = {
    query: (text, params = []) => {
      return new Promise((resolve, reject) => {
        // Convert $1, $2, ... to ? for SQLite
        let sql = text;
        let paramIndex = 1;
        while (sql.includes(`$${paramIndex}`)) {
          sql = sql.replace(new RegExp(`\\$${paramIndex}\\b`, 'g'), '?');
          paramIndex++;
        }

        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || trimmed.includes('RETURNING')) {
          sqliteDb.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows: rows || [] });
          });
        } else {
          sqliteDb.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({
              rows: [],
              rowCount: this.changes,
              lastID: this.lastID
            });
          });
        }
      });
    }
  };
}

async function initDB() {
  const serialKey = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestampType = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';

  // Create tables in sequence
  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS branches (
      id ${serialKey},
      code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1
    );
  `);

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id ${serialKey},
      name VARCHAR(100) UNIQUE NOT NULL,
      type VARCHAR(20) DEFAULT 'Online',
      branch_code VARCHAR(50) DEFAULT 'ALL',
      is_active INTEGER DEFAULT 1
    );
  `);

  // Migration for existing tables without branch_code
  try {
    await dbClient.query(`ALTER TABLE departments ADD COLUMN branch_code VARCHAR(50) DEFAULT 'ALL'`);
  } catch (e) {
    // Column already exists
  }

  // Migration for dues amount
  try {
    await dbClient.query(`ALTER TABLE dues ADD COLUMN amount VARCHAR(50) DEFAULT '0'`);
  } catch (e) {
    // Column already exists
  }

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS clerks (
      id ${serialKey},
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      passkey_id TEXT,
      created_at ${timestampType}
    );
  `);

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS faculty_accounts (
      id ${serialKey},
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      department_id INTEGER,
      department_name VARCHAR(100) NOT NULL,
      branch_code VARCHAR(50) DEFAULT 'ALL',
      is_active INTEGER DEFAULT 1,
      created_at ${timestampType}
    );
  `);

  // Migration for faculty_accounts branch_code
  try {
    await dbClient.query(`ALTER TABLE faculty_accounts ADD COLUMN branch_code VARCHAR(50) DEFAULT 'ALL'`);
  } catch (e) {
    // Column already exists
  }

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS students_master (
      pin VARCHAR(50) PRIMARY KEY,
      admission_no VARCHAR(50) NOT NULL,
      student_name VARCHAR(150) NOT NULL,
      father_name VARCHAR(150) NOT NULL,
      dob VARCHAR(20) NOT NULL,
      nationality VARCHAR(50) NOT NULL,
      religion VARCHAR(50) NOT NULL,
      course_branch VARCHAR(100) NOT NULL,
      date_of_admission VARCHAR(20) NOT NULL,
      created_at ${timestampType}
    );
  `);

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS students_registered (
      pin VARCHAR(50) PRIMARY KEY,
      student_name VARCHAR(150) NOT NULL,
      course_branch VARCHAR(100) NOT NULL,
      registered_at ${timestampType}
    );
  `);

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS no_dues_requests (
      id ${serialKey},
      student_pin VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'Pending',
      submitted_at ${timestampType},
      completed_at ${timestampType}
    );
  `);

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS department_clearances (
      id ${serialKey},
      request_id INTEGER NOT NULL,
      student_pin VARCHAR(50) NOT NULL,
      department_id INTEGER NOT NULL,
      department_name VARCHAR(100) NOT NULL,
      status VARCHAR(20) DEFAULT 'Pending',
      approved_by VARCHAR(100),
      approved_at ${timestampType},
      last_notified_at ${timestampType}
    );
  `);

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS dues (
      id ${serialKey},
      department_id INTEGER NOT NULL,
      student_pin VARCHAR(50) NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'Active',
      created_by VARCHAR(100),
      created_at ${timestampType},
      cleared_at ${timestampType}
    );
  `);

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS certificate_data (
      student_pin VARCHAR(50) PRIMARY KEY,
      t_no VARCHAR(20) NOT NULL,
      date_of_leaving VARCHAR(100),
      fees_paid VARCHAR(10) DEFAULT 'No',
      promotion_status TEXT,
      conduct_character VARCHAR(100) DEFAULT 'Good',
      is_locked INTEGER DEFAULT 0,
      verified_by VARCHAR(100),
      verified_at ${timestampType},
      updated_at ${timestampType}
    );
  `);

  await dbClient.query(`
    CREATE TABLE IF NOT EXISTS certificate_versions (
      id ${serialKey},
      student_pin VARCHAR(50) NOT NULL,
      version_number INTEGER NOT NULL,
      t_no VARCHAR(20) NOT NULL,
      student_name VARCHAR(150) NOT NULL,
      father_name VARCHAR(150) NOT NULL,
      dob VARCHAR(20) NOT NULL,
      nationality VARCHAR(50) NOT NULL,
      religion VARCHAR(50) NOT NULL,
      course_branch VARCHAR(100) NOT NULL,
      admission_no VARCHAR(50) NOT NULL,
      date_of_admission VARCHAR(20) NOT NULL,
      date_of_leaving VARCHAR(100) NOT NULL,
      fees_paid VARCHAR(10) NOT NULL,
      promotion_status TEXT NOT NULL,
      conduct_character VARCHAR(100) NOT NULL,
      generated_date VARCHAR(20) NOT NULL,
      generated_by VARCHAR(100) NOT NULL,
      is_current INTEGER DEFAULT 1,
      created_at ${timestampType}
    );
  `);

  console.log('Database tables verified/initialized.');
}

module.exports = {
  query: (text, params) => dbClient.query(text, params),
  initDB,
  isPostgres
};
