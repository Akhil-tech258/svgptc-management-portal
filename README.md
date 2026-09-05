# 🏛️ Sri Venkateswara Government Polytechnic (SVGP), Tirupati
## Automated Student No-Dues Clearance & Certificate Generator System
**Enterprise Web Application | Built strictly according to Government SBTET/AICTE Polytechnic Specifications**

---

## 📋 Table of Contents
1. [🌟 System Overview](#-system-overview)
2. [📱 How to Run on Android (Termux + Acode)](#-how-to-run-on-android-termux--acode)
3. [💻 How to Run on PC (Windows / Mac / Linux)](#-how-to-run-on-pc-windows--mac--linux)
4. [🌐 Production Deployment Guide (Render + GitHub)](#-production-deployment-guide-render--github)
5. [🎓 Official 9 SVGP Diploma Programs](#-official-9-svgp-diploma-programs)
6. [⌨️ Keyboard Shortcuts](#️-keyboard-shortcuts)
7. [📧 Institutional Support & Feedback](#-institutional-support--feedback)
8. [🧪 Automated End-to-End Testing](#-automated-end-to-end-testing)

---

## 🌟 System Overview
This web application digitizes and automates the complete student leaving workflow for Sri Venkateswara Government Polytechnic (SVGP), Tirupati:
- **Clerk Administration**: Bulk Excel student enrollment, manual student additions, department configuration, faculty scope toggling (Common vs Branch-Separated), certificate locking, and official do[...]
- **Faculty Incharges**: Real-time review of student clearances across 28 official departments and laboratories, logging actionable dues with physical contact instructions, and 1-click approvals.
- **Student Self-Service**: Case-insensitive instant login using PIN and Name, 1-click No-Dues submission, live department status cards, and 48-hour faculty re-notification timers.
- **Official Documents**: Government-compliant, print-optimized **Transfer Certificate (TC)** and **Study & Conduct Certificate** featuring institutional crest, seals, version tags, and authorized sig[...]

---

## 📱 How to Run on Android (Termux + Acode)

You can run the entire backend and use the web application directly on any Android smartphone completely offline:

### Step 1: Install Termux & Acode
1. **Download Termux**: 
   > ⚠️ **Do NOT install Termux from Google Play Store** (the Play Store build is deprecated).  
   > Download the latest APK from [F-Droid](https://f-droid.org/en/packages/com.termux/) or [Termux GitHub Releases](https://github.com/termux/termux-app/releases).
2. **Download Acode**: Install **Acode - code editor** from Google Play Store for file editing.

### Step 2: Extract Project Files on Phone
1. Transfer the project zip or folder to your phone.
2. Extract into your `Download` folder: `/sdcard/Download/svgp-nodues/`

### Step 3: Setup Termux & Start Server
```bash
# 1. Allow storage permission
termux-setup-storage

# 2. Update Termux packages
pkg update && pkg upgrade -y

# 3. Install Node.js LTS and compiler tools
pkg install nodejs-lts python make clang -y

# 4. Navigate to backend and install dependencies
cd /sdcard/Download/svgp-nodues/backend
npm install

# 5. Start the application
npm start
```

Open **Google Chrome** on your mobile phone and navigate to:
👉 **`http://localhost:5000`**

---

## 💻 How to Run on PC (Windows / Mac / Linux)

### Prerequisites
- Install [Node.js](https://nodejs.org/) (Version 18 or higher).

### Quick Start
```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

Visit: **`http://localhost:5000`** in any modern web browser.

---

## 🌐 Production Deployment Guide (Render + GitHub)

### Method 1: All-in-One on Render (Recommended)
1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Deploy SVGP No-Dues System"
   git remote add origin https://github.com/<YOUR-USERNAME>/svgp-nodues.git
   git push -u origin main
   ```
2. **Create Web Service on Render**:
   - Log in to [Render.com](https://render.com) &rarr; **New Web Service**.
   - Connect your GitHub repository.
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV` = `production`
     - `CLERK_USERNAME` = `clerk@svgp`
     - `CLERK_PASSWORD` = `Clerk@1957`
     - `JWT_SECRET` = `svgp-jwt-production-secret-2026`
     - `DATABASE_URL` = *(Optional: PostgreSQL connection URI, defaults to SQLite if omitted)*

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
- **Official Feedback Email Placeholder**: `feedback@example.com`
- **Location in Codebase**:
  - `frontend/index.html` (FAQ Section Item #9 and Page Footer)
  - `README.md` (Support Section)

For administrative inquiries, please contact the Sri Venkateswara Government Polytechnic (SVGP) Office during working hours (10:00 AM - 5:00 PM).

---

## 🧪 Automated End-to-End Testing
Run the automated test suite to verify all core system requirements:
```bash
cd backend
npm test
```
