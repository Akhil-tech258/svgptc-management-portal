# SVGP NO-DUES CLEARANCE & TRANSFER CERTIFICATE MANAGEMENT PORTAL
## PROJECT ACTIVITY LOGBOOK / WORK DIARY

---

### Day 1

**Date:** ____________________

**Points discussed with guide:**  
Presented abstracts of several project proposals to the project guide. Explained the practical challenges and delays in the manual paper-based clearance system across 28 college departments. Discussed how digitizing the no-dues verification will help students and administrative staff. The guide approved the SVGP No-Dues Clearance and Transfer Certificate Management Portal.

**Suggestions given by guide:**  
Guide suggested clearly defining the core objectives, user roles, and main workflow requirements before beginning development.

**Signature of guide:**

---

### Day 2

**Date:** ____________________

**Points discussed with guide:**  
Analyzed the existing manual circular workflow and gathered institutional requirements. Discussed the functional specifications needed for students, department faculty, clerks, and the principal. Reviewed the necessary compliance guidelines for issuing official technical board certificates. Drafted the initial Software Requirements Specification (SRS) document.

**Suggestions given by guide:**  
Guide suggested finalizing all functional requirements clearly and ensuring the interface is simple and mobile-friendly.

**Signature of guide:**

---

### Day 3

**Date:** ____________________

**Points discussed with guide:**  
Discussed the overall system architecture and modular division of the portal. Planned the four primary modules: Student Portal, Clerk Admin, Faculty Dues Management, and Certificate Engine. Evaluated the data flow and communication pathways between different user roles. Formulated the roadmap for phase-wise module development and unit testing.

**Suggestions given by guide:**  
Guide suggested keeping each module independent so that development and debugging can proceed smoothly.

**Signature of guide:**

---

### Day 4

**Date:** ____________________

**Points discussed with guide:**  
Detailed the relational database requirements and entity relationship model. Identified necessary tables for students, departments, branch details, dues records, faculty logins, and certificates. Addressed the mapping between common institutional departments and branch-specific laboratories. Finalized table constraints, foreign keys, and indexes for optimal query performance.

**Suggestions given by guide:**  
Guide suggested normalizing database tables to 3NF to maintain data integrity and avoid redundancy.

**Signature of guide:**

---

### Day 5

**Date:** ____________________

**Points discussed with guide:**  
Finalized the complete technology stack for backend, database, and frontend. Selected Node.js and Express.js for building scalable RESTful APIs. Chosen a dual-database architecture using SQLite for local development and PostgreSQL for production. Decided on Vanilla HTML5, CSS3, and ES6 JavaScript to ensure zero client-side bloat.

**Suggestions given by guide:**  
Guide approved the technology choices and advised keeping the frontend lightweight for low-bandwidth mobile networks.

**Signature of guide:**

---

### Day 6

**Date:** ____________________

**Points discussed with guide:**  
Created the core project repository and established a clean folder structure. Configured backend server scripts, environment variables, and REST route skeletons. Implemented the dynamic database connection engine in `db.js` supporting both SQLite and PostgreSQL. Verified that database tables and relational schemas initialize automatically on server start.

**Suggestions given by guide:**  
Guide suggested keeping controllers, routes, and middleware organized in separate folders for maintainability.

**Signature of guide:**

---

### Day 7

**Date:** ____________________

**Points discussed with guide:**  
Configured the master data seeding module for all 28 polytechnic departments and laboratories. Classified departments into universal categories and branch-specific labs (CME, EEE, ECE, MECH, CIVIL). Added initial administrative credentials and demo departmental accounts for development testing. Verified that student dues records map correctly across their respective branches.

**Suggestions given by guide:**  
Guide suggested verifying that branch-specific labs are mapped strictly to students of corresponding branches.

**Signature of guide:**

---

### Day 8

**Date:** ____________________

**Points discussed with guide:**  
Built the central authentication engine and role-based access security layer. Implemented salted Bcrypt password hashing for protecting clerk and faculty accounts. Integrated stateless JSON Web Token (JWT) generation with embedded role claims. Created authorization middleware to protect private API routes against unauthorized access.

**Suggestions given by guide:**  
Guide suggested enforcing strict route protection so users cannot access endpoints outside their assigned role.

**Signature of guide:**

---

### Day 9

**Date:** ____________________

**Points discussed with guide:**  
Implemented IP-based login rate limiting middleware to prevent automated brute-force attacks. Configured a sliding window limit of 15 login attempts per 15-minute window per IP address. Added logic to automatically clear failure counters upon successful user authentication. Verified that proper HTTP 429 status codes and retry messages are returned when exceeded.

**Suggestions given by guide:**  
Guide suggested displaying clear error messages on the login page informing users when the rate limit will reset.

**Signature of guide:**

---

### Day 10

**Date:** ____________________

**Points discussed with guide:**  
Developed the Clerk Administration Dashboard for managing student records. Implemented the Master Student Directory interface with real-time search and branch filtering. Created full CRUD endpoints allowing clerks to add, view, update, and remove student profiles. Tested database transaction handling during single student record modifications.

**Suggestions given by guide:**  
Guide suggested adding visual confirmation dialogues before modifying or deleting any student record.

**Signature of guide:**

---

### Day 11

**Date:** ____________________

**Points discussed with guide:**  
Integrated the Smart Excel batch ingestion engine using the SheetJS library. Implemented automated column header mapping, data type sanitization, and duplicate PIN checks. Configured a strict 10MB file size limit and allowed only valid spreadsheet formats (`.xlsx`/`.xls`). Tested bulk student import to ensure hundreds of records insert safely in a single batch.

**Suggestions given by guide:**  
Guide tested the upload feature with sample spreadsheets and suggested showing clear error messages for invalid rows.

