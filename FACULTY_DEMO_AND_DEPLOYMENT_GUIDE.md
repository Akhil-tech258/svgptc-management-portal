# Sri Venkateswara Government Polytechnic (SVGP), Tirupati
## Student No-Dues & Transfer Certificate Generator System
### Complete Faculty Demonstration & Production Deployment Guide

---

## 🏛️ 1. Project Overview & Architecture

This system is an institutional clearance and Transfer Certificate (TC) generator built specifically for **Sri Venkateswara Government Polytechnic (SVGP), Tirupati**.

### Core Modules:
1. **Student Portal (`index.html`)**:
   - Case-insensitive self-registration (`PIN` + `Student Name`).
   - One-click No-Dues clearance application.
   - Real-time status tracker across all 8 clearance sections with contact directives.
   - Strict **20-Hour Re-Notification Rate Limit** (prevents faculty notification spam).
   - View / Download verified digital Transfer Certificate.

2. **Faculty Incharge Portal (`faculty-login.html` & `faculty.html`)**:
   - Dedicated dashboard for each clearance department/lab.
   - View pending clearance requests.
   - Record itemized student dues with free-text descriptions.
   - Clear individual dues or Clear All Dues.
   - "✓ Mark Completed" button to grant formal department clearance.

3. **Clerk Administrative Portal (`clerk-login.html` & `clerk.html`)**:
   - Real-time KPI statistics dashboard (Students, Dues, Active Requests, Branches).
   - Bulk Excel Import with pre-validation & single student manual enrollment.
   - Complete CRUD for the 9 SVGP Diploma branches.
   - Complete CRUD for Clearance Roles (Common vs Branch-specific).
   - Creation and credential management for Faculty Incharge accounts.
   - Double-Lock Certificate Verification: Fill certificate-time fields, lock record, and generate versioned TCs (`v1`, `v2`, ...).
   - 1-Click "Purge All Student Data" maintenance tool.

---

## 🎓 2. SVGP Official Structure

### Official 9 Diploma Branches:
1. `CIVIL` — Civil Engineering
2. `MECH` — Mechanical Engineering
3. `EEE` — Electrical & Electronics Engineering
4. `ECE` — Electronics & Communication Engineering
5. `CME` — Computer Engineering
6. `BME` — Biomedical Engineering
7. `CHE` — Chemical Engineering
8. `ECE-II` — Electronics & Communication Engg (Shift II)
9. `PHARM` — Pharmacy

### Official 8 Clearance Roles:
1. `Library` (Online)
2. `Accounts` (Online)
3. `Scholarship` (Online)
4. `Hostel` (Online)
5. `Physical Director` (Online)
6. `Physics Lab` (Physical Clearance)
7. `Chemistry Lab` (Physical Clearance)
8. `NSS/NCC` (Online)

---

## ⚡ 3. How to Run Locally (For Faculty Demonstration)

### Prerequisites:
- [Node.js](https://nodejs.org/) (version 18 or newer installed)

### Step 1: Install Dependencies
Open PowerShell or Terminal in the project root:
```bash
cd backend
npm install
```

### Step 2: Seed the Clean Database
```bash
node src/config/seed.js
```
*(This sets up the fresh database with 0 students, 8 departments, 9 branches, and the Clerk account).*

### Step 3: Start the Backend Server
```bash
node src/server.js
```
The server will start at: `http://localhost:5000`

### Step 4: Open the Website in Browser
- **Student Portal**: Open `frontend/index.html` (or `http://localhost:5000/index.html`)
- **Faculty Portal**: Open `frontend/faculty-login.html` (or `http://localhost:5000/faculty-login.html`)
- **Clerk Portal**: Open `frontend/clerk-login.html` (or `http://localhost:5000/clerk-login.html`)
  - **Username**: `clerk@svgp`
  - **Password**: `Clerk@1957`

---

## 🌐 4. How to Deploy Online (When Ready)

When you are ready to deploy to the cloud (e.g., Render, Railway, AWS, or VPS):

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy release"
   git push -u origin main
   ```
2. **Deploy on Render (Web Service)**:
   - Connect your GitHub repo (`svgptc-management-portal`).
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
   - Environment Variables:
     - `NODE_ENV=production`
     - `PORT=5000`
     - `JWT_SECRET=your-secure-random-64-character-hex-string`
     - `CLERK_USERNAME=clerk@svgp`
     - `CLERK_PASSWORD=Clerk@1957`
     - `DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require` (Optional: if using PostgreSQL; otherwise SQLite will be used automatically).
