# SVGP NO-DUES CLEARANCE & TRANSFER CERTIFICATE MANAGEMENT PORTAL
## PROJECT ACTIVITY LOGBOOK / WORK DIARY

---

### Day 1

**Date:** ____________________

**Points discussed with guide:**  
At the first meeting, we presented abstracts of different project ideas to our guide. We explained the manual problems and delays in the current paper-based no-dues clearance process across 28 college departments.  
Our guide approved the **SVGP No-Dues Clearance and Transfer Certificate Management Portal** project for further development.

**Suggestions given by guide:**  
Guide suggested proceeding with the selected project and clearly identifying its objectives, target users (students, faculty, clerks), and major workflow features before starting implementation.

**Signature of guide:**

---

### Day 2

**Date:** ____________________

**Points discussed with guide:**  
We discussed the literature survey and practical issues in the existing paper circular system. We discussed the functional requirements and prepared the initial Software Requirements Specification (SRS).

**Suggestions given by guide:**  
Guide suggested finalizing all functional requirements, identifying user roles, and keeping the system simple and mobile-friendly.

**Signature of guide:**

---

### Day 3

**Date:** ____________________

**Points discussed with guide:**  
We discussed the overall system architecture and module division. We planned four main modules: Student Portal, Clerk Administration, Faculty Dues Management, and Certificate Generation Engine.

**Suggestions given by guide:**  
Guide suggested dividing the project into independent modules so each module can be developed and tested separately.

**Signature of guide:**

---

### Day 4

**Date:** ____________________

**Points discussed with guide:**  
We discussed the database requirements and ER diagram. We identified tables needed for students, 28 departments, branch details, clearance records, faculty accounts, and issued certificates.

**Suggestions given by guide:**  
Guide suggested designing a normalized database schema and setting proper primary and foreign keys to avoid data duplication.

**Signature of guide:**

---

### Day 5

**Date:** ____________________

**Points discussed with guide:**  
We finalized the technology stack. We selected Node.js and Express for the backend, SQLite and PostgreSQL for database storage, and HTML, CSS, and Vanilla JavaScript for a lightweight frontend.

**Suggestions given by guide:**  
Guide approved the technology stack and suggested keeping the frontend fast and lightweight so it loads easily on campus networks.

**Signature of guide:**

---

### Day 6

**Date:** ____________________

**Points discussed with guide:**  
We initialized the project repository and folder structure. We created the backend server configuration and set up the dynamic database connection engine in `db.js`.

**Suggestions given by guide:**  
Guide suggested maintaining a clean folder structure (controllers, routes, middleware) for easy code maintenance.

**Signature of guide:**

---

### Day 7

**Date:** ____________________

**Points discussed with guide:**  
We discussed and implemented master data seeding for all 28 college departments and diploma branches (CME, EEE, ECE, MECH, CIVIL). We also created initial demo accounts for testing.

**Suggestions given by guide:**  
Guide suggested ensuring universal departments and branch-specific labs are mapped accurately for each student.

**Signature of guide:**

---

### Day 8

**Date:** ____________________

**Points discussed with guide:**  
We implemented the authentication system using Bcrypt password encryption and JSON Web Tokens (JWT) for secure user login sessions.

**Suggestions given by guide:**  
Guide suggested implementing role-based access control middleware so users can only access their authorized routes.

**Signature of guide:**

---

### Day 9

**Date:** ____________________

**Points discussed with guide:**  
We implemented security middleware to protect login routes against brute-force attacks using IP-based rate limiting (15 attempts limit).

**Suggestions given by guide:**  
Guide suggested returning clear error messages when the rate limit is reached and automatically resetting limits on successful login.

**Signature of guide:**

---

### Day 10

**Date:** ____________________

**Points discussed with guide:**  
We started developing the Clerk Dashboard. We implemented the student directory section with search, branch filtering, and full CRUD operations to manage student records.

**Suggestions given by guide:**  
Guide suggested making the student search fast and adding confirmation alerts before updating or deleting records.

**Signature of guide:**

---

### Day 11

**Date:** ____________________