**Signature of guide:**

---

### Day 12

**Date:** ____________________

**Points discussed with guide:**  
Added faculty account provisioning and department assignment features to the Clerk Portal. Implemented functionality for clerks to create faculty logins and assign them to specific departments. Handled dynamic reassignment of departmental in-charges and HOD profiles. Verified that faculty credentials and department associations persist correctly in the database.

**Suggestions given by guide:**  
Guide suggested verifying that every active department has at least one assigned faculty member.

**Signature of guide:**

---

### Day 13

**Date:** ____________________

**Points discussed with guide:**  
Constructed the Faculty Clearance Portal interface and department review queue. Implemented department-level data isolation ensuring faculty only access dues for their assigned department. Built search and filter tools allowing faculty to find students by PIN or diploma branch. Tested the clearance review interface with multiple concurrent faculty sessions.

**Suggestions given by guide:**  
Guide suggested ensuring strict data isolation so teachers cannot view or modify dues belonging to other departments.

**Signature of guide:**

---

### Day 14

**Date:** ____________________

**Points discussed with guide:**  
Designed the actionable free-text dues logging feature within the faculty dashboard. Created a modal interface allowing staff to input specific item descriptions, fine amounts, and lab room numbers. Ensured dues remarks are structured clearly instead of using vague pending flags. Verified that logged dues reflect immediately on the student's personal clearance record.

**Suggestions given by guide:**  
Guide suggested keeping dues remarks descriptive so students know the exact room location and items to clear.

**Signature of guide:**

---

### Day 15

**Date:** ____________________

**Points discussed with guide:**  
Implemented the single-click clearance approval workflow in the faculty interface. Added batch approval functionality allowing faculty to clear graduating batches with zero dues quickly. Built backend logic to automatically update clearance timestamps and clear remarks upon approval. Verified that updated clearance statuses synchronize immediately across the database.

**Suggestions given by guide:**  
Guide suggested adding an approval confirmation prompt to prevent accidental clearance clicks.

**Signature of guide:**

---

### Day 16

**Date:** ____________________

**Points discussed with guide:**  
Crafted the Student Self-Service Portal user interface using responsive CSS Grid and Flexbox. Implemented dark and light theme switching using native CSS custom properties. Structured mobile-optimized views so students can easily navigate on smartphone screens. Tested layout responsiveness across multiple screen dimensions and mobile viewports.

**Suggestions given by guide:**  
Guide suggested optimizing dashboard layout for mobile devices so students can check clearance easily on campus.

**Signature of guide:**

---

### Day 17

**Date:** ____________________

**Points discussed with guide:**  
Implemented passwordless student authentication using Student PIN and registered name verification. Built the real-time dynamic visual clearance progress meter on the student dashboard. Added color-coded status badges displaying green for cleared departments and red for pending dues. Displayed itemized dues remarks with lab locations and contact faculty details.

**Suggestions given by guide:**  
Guide suggested making the clearance meter prominent so students can instantly track their overall clearance progress.

**Signature of guide:**

---

### Day 18

**Date:** ____________________

**Points discussed with guide:**  
Configured the NCC/NSS Cadet declaration toggle on the student dashboard. Added dynamic approval chain injection so declaring cadet status includes the NCC/NSS Officer. Implemented the clearance notification request button with a 20-hour anti-spam rate limiter. Tested student notification triggers to prevent inbox flooding for faculty members.

**Suggestions given by guide:**  
Guide suggested displaying a clear advisory note explaining that cadet declaration is mandatory only for enrolled cadets.

**Signature of guide:**

---

### Day 19

**Date:** ____________________

**Points discussed with guide:**  
Formulated the core Transfer Certificate (TC) generation engine and server-side clearance lock. Enforced strict database validation preventing TC generation if any department due is pending. Implemented sequential unique serial number assignment using database transactional locks. Tested certificate data population with student admission year, branch, and academic record.

**Suggestions given by guide:**  
Guide verified the clearance locking mechanism and suggested recording the issuing clerk's ID on generated certificates.

**Signature of guide:**

---

### Day 20

**Date:** ____________________

**Points discussed with guide:**  
Developed the Study and Conduct Certificate generation module alongside the TC engine. Built multi-version tracking logic to mark the original issue as `v1` and subsequent re-issues as `v2`/`v3`. Maintained a complete administrative audit log capturing re-issuance reasons and timestamps. Added physical certificate collection tracking to log student pickup acknowledgments.

**Suggestions given by guide:**  
Guide approved the versioning system and suggested maintaining a complete issuance history for institutional records.

**Signature of guide:**

---

### Day 21

**Date:** ____________________

**Points discussed with guide:**  
Designed the official government-standard A4 print stylesheet using CSS `@media print`. Formatted institutional borders, state emblems, tabular student fields, and official signature blocks. Suppressed browser headers, footers, and web navigation buttons during printing. Built the dual certificate preview interface allowing clerks to preview and print documents seamlessly.

**Suggestions given by guide:**  
Guide reviewed physical print samples and verified that document formatting aligns strictly with technical board standards.

**Signature of guide:**

---

### Day 22

**Date:** ____________________

**Points discussed with guide:**  
Conducted comprehensive end-to-end testing across all student, faculty, and clerk workflows. Deployed the application to cloud hosting on Render connected to a Supabase PostgreSQL database. Configured an automated GitHub Actions keep-alive workflow to maintain cloud server uptime. Reviewed final project documentation, SRS report, and prepared for external viva presentation.

**Suggestions given by guide:**  
Guide verified the complete live application, expressed full satisfaction with the outcome, and approved the project for final submission.

**Signature of guide:**

---
