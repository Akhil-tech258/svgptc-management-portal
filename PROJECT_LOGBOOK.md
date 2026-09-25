# SVGP NO-DUES CLEARANCE & TRANSFER CERTIFICATE MANAGEMENT PORTAL
## PROJECT ACTIVITY LOGBOOK / WORK DIARY

---

### Day 1

**Date:** ____________________

**Points discussed with guide:**
At the initial project meeting, we presented abstracts of multiple project concepts to our guide. We explained the problem statement, institutional necessity, and practical utility of each proposed project. After evaluating the real-world operational challenges faced in our polytechnic college during graduation season, our guide approved the **SVGP No-Dues Clearance & Transfer Certificate (TC) Management Portal** for development. We discussed the traditional difficulties where students must physically walk to 28 different institutional departments and laboratories to collect manual signatures on paper circulars.

**Suggestions given by guide:**
Guide suggested proceeding with the selected project by clearly formulating the project objectives, identifying all key institutional stakeholders (Students, Department Faculty, Office Clerks, and Principal), and outlining the core automated workflow before starting software implementation.

**Signature of guide:**

---

### Day 2

**Date:** ____________________

**Points discussed with guide:**
We presented our detailed literature survey and analysis of the existing manual paper-based clearance system. We discussed the bottlenecks observed in the current procedure, including physical student queues, lost clearance slips, untracked laboratory dues, lack of verification accountability, and delays in issuing final Transfer Certificates. We also discussed how a centralized web portal can eliminate paper circulars, provide transparent dues tracking, and secure certificate issuance.

**Suggestions given by guide:**
Guide suggested thoroughly documenting the Software Requirements Specification (SRS), establishing clear non-functional requirements such as mobile responsiveness for low-bandwidth campus networks, and ensuring compliance with State Board of Technical Education (SBTET) certificate guidelines.

**Signature of guide:**

---

### Day 3

**Date:** ____________________

**Points discussed with guide:**
We discussed the high-level system architecture and modular breakdown of the portal. We defined four primary modules: (1) Student Self-Service Module, (2) Clerk & Administrative Management Module, (3) Faculty & Department Dues Review Module, and (4) Certificate Generation & Verification Engine. We also discussed role-based access control and the required interaction pathways between these modules.

**Suggestions given by guide:**
Guide suggested keeping each module loosely coupled and modular so that backend API controllers and frontend views can be developed, tested, and validated independently without dependency deadlocks.

**Signature of guide:**

---

### Day 4

**Date:** ____________________

**Points discussed with guide:**
We presented the database requirements, entity relationships, and relational schema design. We discussed tables for Students, Departments, Branches, Department Clearances/Dues, Faculty Users, and Generated Certificates. We also discussed how the system must handle both Universal Departments (e.g., Central Library, Examination Cell, Physical Education, Hostel) and Branch-Specific Laboratories (e.g., Computer Labs, Electrical Machines Lab, Heat Power Lab).

**Suggestions given by guide:**
Guide suggested normalizing the database tables to 3NF to eliminate redundancy, defining foreign key constraints with cascade rules, and indexing the Student PIN and Department ID columns for high-speed query performance during peak clearance periods.

**Signature of guide:**

---

### Day 5

**Date:** ____________________

**Points discussed with guide:**
We discussed and finalized the technology stack for the project. For the backend, Node.js and Express.js were chosen for their asynchronous event-driven performance. For the database layer, a dual-database architecture was proposed using SQLite for local zero-configuration development and PostgreSQL (Supabase) for cloud production deployment. For the frontend, Vanilla HTML5, CSS3, and ES6 JavaScript were selected to ensure a "Zero Client-Side Bloat" design that loads instantly on mobile devices without heavy framework bundles.

**Suggestions given by guide:**
Guide approved the technology stack and suggested implementing a clean database abstraction layer so the backend can switch between SQLite and PostgreSQL seamlessly without rewriting SQL queries.

**Signature of guide:**

---

### Day 6

**Date:** ____________________

**Points discussed with guide:**
We initiated the backend development environment. We initialized the project repository, configured the directory structure (`config/`, `controllers/`, `routes/`, `middleware/`, `utils/`), created `package.json`, and implemented the central database connection engine in `db.js`. We demonstrated the dynamic connection pooling that automatically connects to PostgreSQL when `DATABASE_URL` is set, or defaults to local SQLite when running offline.

**Suggestions given by guide:**
Guide verified the directory structure and advised maintaining clean code modularity, using environment variables for all sensitive configuration keys, and establishing a consistent RESTful JSON response format across all API endpoints.

**Signature of guide:**

---

### Day 7

**Date:** ____________________

**Points discussed with guide:**
We discussed and implemented the master data seeding module (`seedData.js`). We mapped all 28 polytechnic departments and laboratories, categorizing them into Universal Departments and Branch-Specific Departments (CME, EEE, ECE, MECH, CIVIL). We also initialized default administrative and departmental faculty accounts to allow initial testing.