**Points discussed with guide:**  
We developed the Smart Excel (XLSX) batch upload feature using SheetJS. We added automatic column mapping, a 10MB file size limit, and duplicate PIN checks.

**Suggestions given by guide:**  
Guide tested the upload feature with sample student spreadsheets and suggested displaying clear error messages for invalid rows.

**Signature of guide:**

---

### Day 12

**Date:** ____________________

**Points discussed with guide:**  
We developed the faculty management section in the Clerk portal. We added options for clerks to create faculty accounts and assign them to specific college departments.

**Suggestions given by guide:**  
Guide suggested verifying that each department has an active assigned faculty in-charge.

**Signature of guide:**

---

### Day 13

**Date:** ____________________

**Points discussed with guide:**  
We developed the Faculty Clearance Portal. We created the department review queue where faculty can view students belonging to their assigned department.

**Suggestions given by guide:**  
Guide suggested enforcing strict department data isolation so faculty members can only view and update dues for their own department.

**Signature of guide:**

---

### Day 14

**Date:** ____________________

**Points discussed with guide:**  
We developed the actionable dues logging feature. We created a form where faculty can record specific dues details, including item description, fine amount, and lab room number.

**Suggestions given by guide:**  
Guide suggested keeping dues remarks descriptive so students know exactly where to go and what dues need to be cleared.

**Signature of guide:**

---

### Day 15

**Date:** ____________________

**Points discussed with guide:**  
We implemented the 1-click clearance approval button and bulk approval feature in the Faculty Dashboard to clear students quickly once dues are settled.

**Suggestions given by guide:**  
Guide suggested ensuring student clearance status updates immediately across the database upon approval.

**Signature of guide:**

---

### Day 16

**Date:** ____________________

**Points discussed with guide:**  
We designed and developed the Student Portal user interface. We created a clean, responsive layout with dark/light mode that works smoothly on mobile screens.

**Suggestions given by guide:**  
Guide suggested optimizing the layout for small smartphone screens so students can easily check clearance status on mobile phones.

**Signature of guide:**

---

### Day 17

**Date:** ____________________

**Points discussed with guide:**  
We implemented passwordless student login using PIN and student name verification. We also built the dynamic visual clearance progress meter.

**Suggestions given by guide:**  
Guide suggested displaying clear color indicators (green for cleared, red for pending) so students can instantly see their status.

**Signature of guide:**

---

### Day 18

**Date:** ____________________

**Points discussed with guide:**  
We added the NCC/NSS Cadet declaration toggle to the student portal and created the clearance notification request button with anti-spam rate limiting.

**Suggestions given by guide:**  
Guide suggested adding instructions explaining when students should enable the NCC/NSS cadet option.

**Signature of guide:**

---

### Day 19

**Date:** ____________________

**Points discussed with guide:**  
We developed the Transfer Certificate (TC) generation engine. We implemented the hard lock rule that strictly prevents TC generation until all 28 departments are 100% cleared.

**Suggestions given by guide:**  
Guide tested the clearance verification lock and suggested generating unique sequential serial numbers for every issued certificate.

**Signature of guide:**

---

### Day 20

**Date:** ____________________

**Points discussed with guide:**  
We implemented the Study and Conduct Certificate generation module along with multi-version tracking (`v1` original, `v2` duplicate re-issue).

**Suggestions given by guide:**  
Guide suggested maintaining an issue history log with timestamps and version numbers for all generated certificates.

**Signature of guide:**

---

### Day 21

**Date:** ____________________

**Points discussed with guide:**  
We designed the official government-standard A4 print layout using CSS `@media print`. We styled institutional borders, college headers, and signature sections.

**Suggestions given by guide:**  
Guide tested the print preview across different web browsers and suggested hiding website buttons during printing.

**Signature of guide:**

---

### Day 22

**Date:** ____________________

**Points discussed with guide:**  
We integrated all modules and performed end-to-end testing. We deployed the project on cloud hosting (Render and Supabase PostgreSQL) and reviewed the final project documentation.

**Suggestions given by guide:**  
Guide verified the working portal across all roles, appreciated the complete system, and approved the project for final submission and viva examination.

**Signature of guide:**

---
