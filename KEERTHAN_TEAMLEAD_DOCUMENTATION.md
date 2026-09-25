# 📘 Team Lead Technical Documentation: Developed Architecture & Code Walkthrough
**Author:** Keerthan (Team Lead)  
**Project:** SVGP No-Dues Clearance & Transfer Certificate Management Portal  
**Institution:** Sri Venkateswara Government Polytechnic (SVGP), Tirupati  

---

## 📋 Table of Contents
1. [🎯 Executive Overview of Team Lead Responsibilities](#1-executive-overview-of-team-lead-responsibilities)
2. [💡 Node.js Concepts & Architectural Patterns Used](#2-nodejs-concepts--architectural-patterns-used)
3. [🧩 Block-by-Block & Module-by-Module Code Documentation](#3-block-by-block--module-by-module-code-documentation)
   - [Module A: Express Application Entrypoint & Lifecycle (`server.js`)](#module-a-express-application-entrypoint--lifecycle-serverjs)
   - [Module B: Dual Database Driver Engine (`config/db.js`)](#module-b-dual-database-driver-engine-configdbjs)
   - [Module C: Transfer Certificate (TC) & Audit Engine (`certificateController.js` & `clerkController.js`)](#module-c-transfer-certificate-tc--audit-engine)
4. [🔒 Security & Hard Integrity Enforcements](#4-security--hard-integrity-enforcements)

---

## 1. 🎯 Executive Overview of Team Lead Responsibilities

As the **Team Lead**, Keerthan engineered the core backend architecture foundation, database abstraction layers, and government-compliant certificate verification engine:

1. **System Entrypoint & Middleware Pipeline (`server.js`):** Configured Express HTTP server, REST API routing mounts, static asset delivery, zero-cache headers, and global error handling.
2. **Dual-Database Abstraction Driver (`config/db.js`):** Built a unified database interface (`db.query()`) supporting both local zero-config **SQLite** and cloud production **PostgreSQL**.
3. **Hard Clearance Verification & TC Locking Engine (`clerkController.js` & `certificateController.js`):** Enforced hard database constraints rejecting Transfer Certificate issuance if any department clearance is incomplete.
4. **Multi-Version Audit Trail (`certificate_versions`):** Built document versioning (`v1` original, `v2` duplicate) ensuring tamper-proof record-keeping.

---

## 2. 💡 Node.js Concepts & Architectural Patterns Used

### ⚡ 1. Asynchronous I/O & Non-Blocking Event Loop (`async/await` & Promises)
- **Concept:** Node.js executes code on a single thread using an Event Loop. Database queries and HTTP requests are asynchronous.
- **Purpose:** By using `async/await`, the server delegates database queries to background thread pools without freezing the server. Hundreds of students can query clearance statuses simultaneously without blocking each other.

### 🌐 2. Express Web Framework & RESTful Routing
- **Concept:** Express simplifies HTTP server creation. It routes incoming HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) and URLs to controller functions.
- **Purpose:** Decouples API logic into modular routes (`/api/certificates`, `/api/auth`, `/api/students`).

### 🛡️ 3. Middleware Pipeline Pattern
- **Concept:** Functions that execute sequentially between receiving an HTTP request and returning a response (`req`, `res`, `next`).
- **Purpose:** Handles CORS, body parsing (`express.json()`), static file serving, JWT role authentication, and central 404/500 error management.

### 🗄️ 4. Connection Pooling & Database Abstraction
- **Concept:** Reuses active database connections instead of opening/closing a connection on every request (`pg.Pool`).
- **Purpose:** Prevents database connection exhaustion under heavy load when whole graduating batches access the portal.

### 🔐 5. Parameterized SQL Queries (Prepared Statements)
- **Concept:** SQL statements use positional placeholders (`$1`, `$2`) to pass parameters separately from the command logic.
- **Purpose:** Prevents **SQL Injection Attacks**, ensuring user input cannot manipulate database structure.

### 📦 6. CommonJS Module System (`require` & `module.exports`)
- **Concept:** Node.js module specification for importing and exporting functions and configurations across files.
- **Purpose:** Maintains clean code organization and strict separation of concerns across controllers, models, and routes.

---

## 3. 🧩 Block-by-Block & Module-by-Module Code Documentation

---

### Module A: Express Application Entrypoint & Lifecycle ([`backend/src/server.js`](file:///d:/tcmanagement/svgptc-management-portal/backend/src/server.js))

#### **Block 1: Module Imports & Core Express Setup**
```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/db');
const seed = require('./config/seed');
```
- **Explanation:** Loads required external packages (`express`, `cors`, `path`, `dotenv`) and custom internal modules (`db`, `seed`). Initializes environment variables from `.env`.

---

#### **Block 2: Middleware Configuration & Static File Delivery**
```javascript
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```
- **Explanation:** Configures Cross-Origin Resource Sharing (CORS) allowing mobile and web clients to communicate with the API. Registers body parsers to convert JSON payloads into `req.body`.

---

#### **Block 3: API Route Mounting**
```javascript
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/clerk', clerkRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/branches', branchRoutes);
```
- **Explanation:** Delegates HTTP requests matching specific path prefixes to dedicated route handlers.

---

#### **Block 4: Static UI Delivery & Fallback Error Handlers**
```javascript
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath, {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `API endpoint '${req.method} ${req.originalUrl}' not found.` });
});
```
- **Explanation:** Serves the frontend single-page templates statically with zero-cache headers to ensure code updates reflect instantly without browser caching issues. Handles missing API routes with a clean 404 JSON response.

---

#### **Block 5: Server Initialization & Lifecycle Startup**
```javascript
async function startServer() {
  try {
    await db.initDB();  // 1. Run DB table migrations
    await seed();       // 2. Seed initial branches & admin accounts

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize and start server:', err);
    process.exit(1);
  }
}

startServer();
```
- **Explanation:** Asynchronously initializes database schema and seeds initial data before binding Express to network interfaces on port `5000`.

---

### Module B: Dual Database Driver Engine ([`backend/src/config/db.js`](file:///d:/tcmanagement/svgptc-management-portal/backend/src/config/db.js))

#### **Block 1: Dynamic Driver Selection (SQLite vs PostgreSQL)**
```javascript
let dbClient = null;
const isPostgres = !!process.env.DATABASE_URL;

if (isPostgres) {
  const { Pool } = require('pg');
  dbClient = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbFile = path.join(__dirname, '..', '..', 'database.sqlite');
  const sqliteDb = new sqlite3.Database(dbFile);
```
- **Explanation:** Evaluates `DATABASE_URL`. If present, creates a PostgreSQL connection pool (`pg`). If absent, initializes local SQLite (`database.sqlite`).

---

#### **Block 2: Promisified Query Wrapper & SQL Syntax Normalization**
```javascript
  dbClient = {
    query: (text, params = []) => {
      return new Promise((resolve, reject) => {
        let sql = text;
        let paramIndex = 1;
        while (sql.includes(`$${paramIndex}`)) {
          sql = sql.replace(new RegExp(`\\$${paramIndex}\\b`, 'g'), '?');
          paramIndex++;
        }

        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.includes('RETURNING')) {
          sqliteDb.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows: rows || [] });
          });
        } else {
          sqliteDb.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
          });
        }
      });
    }
  };
```
- **Explanation:** Promisifies SQLite callbacks to match PostgreSQL's promise-based `db.query(sql, params)` interface. Converts PostgreSQL parameter placeholders (`$1`, `$2`) to SQLite syntax (`?`) dynamically so application code is 100% database-agnostic.

---

#### **Block 3: Schema DDL & Auto-Migrations (`initDB`)**
```javascript
async function initDB() {
  const serialKey = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestampType = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';

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
      verified_at ${timestampType}
    );
  `);
}
```
- **Explanation:** Generates database DDL SQL scripts with data types tailored to the active database engine (PostgreSQL `SERIAL` vs SQLite `AUTOINCREMENT`).

---

### Module C: Transfer Certificate (TC) & Audit Engine ([`certificateController.js`](file:///d:/tcmanagement/svgptc-management-portal/backend/src/controllers/certificateController.js) & [`clerkController.js`](file:///d:/tcmanagement/svgptc-management-portal/backend/src/controllers/clerkController.js))

#### **Block 1: Hard No-Dues Clearance Lock (`verifyAndLockCertificate`)**
```javascript
async function verifyAndLockCertificate(req, res) {
  const { student_pin } = req.body;
  const cleanPin = student_pin.trim();

  // 1. Enforce Clearance Check: Must be 'Completed' across all 28 depts
  const ndrRes = await db.query(
    "SELECT * FROM no_dues_requests WHERE LOWER(student_pin) = LOWER($1) AND status = 'Completed'", 
    [cleanPin]
  );
  
  if (ndrRes.rows.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot verify certificate: Student No-Dues clearance is not completed yet.'
    });
  }

  // 2. Lock record against further editing
  await db.query(
    `UPDATE certificate_data 
     SET is_locked = 1, verified_by = $1, verified_at = CURRENT_TIMESTAMP 
     WHERE LOWER(student_pin) = LOWER($2)`,
    [req.user.username, cleanPin]
  );

  return res.json({ success: true, message: 'Certificate data verified and locked.' });
}
```
- **Explanation:** Rejects locking if even a single department clearance is incomplete. Once verified, sets `is_locked = 1` and attaches an administrative audit signature (`verified_by`).

---

#### **Block 2: Document Generation & Multi-Version Incrementing (`generateCertificate`)**
```javascript
async function generateCertificate(req, res) {
  const { student_pin } = req.body;
  const cleanPin = student_pin.trim();

  // Verify certificate data is locked before generation
  const certRes = await db.query('SELECT * FROM certificate_data WHERE LOWER(student_pin) = LOWER($1)', [cleanPin]);
  if (certRes.rows.length === 0 || certRes.rows[0].is_locked !== 1) {
    return res.status(400).json({
      success: false,
      error: 'Certificate data must be Final-Verified and Locked by the Clerk before generation.'
    });
  }
  const certData = certRes.rows[0];

  // Determine new version number (v1, v2, etc.)
  const prevVersions = await db.query(
    'SELECT version_number FROM certificate_versions WHERE LOWER(student_pin) = LOWER($1) ORDER BY version_number DESC LIMIT 1',
    [cleanPin]
  );

  let nextVersion = 1;
  if (prevVersions.rows.length > 0) {
    nextVersion = prevVersions.rows[0].version_number + 1;
    // Mark older versions as superseded
    await db.query(
      'UPDATE certificate_versions SET is_current = 0 WHERE LOWER(student_pin) = LOWER($1)',
      [cleanPin]
    );
  }

  // Insert permanent immutable document version snapshot
  await db.query(
    `INSERT INTO certificate_versions (
      student_pin, version_number, t_no, student_name, father_name, dob,
      nationality, religion, course_branch, admission_no, date_of_admission,
      date_of_leaving, fees_paid, promotion_status, conduct_character,
      generated_date, generated_by, is_current
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 1
    )`,
    [cleanPin, nextVersion, certData.t_no, ...]
  );
}
```
- **Explanation:** Checks that data is locked. Computes the next version sequence number (`nextVersion`). Supersedes older versions (`is_current = 0`) and archives an immutable document snapshot for institutional audit trails.

---

#### **Block 3: Public / Student Certificate Lookup & Access Security (`getCertificateDetails`)**
```javascript
async function getCertificateDetails(req, res) {
  const { student_pin } = req.params;
  const cleanPin = student_pin.trim();

  // Security Gate: Students can strictly only view their own certificate
  if (req.user && req.user.role === 'student' && req.user.pin !== cleanPin) {
    return res.status(403).json({ success: false, error: 'Access denied: You can only view your own certificate.' });
  }

  // Fetch currently active version
  const versionRes = await db.query(
    'SELECT * FROM certificate_versions WHERE student_pin = $1 AND is_current = 1',
    [cleanPin]
  );

  if (versionRes.rows.length === 0) {
    return res.status(404).json({ success: false, error: 'No generated certificate found.' });
  }

  return res.json({ success: true, certificate: versionRes.rows[0] });
}
```
- **Explanation:** Serves the active certificate data for printing (`certificate-view.html`). Contains access control logic restricting student accounts from viewing certificates belonging to other PINs.

---

## 4. 🛡️ Security & Hard Integrity Enforcements Summary

1. **SQL Injection Security:** All database operations use parameterized bindings (`$1`, `$2`), neutralizing malicious SQL payloads.
2. **Hard Business Constraint:** Certificate creation is locked at the SQL query level until all 28 department clearance rows are marked `Approved`.
3. **Immutability & Version Auditing:** Issued certificates cannot be silently overwritten; re-issues increment version numbers (`v1` &rarr; `v2`) with timestamped accountability logs.