**Suggestions given by guide:**
Guide reviewed the seeded departmental mapping and suggested ensuring that branch-specific laboratories are only dynamically assigned to students belonging to that specific diploma branch, while universal departments remain mandatory for all students.

**Signature of guide:**

---

### Day 8

**Date:** ____________________

**Points discussed with guide:**
We discussed the authentication engine and security layer. We implemented `authController.js` and `authMiddleware.js`. We demonstrated how administrative and faculty passwords are encrypted using salted Bcrypt hashing before database persistence. We also explained the issuance and verification of stateless JSON Web Tokens (JWT) containing cryptographically signed user IDs and role claims (`CLERK`, `FACULTY`, `STUDENT`).

**Suggestions given by guide:**
Guide suggested verifying that role-based authorization middleware strictly protects every private API endpoint, preventing unauthorized role escalation, and ensuring proper token expiration handling.

**Signature of guide:**

---

### Day 9

**Date:** ____________________

**Points discussed with guide:**
We discussed system security enhancements against automated brute-force attacks and abuse. We implemented a dedicated IP-based rate limiting middleware (`rateLimiter.js`) on all authentication routes. We explained the sliding window algorithm limiting requests to a maximum of 15 attempts within a 15-minute window per IP, with automatic counter resets upon successful authentication.

**Suggestions given by guide:**
Guide appreciated the security hardening and suggested returning clear, user-friendly HTTP 429 (Too Many Requests) JSON error messages that inform users when their rate limit will reset.

**Signature of guide:**

---

### Day 10

**Date:** ____________________

**Points discussed with guide:**
We started implementing the Clerk Administration Dashboard (`clerk.html` and `clerkController.js`). We demonstrated the Master Student Directory module featuring real-time search, diploma branch filtering, student status inspection, and full CRUD (Create, Read, Update, Delete) database operations for individual student records.

**Suggestions given by guide:**
Guide suggested ensuring that deleting or modifying a student record also safely handles associated clearance records and certificates to prevent orphaned records in the database.

**Signature of guide:**

---

### Day 11

**Date:** ____________________

**Points discussed with guide:**
We demonstrated the Smart Excel (XLSX) Batch Ingestion Engine (`excelValidator.js` and `clerkRoutes.js`). We showed how clerks can upload an entire graduating class spreadsheet. We demonstrated how the SheetJS parser sanitizes variable column header formats, validates mandatory fields (PIN, Student Name, Father Name, Branch, Admission Year), enforces a strict 10MB upload limit, detects duplicate PINs, and executes atomic database batch insertion.

**Suggestions given by guide:**
Guide tested the upload engine with edge-case spreadsheets and suggested providing clear error logs showing exact row numbers whenever invalid or missing data is encountered during spreadsheet processing.

**Signature of guide:**

---

### Day 12

**Date:** ____________________

**Points discussed with guide:**
We discussed the Faculty and Department Management capabilities within the Clerk administration module. We implemented the functionality allowing clerks to provision faculty login credentials, assign faculty members to specific departments, and reassign or update departmental HOD/in-charge mappings dynamically.

**Suggestions given by guide:**
Guide suggested adding visual confirmation modals before sensitive administrative actions and ensuring that every department has at least one active assigned faculty member.

**Signature of guide:**

---

### Day 13

**Date:** ____________________

**Points discussed with guide:**
We started working on the Faculty Clearance Portal (`faculty.html` and `facultyController.js`). We demonstrated the department review queue where faculty members log in and view the student clearance list. We showed the department-level data isolation ensuring faculty can strictly view and edit dues belonging to their assigned department ID.

**Suggestions given by guide:**
Guide suggested adding branch-wise and PIN-wise search filters in the faculty queue to help teachers locate specific students rapidly during physical clearance verification.

**Signature of guide:**

---

### Day 14

**Date:** ____________________

**Points discussed with guide:**
We developed and demonstrated the Actionable Free-Text Dues Logging Engine. We showed the faculty modal dialogue where staff can record detailed, transparent dues remarks instead of generic status flags (e.g., *"Return Surveying Theodolite #3 to Room 204 and pay ₹150 fine"*). We also showed how the due amount, item description, and lab room number are stored in the clearance record.

**Suggestions given by guide:**
Guide praised the actionable dues feature and suggested ensuring that dues remarks are immediately visible on the student's personal dashboard so students know exactly what physical actions are required.

**Signature of guide:**

---

### Day 15

**Date:** ____________________

**Points discussed with guide:**
We demonstrated the 1-Click Clearance Resolution Workflow and Batch Clearance Approvals in the Faculty Dashboard. We showed how faculty can instantly mark a cleared student with a single click once their dues are settled, automatically updating the clearance timestamp and clearing remarks. We also demonstrated the bulk approval feature for clearing entire graduating batches with zero dues.

