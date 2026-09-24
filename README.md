# 🏛️ Sri Venkateswara Government Polytechnic (SVGP), Tirupati
## Automated Student No-Dues Clearance & Certificate Generator System
**Enterprise Web Application | Built strictly according to Government SBTET/AICTE Polytechnic Specifications**

---

## 📋 Table of Contents
1. [🌟 System Overview](#-system-overview)
2. [🔄 How the System Works in Real Life (End-to-End Walkthrough)](#-how-the-system-works-in-real-life-end-to-end-walkthrough)
3. [✨ Comprehensive Feature Matrix](#-comprehensive-feature-matrix)
4. [💾 Database Architecture (Zero-Config Built-in SQLite vs PostgreSQL)](#-database-architecture-zero-config-built-in-sqlite-vs-postgresql)
5. [📱 How to Run on Android (Termux + Acode)](#-how-to-run-on-android-termux--acode)
6. [💻 How to Run on PC (Windows / Mac / Linux)](#-how-to-run-on-pc-windows--mac--linux)
7. [🌐 Production Deployment Guide (Render / Cloud + PostgreSQL)](#-production-deployment-guide-render--cloud--postgresql)
8. [⏰ 24/7 Automated Supabase Keep-Alive (GitHub Actions)](#-247-automated-supabase-keep-alive-github-actions)
9. [🎓 Official 9 SVGP Diploma Programs](#-official-9-svgp-diploma-programs)
10. [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts)
11. [📧 Institutional Support & Feedback](#-institutional-support--feedback)
12. [🧪 Automated End-to-End Testing](#-automated-end-to-end-testing)

---

## 🌟 System Overview
This web application digitizes and automates the complete student leaving workflow for **Sri Venkateswara Government Polytechnic (SVGP), Tirupati** (Established 1957, SBTET Code: 018):
- **Clerk Administration**: Bulk Excel student enrollment (safely ignoring extra columns), enrolled student master directory, branch and department configuration, faculty scope toggling (Common vs Branch-Separated), certificate locking, and official document generation.
- **Faculty Incharges**: Real-time review of student clearances across 28 official departments and laboratories, logging actionable dues with physical contact instructions, and 1-click approvals.
- **Student Self-Service**: Direct login using PIN and Name, optional NCC/NSS cadet declaration, 1-click No-Dues submission, live department status cards, and 20-hour faculty re-notification timers.
- **Official Documents**: Government-compliant, print-optimized **Transfer Certificate (TC)** and **Study & Conduct Certificate** featuring institutional crest, seals, digital QR verification stamp, version tags, and authorized signatures.

---

## 🔄 How the System Works in Real Life (End-to-End Walkthrough)

### 📖 The Real-World Scenario:
Meet **K. Ramesh**, a final-year Diploma student in **Mechanical Engineering (MECH)** at SVGP Tirupati with Permanent PIN **`23018-M-045`**. Ramesh is completing his final semester and needs his **Transfer Certificate (TC)** and **Study & Conduct Certificate** to join an Engineering College for B.Tech lateral entry.

Here is the exact step-by-step institutional journey from batch enrollment to certificate printing:

```mermaid
flowchart TD
    A["1. Clerk Imports Batch Excel Roster\n(Extra columns ignored, PIN & details enrolled)"] --> B["2. Ramesh Logs In to Student Portal\n(PIN: 23018-M-045 + Name: K. Ramesh)"]
    B --> C["3. Ramesh Declares Cadet Status & Submits No-Dues\n(Selects 'Non-Cadet' or 'NCC Cadet')"]
    C --> D["4. Departments Review Clearances Online"]
    D --> E{"Are All Lab, Workshop & Library Clearances Approved?"}
    E -- "Due Logged (e.g. Workshop Tool Missing)" --> F["Student views Due Note with Room #204\nRamesh returns tool & Faculty clears due"]
    F --> D
    E -- "100% Cleared (All 8/12 Approved)" --> G["5. Status Automatically Turns 'Completed'"]
    G --> H["6. Clerk Opens Transfer Certificates Console\nFills Leaving Date, Promotion Status & Conduct"]
    H --> I["7. Clerk Clicks '🔒 Lock & Verify' (Tamper-Proof Seal)"]
    I --> J["8. Clerk Clicks '📜 Generate TC' (Creates Version v1)"]
    J --> K["9. 🖨️ Official TC & Conduct Certificates Ready!\n(Both Clerk and Ramesh can view, download & print PDF)"]
```

---

### Step-by-Step Breakdown:

#### 1. 📤 Clerk Enrolls Student Master Records
- The Administrative Clerk opens `clerk.html` &rarr; **Bulk Import (Excel)**.
- The Clerk drags and drops the batch Excel spreadsheet (`sample_students_import.xlsx`).
- **Smart Column Toleration**: The system automatically extracts mandatory institutional columns (`PIN`, `Student Name`, `Father Name`, `Branch`, `DOB`, `Date of Admission`) while safely ignoring extra columns (Phone, Address, Blood Group).
- 200+ students are enrolled into the college database in under 2 seconds.

#### 2. 🎓 Student Instant Login & Cadet Declaration
- Ramesh visits `student.html` on his phone or desktop.
- He logs in directly using **Student PIN** (`23018-M-045`) and **Full Name** (`K. Ramesh`). No password registration friction or forgotten password headaches.
- He selects whether he is an **NCC/NSS Enrolled Cadet** or **Non-Cadet** (Non-cadet clearance is handled directly by the Clerk).
- Ramesh clicks **"🚀 Submit No-Dues Clearance Request"**. Clearance requests are automatically dispatched to all relevant departments and labs.

#### 3. 👨‍🏫 Faculty & Lab Incharges Review Clearances
- Faculty in-charges log into `faculty.html`:
  - **Mechanical Workshop Incharge**: Verifies that Ramesh returned all lathe tools and workshop gear &rarr; Clicks **"Approve Clearance"**.
  - **Sports Incharge**: Verifies no pending athletic equipment &rarr; Clicks **"Approve Clearance"**.
  - **Dedicated Librarian**: Verifies that all borrowed books are returned to the library &rarr; Marks physical clearance approved.
- **What if Ramesh has a due?**: If Ramesh forgot to return an *Applied Mechanics Lab Manual*, the in-charge logs an actionable due: *"Pending Applied Mechanics Lab Manual. Return to Room #204 (Mechanical Block)"*. Ramesh's dashboard immediately highlights the due with exact room directions. Once returned, the in-charge clears it with 1 click.

#### 4. 🔒 Automatic Completion & Clerk Locking
- The moment the last department approves, Ramesh's status instantly updates to **`Completed`** (100% cleared).
- The Administrative Clerk opens `clerk.html` &rarr; **Transfer Certificates**:
  - Clicks **"✏️ Edit Data"** to enter:
    - *Date of Leaving*: `May 2026`
    - *College Fees Paid*: `Yes`
    - *Promotion Status*: `Qualified for award of Diploma in Mechanical Engineering`
    - *Conduct & Character*: `Good`
  - Clicks **"🔒 Lock & Verify"**: Freezes the record against tampering.

#### 5. 📜 Versioned Document Generation & Printing
- The Clerk clicks **"📜 Generate TC"**. The system generates official Version **`v1`** with an institutional Transfer Certificate Number (`T. No: 45`).
- **Digital Security**: Includes a digital QR verification stamp and security token.
- **Instant Student Access**: Ramesh opens his student portal and clicks **"🖨️ View & Print Transfer Certificate (TC) &rarr;"**.
- Both the **Transfer Certificate** and **Study & Conduct Certificate** are rendered on a standardized government layout ready for college seal and Principal's signature.

---

## ✨ Comprehensive Feature Matrix

| Feature Module | Key Capabilities | Benefit to SVGP College |
| :--- | :--- | :--- |
| **🎓 Student Self-Service** | Direct PIN + Name login, 1-click No-Dues submission, live clearance status badges, cadet declaration, 20h re-notify throttle | Eliminates physical paper queues and student confusion |
| **👨‍🏫 Faculty Console** | Live pending student queues, department scope filtering, free-text due logging with location notes, 1-click approvals | Fast clearance handling across all 28 departments/labs |
| **🏛️ Clerk Administration** | Bulk Excel import with column tolerance, student master roster search, faculty account management, department config | Complete institutional governance and control |
| **📜 TC & Conduct Generator** | Versioned certificate generation (`v1`, `v2`), audit history trail, digital QR stamp, print-ready dual certificate formatting | Tamper-proof, instant government-compliant certificates |
| **💾 Dual Database Engine** | Built-in SQLite for zero-config offline use; PostgreSQL for cloud production (Supabase / Render) | Runs anywhere on PC, Android, or cloud without setup friction |
| **⏰ Automated Keep-Alive** | GitHub Actions scheduled heartbeat every 3 days | Keeps free Supabase databases and Render servers active 24/7 |
| **💻 Mobile & Desktop UX** | Responsive layout, dark/light theme (default clean white), desktop recommendation banner, animated refresh | Seamless experience across phones, tablets, and laptops |

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
     - `CLERK_PASSWORD` = `<your-secure-clerk-password>`
     - `LIBRARIAN_USERNAME` = `librarian`
     - `LIBRARIAN_PASSWORD` = `<your-secure-librarian-password>`
     - `JWT_SECRET` = `<your-random-jwt-secret-key>`
     - `DATABASE_URL` = *(Optional: paste your Supabase/PostgreSQL connection string; if left blank, Render will run SQLite)*

---

## ⏰ 24/7 Automated Supabase Keep-Alive (GitHub Actions)

This repository includes a pre-configured GitHub Actions workflow in [`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml) that runs automatically every 3 days.

### How to Activate:
1. In your GitHub repository, go to: **Settings &rarr; Secrets and variables &rarr; Actions &rarr; New repository secret**.
2. Add:
   - **`APP_URL`**: `https://your-app-name.onrender.com`
   - **`DATABASE_URL`**: `postgresql://postgres.xxx:xxx@...`
3. GitHub will execute a lightweight heartbeat query (`SELECT 1`) every 3 days, resetting Supabase's 7-day inactivity timer to **0** and keeping your database online 24/7/365 for free.

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
