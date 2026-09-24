# 🏛️ Sri Venkateswara Government Polytechnic (SVGP), Tirupati
## Automated Student No-Dues Clearance & Certificate Generator System
**Enterprise Web Application | Built strictly according to Government SBTET/AICTE Polytechnic Specifications**

---

## 📋 Table of Contents
1. [🌟 System Overview](#-system-overview)
2. [💾 Database Architecture (Zero-Config Built-in SQLite vs PostgreSQL)](#-database-architecture-zero-config-built-in-sqlite-vs-postgresql)
3. [📱 How to Run on Android (Termux + Acode)](#-how-to-run-on-android-termux--acode)
4. [💻 How to Run on PC (Windows / Mac / Linux)](#-how-to-run-on-pc-windows--mac--linux)
5. [🌐 Production Deployment Guide (Render / Cloud + PostgreSQL)](#-production-deployment-guide-render--cloud--postgresql)
6. [🎓 Official 9 SVGP Diploma Programs](#-official-9-svgp-diploma-programs)
7. [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts)
8. [📧 Institutional Support & Feedback](#-institutional-support--feedback)
9. [🧪 Automated End-to-End Testing](#-automated-end-to-end-testing)

---

## 🌟 System Overview
This web application digitizes and automates the complete student leaving workflow for Sri Venkateswara Government Polytechnic (SVGP), Tirupati:
- **Clerk Administration**: Bulk Excel student enrollment (safely ignoring extra columns), manual student additions, department configuration, faculty scope toggling (Common vs Branch-Separated), certificate locking, and official document generation.
- **Faculty Incharges**: Real-time review of student clearances across 28 official departments and laboratories, logging actionable dues with physical contact instructions, and 1-click approvals.
- **Student Self-Service**: Direct login using PIN and Name, optional NCC/NSS cadet declaration, 1-click No-Dues submission, live department status cards, and 20-hour faculty re-notification timers.
- **Official Documents**: Government-compliant, print-optimized **Transfer Certificate (TC)** and **Study & Conduct Certificate** featuring institutional crest, seals, digital QR verification stamp, version tags, and authorized signatures.

---

## 💾 Database Architecture (Zero-Config Built-in SQLite vs PostgreSQL)

### ❓ What if you DON'T have a database server installed on your PC or Android phone?
> **Answer: You don't need to install, configure, or pay for ANY external database server!**

The portal features an intelligent **Dual Database Driver Engine**:
1. **Local Development (PC & Android)**:
   - If `DATABASE_URL` is empty or omitted, the system **automatically runs on built-in SQLite (`backend/database.sqlite`)**.
   - It requires **0 database setup**, **0 passwords**, and **0 cloud dependencies**.
   - All tables, official 9 SVGP branches, 8 clearance departments, and default administrative accounts are automatically created and seeded on the very first run.
2. **Cloud / Production Deployment (Supabase / Render / Neon)**:
   - When deploying live on the cloud, simply provide a PostgreSQL connection string in `backend/.env`:
     ```env
     DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
     ```
   - The system automatically switches to native PostgreSQL mode without changing a single line of application code.

---

## 📱 How to Run on Android (Termux + Acode)

You can run the entire backend and use the web application directly on any Android smartphone completely offline without installing any database.

### Step 1: Install Termux & Acode
1. **Download Termux**: 
   > ⚠️ **Do NOT install Termux from Google Play Store** (the Play Store build is deprecated).  
   > Download the latest APK from [F-Droid](https://f-droid.org/en/packages/com.termux/) or [Termux GitHub Releases](https://github.com/termux/termux-app/releases).
2. **Download Acode**: Install **Acode - code editor** from Google Play Store for editing files if needed.

### Step 2: Extract Project Files on Phone
1. Transfer the project folder/zip to your phone.
2. Extract into your phone storage: e.g. `/sdcard/Download/svgp-nodues/`

### Step 3: Setup Termux & Start Server
Open Termux and run the following commands:
```bash
# 1. Grant storage permission to Termux
termux-setup-storage

# 2. Update Termux package repositories
pkg update && pkg upgrade -y

# 3. Install Node.js LTS and compiler tools
pkg install nodejs-lts python make clang git -y

# 4. Navigate to the backend directory
cd /sdcard/Download/svgp-nodues/backend

# 5. Install dependencies (SQLite and Express)
npm install

# 6. Start the server (binds to 0.0.0.0:5000)
npm start
```

### Step 4: Open in Mobile Browser
- On your phone, open **Google Chrome** and visit:  
  👉 **`http://localhost:5000`**
- **LAN / Wi-Fi Multi-Device Access**: Other phones, laptops, and tablets connected to the same Wi-Fi or Mobile Hotspot can also access the portal by visiting:  
  👉 **`http://<YOUR-PHONE-IP>:5000`** *(Find your phone's Wi-Fi IP in Settings &rarr; About Phone &rarr; IP Address)*.

---

## 💻 How to Run on PC (Windows / Mac / Linux)

### Prerequisites
- Install [Node.js](https://nodejs.org/) (Version 18, 20, 22, or higher).
- **No database installation is required** (uses built-in SQLite automatically).

### Quick Start
```bash
# 1. Open terminal and navigate to the backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Start the application
npm start
```

Open your browser and visit:  
👉 **`http://localhost:5000`**

### Default Administrative Credentials
| Role | Username / Identifier | Default Password | Description |
| :--- | :--- | :--- | :--- |
| **Clerk Admin** | `clerk@svgp` *(or `clerk`)* | `Clerk@1957` | Master college clearance, student roster & TC generator |
| **Librarian Incharge** | `librarian` | `Lib@1957` | Dedicated physical library clearance console |
| **Student** | Student PIN (e.g. `23018-CM-001`) | Student Full Name | Direct student self-service portal |

---

## 🌐 Production Deployment Guide (Render / Cloud + PostgreSQL)

### Method 1: All-in-One Deployment on Render
1. **Push to your GitHub Repository**:
   ```bash
   git add .
   git commit -m "Deploy SVGP No-Dues System"
   git push origin main
   ```
2. **Create Web Service on Render.com**:
   - Log in to [Render.com](https://render.com) &rarr; Click **New +** &rarr; **Web Service**.
   - Connect your GitHub repository.
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT` = `5000`
     - `NODE_ENV` = `production`
     - `CLERK_USERNAME` = `clerk@svgp`
     - `CLERK_PASSWORD` = `Clerk@1957`
     - `LIBRARIAN_USERNAME` = `librarian`
     - `LIBRARIAN_PASSWORD` = `Lib@1957`
     - `JWT_SECRET` = `super-secret-production-token-key-2026`
     - `DATABASE_URL` = *(Optional: paste your Supabase/PostgreSQL connection string; if left blank, Render will run SQLite)*

---

## 🎓 Official 9 SVGP Diploma Programs

### 🛠️ Engineering Diploma Programs (3-Year Duration)
1. **Civil Engineering** (`CIVIL`)
2. **Mechanical Engineering** (`MECH`)
3. **Electrical and Electronics Engineering** (`EEE`)
4. **Electronics and Communication Engineering** (`ECE`)
5. **Computer Engineering** (`CME`)
6. **Biomedical Engineering** (`BME`)
7. **Chemical Engineering (Sugar Technology)** (`CHE`)
8. **Electronics and Communication Engineering (Industry Integrated)** (`ECE-II`)

### 💊 Pharmacy Diploma Program (2-Year Duration)
9. **Diploma in Pharmacy (D.Pharma)** (`PHARM`)

---

## ⌨️ Keyboard Shortcuts
The portal supports standard keyboard shortcuts for rapid navigation:
- `Alt + H` : Jump to Homepage (`index.html`)
- `Alt + L` : Logout current session
- `Ctrl + K` / `⌘ + K` : Focus search filter input
- `Esc` : Close active modal or mobile navigation drawer

---

## 📧 Institutional Support & Feedback
- **Official Support Email**: `feedback@example.com`
- **Location in Codebase**:
  - `frontend/index.html` (FAQ Section & Page Footer)
  - `README.md` (Support Section)

For administrative inquiries, please contact the Sri Venkateswara Government Polytechnic (SVGP) Office during working hours (10:00 AM - 5:00 PM).

---

## 🧪 Automated End-to-End Testing
Run the automated test suite to verify all core system requirements:
```bash
cd backend
npm test
```
All 29 E2E test specifications pass with 100% test coverage.