**Suggestions given by guide:**
Guide suggested adding an undo or confirmation toggle to prevent accidental one-click clearances and ensuring that clearance status updates reflect in real-time across the database.

**Signature of guide:**

---

### Day 16

**Date:** ____________________

**Points discussed with guide:**
We presented the Student Self-Service Portal UI layout (`student.html` and `style.css`). We demonstrated the responsive CSS design built with CSS Grid and Flexbox, featuring dark/light theme switching, responsive card layouts for mobile screens, and a clean institutional header branding.

**Suggestions given by guide:**
Guide suggested optimizing the layout for small smartphone screens so students can easily check their clearance status while on the move across campus.

**Signature of guide:**

---

### Day 17

**Date:** ____________________

**Points discussed with guide:**
We implemented and demonstrated the Student Authentication and Live Clearance Meter (`studentController.js` and `student.js`). We showcased the frictionless passwordless login where graduating students authenticate using their Student PIN and registered name. We also demonstrated the real-time animated clearance progress bar that dynamically calculates the exact percentage of cleared vs. pending departments.

**Suggestions given by guide:**
Guide suggested making the itemized dues section highlight pending departments in red/amber and cleared departments in green so students can immediately spot where clearance is blocked.

**Signature of guide:**

---

### Day 18

**Date:** ____________________

**Points discussed with guide:**
We demonstrated the NCC/NSS Cadet Declaration Switch and the Anti-Spam Clearance Notification Request Engine on the student dashboard. We showed how toggling the cadet switch dynamically adds the NCC/NSS Officer to the student's required approval chain. We also showed the clearance request button with its 20-hour anti-spam rate limiter to prevent notification spamming.

**Suggestions given by guide:**
Guide suggested displaying clear warning notes explaining that declaring NCC/NSS cadet status is mandatory only for enrolled cadets and requires physical clearance from the institutional NCC/NSS in-charge.

**Signature of guide:**

---

### Day 19

**Date:** ____________________

**Points discussed with guide:**
We developed the core Transfer Certificate (TC) Generation Engine and Hard Database Clearance Locking (`certificateController.js` and `certificateRoutes.js`). We demonstrated the server-side integrity check: the system strictly prevents TC generation if even a single department or lab due remains `PENDING`. We also demonstrated the sequential unique serial number generator (e.g., `SVGP/TC/2026/001`) that uses database transactional locks to prevent duplicate numbers.

**Suggestions given by guide:**
Guide verified the hard-lock logic by attempting to generate a TC for an uncleared student and confirmed that the server correctly rejected the request. Guide suggested logging the exact timestamp and clerk ID for every generated certificate.

**Signature of guide:**

---

### Day 20

**Date:** ____________________

**Points discussed with guide:**
We implemented the Study & Conduct Certificate Generation Engine and Multi-Version Tracking. We demonstrated how the system generates both the Transfer Certificate and the Study & Conduct Certificate simultaneously from the student's academic record. We also demonstrated the version tracking feature where the initial certificate is marked `v1` (Original), and any subsequent administrative re-issuance is tracked as `v2` / `v3` (Duplicate) with an audit reason logged in the database.

**Suggestions given by guide:**
Guide approved the versioning engine and suggested adding an official administrative clearance log for clerks to record physical certificate collection by the student with date and signature acknowledgment.

**Signature of guide:**

---

### Day 21

**Date:** ____________________

**Points discussed with guide:**
We presented the Official Government-Standard A4 Print CSS Formatting Engine (`certificate-view.html` and `style.css`). We demonstrated the `@media print` stylesheet rules configured with exact `size: A4 portrait`, institutional border styling, government emblem placements, formatted tabular data fields, and official signature blocks for the Head of Section (HOS) and Principal. We showed the dual certificate preview window enabling 1-click printing.

**Suggestions given by guide:**
Guide tested physical print previews across Chrome, Edge, and mobile browsers, verified that browser headers/footers and URL watermarks are suppressed, and confirmed that the generated certificate strictly complies with state polytechnic layout standards.

**Signature of guide:**

---

### Day 22

**Date:** ____________________

**Points discussed with guide:**
We presented the completed, fully integrated portal. We demonstrated end-to-end user workflows across Student, Faculty, and Clerk roles. We showcased cloud deployment on Render connected to a PostgreSQL database hosted on Supabase, and demonstrated the automated GitHub Actions keep-alive workflow (`keep-alive.yml`) that prevents free-tier container sleep. We also reviewed the project documentation, SRS document, and team division of responsibilities.

**Suggestions given by guide:**
Guide expressed high satisfaction with the completed portal, confirmed that all functional requirements and security guidelines were successfully met, and approved the project for final diploma capstone submission and external viva examination.

**Signature of guide:**

---
