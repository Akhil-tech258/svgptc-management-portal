# SVGP NO-DUES CLEARANCE & TRANSFER CERTIFICATE MANAGEMENT PORTAL
## PROJECT ACTIVITY LOGBOOK / WORK DIARY (30-DAY COMPLETE LOG)

---

### Day 1

**Date:** ____________________

**Points discussed with guide:**  
Presented multiple project ideas including ProjectForge, PGMS, and a Student No-Dues and Transfer Certificate Management System. Discussed their purpose, users, feasibility, and practical usefulness. After discussing the problems in the existing manual clearance process, the guide and team finalized the SVGP No-Dues Clearance and Transfer Certificate Management Portal.

**Suggestions given by guide:**  
Guide suggested finalizing the project objectives, scope, and target user roles before beginning implementation.

**Signature of guide:**

---

### Day 2

**Date:** ____________________

**Points discussed with guide:**  
Studied the existing manual no-dues and certificate clearance process followed in the college. Identified difficulties such as repeated visits to departments, paper-based verification, and delays in obtaining certificates. Discussed how the proposed system could simplify the process.

**Suggestions given by guide:**  
Guide suggested clearly documenting existing manual clearance issues before designing the proposed solution.

**Signature of guide:**

---

### Day 3

**Date:** ____________________

**Points discussed with guide:**  
Identified the main users of the proposed system and discussed their responsibilities. Planned separate access for students, faculty/department in-charges, and clerks. Discussed the overall flow from student registration and no-dues request to final certificate generation.

**Suggestions given by guide:**  
Guide suggested defining user permissions clearly so each role only accesses its required functions.

**Signature of guide:**

---

### Day 4

**Date:** ____________________

**Points discussed with guide:**  
Prepared the initial Software Requirements Specification (SRS) for the project. Discussed functional requirements, system scope, authentication, student records, department clearance, and certificate generation. Reviewed the proposed requirements with the guide and made necessary changes.

**Suggestions given by guide:**  
Guide suggested keeping the SRS document clear and avoiding unnecessary features outside project scope.

**Signature of guide:**

---

### Day 5

**Date:** ____________________

**Points discussed with guide:**  
Reviewed project feasibility and planned the module-wise development timeline. Discussed potential technical constraints, server requirements, and mobile accessibility for students. Divided responsibilities among team members according to frontend, backend, database, and documentation tasks.

**Suggestions given by guide:**  
Guide suggested setting realistic weekly milestones and focusing on core features before secondary enhancements.

**Signature of guide:**

---

### Day 6

**Date:** ____________________

**Points discussed with guide:**  
Discussed the overall system architecture and divided the application into major modules. Planned the Student Portal, Clerk Administration, Faculty Clearance, and Certificate Management modules. Discussed how the frontend, backend, and database would communicate with each other.

**Suggestions given by guide:**  
Guide suggested maintaining a modular architecture to ensure easier development and independent testing.

**Signature of guide:**

---

### Day 7

**Date:** ____________________

**Points discussed with guide:**  
Designed the initial database structure for the system. Identified tables required for students, branches, departments, faculty accounts, no-dues requests, department clearances, and certificates. Discussed relationships, primary keys, foreign keys, and data validation requirements.

**Suggestions given by guide:**  
Guide suggested designing normalized tables with proper relationships to avoid data redundancy.

**Signature of guide:**

---

### Day 8

**Date:** ____________________

**Points discussed with guide:**  
Finalized the technologies to be used for the project. Selected HTML, CSS, and JavaScript for the frontend, Node.js and Express.js for the backend, and PostgreSQL for the production database. Created the project repository and established the basic folder structure.

**Suggestions given by guide:**  
Guide approved the chosen technologies and suggested keeping the frontend lightweight and responsive.

**Signature of guide:**

---

### Day 9

**Date:** ____________________

**Points discussed with guide:**  
Created the backend server setup and implemented the dynamic database connection engine in `db.js`. Configured automatic switching between local SQLite for offline development and PostgreSQL for cloud production. Verified that database tables initialize automatically on server startup.

**Suggestions given by guide:**  
Guide suggested keeping database connection logic modular and securing credentials using environment variables.

**Signature of guide:**

---

### Day 10

**Date:** ____________________

**Points discussed with guide:**  
Configured master data seeding for all 28 institutional departments and diploma branches. Added common departments like Central Library, Examination Cell, and Sports, along with branch-specific laboratories. Initialized default clerk and faculty accounts for development testing.

**Suggestions given by guide:**  
Guide suggested verifying that common departments and branch-specific labs are mapped accurately.

**Signature of guide:**

---

### Day 11

**Date:** ____________________

**Points discussed with guide:**  
Implemented the backend authentication system for clerks and faculty members. Used Bcrypt for secure password hashing and JSON Web Tokens (JWT) for session management. Created middleware to verify user roles and restrict unauthorized page access.

**Suggestions given by guide:**  
Guide suggested enforcing strict role-based access control and ensuring all passwords are encrypted with Bcrypt.

**Signature of guide:**

---

### Day 12

**Date:** ____________________

**Points discussed with guide:**  
Implemented login security improvements to protect against automated brute-force attacks. Added IP-based rate limiting middleware on authentication routes with a limit of 15 attempts. Configured automatic reset of attempt counters upon successful login.

**Suggestions given by guide:**  
Guide suggested returning user-friendly error messages when rate limits are exceeded during login attempts.

**Signature of guide:**

---

### Day 13

**Date:** ____________________

**Points discussed with guide:**  
Designed the user interface layout for the Clerk Administration Dashboard (`clerk.html`). Created navigation tabs for student management, Excel bulk upload, faculty accounts, and certificate history. Tested layout responsiveness across desktop and tablet screen sizes.

**Suggestions given by guide:**  
Guide suggested organizing administrative functions into distinct, easily accessible dashboard sections.

**Signature of guide:**

---

### Day 14

**Date:** ____________________

**Points discussed with guide:**  
Developed the Master Student Directory module within the Clerk Dashboard. Implemented real-time search, diploma branch filtering, and full CRUD operations. Verified that clerks can add, edit, view, and delete student records with proper input validation.

**Suggestions given by guide:**  
Guide suggested adding confirmation alerts before modifying or deleting any student record.

**Signature of guide:**

---

### Day 15

**Date:** ____________________

**Points discussed with guide:**  
Implemented the Smart Excel (XLSX) batch upload feature in the clerk module using SheetJS. Added automatic column mapping, duplicate PIN validation, and batch database insertion. Tested bulk student ingestion to insert entire graduating classes in a single upload.

**Suggestions given by guide:**  
Guide suggested testing the Excel upload engine with sample files and validating row data carefully.

**Signature of guide:**

---

### Day 16

**Date:** ____________________

**Points discussed with guide:**  
Configured upload security and file size validation using Multer middleware. Enforced a strict 10MB file size limit and restricted file uploads exclusively to valid spreadsheet formats (`.xlsx` and `.xls`). Verified that oversized or invalid files return clean error feedback.

**Suggestions given by guide:**  
Guide suggested enforcing a strict file size limit and handling invalid spreadsheet uploads gracefully.

**Signature of guide:**

---

### Day 17

**Date:** ____________________

**Points discussed with guide:**  
Created the faculty management section within the Clerk Dashboard. Added features allowing clerks to create faculty accounts and assign them to specific departments. Handled reassignment of departmental in-charges and HOD profiles dynamically.

**Suggestions given by guide:**  
Guide suggested ensuring that every active college department has an assigned faculty in-charge.

**Signature of guide:**

---

### Day 18

**Date:** ____________________

**Points discussed with guide:**  
Developed the Faculty Clearance Portal interface and department review queue. Implemented department-level data isolation so faculty members can only access their assigned department. Added search and filter tools by student PIN and branch.

**Suggestions given by guide:**  
Guide suggested enforcing strict department data isolation so teachers cannot access other departments' dues.

**Signature of guide:**

---

### Day 19

**Date:** ____________________

**Points discussed with guide:**  
Designed the actionable dues logging feature for faculty members. Created a popup modal allowing staff to enter specific item descriptions, fine amounts, and lab room numbers. Verified that logged dues reflect immediately on the student's personal status.

**Suggestions given by guide:**  
Guide suggested keeping dues remarks descriptive so students know the exact room location and items to clear.

**Signature of guide:**

---

### Day 20

**Date:** ____________________

**Points discussed with guide:**  
Implemented the 1-click clearance approval workflow and batch clearance feature for faculty. Added functionality to quickly clear graduating batches with zero dues. Verified that clearance timestamps and status changes update immediately in the database.

**Suggestions given by guide:**  
Guide suggested adding a confirmation prompt before approving clearances to prevent accidental clicks.

**Signature of guide:**

---

### Day 21

**Date:** ____________________

**Points discussed with guide:**  
Developed the Student Self-Service Portal user interface. Created a responsive layout with dark and light mode that works smoothly on mobile screens. Tested page elements, navigation, and readability on various screen sizes.

**Suggestions given by guide:**  
Guide suggested optimizing the student dashboard layout for fast loading on smartphone screens.

**Signature of guide:**

---

### Day 22

**Date:** ____________________

**Points discussed with guide:**  
Implemented passwordless student login using PIN and registered name verification. Built the dynamic visual clearance progress meter displaying the percentage of cleared departments. Added color-coded badges to highlight cleared and pending dues clearly.

**Suggestions given by guide:**  
Guide suggested making the clearance meter prominent so students can instantly track their overall progress.

**Signature of guide:**

---

### Day 23

**Date:** ____________________

**Points discussed with guide:**  
Added the NCC/NSS Cadet declaration toggle to the student portal. Configured the system to dynamically add the NCC/NSS Officer to the student's clearance chain when enabled. Added the clearance notification request button with rate limiting.

**Suggestions given by guide:**  
Guide suggested adding clear guidance explaining when students should declare NCC or NSS cadet status.

**Signature of guide:**

---

### Day 24

**Date:** ____________________

**Points discussed with guide:**  
Developed the Transfer Certificate (TC) generation engine with hard database clearance locking. Implemented strict server-side validation to block TC generation until all 28 departments are cleared. Generated unique sequential serial numbers for every issued certificate.

**Suggestions given by guide:**  
Guide verified the clearance lock and advised generating unique sequential serial numbers for every issued TC.

**Signature of guide:**

---

### Day 25

**Date:** ____________________

**Points discussed with guide:**  
Implemented the Study and Conduct Certificate generation module alongside the TC engine. Added multi-version tracking (`v1` original, `v2` duplicate re-issue) and physical certificate collection tracking. Verified student academic data population in certificate preview templates.

**Suggestions given by guide:**  
Guide approved the versioning system and suggested maintaining a complete issuance history for duplicate certificates.

**Signature of guide:**

---

### Day 26

**Date:** ____________________

**Points discussed with guide:**  
Designed the official government-standard A4 print stylesheet using CSS `@media print`. Formatted institutional borders, state emblems, tabular student fields, and official signature blocks. Suppressed browser headers, footers, and web navigation buttons during printing.

**Suggestions given by guide:**  
Guide tested the print preview and suggested ensuring proper A4 margins for clean paper printing.

**Signature of guide:**

---

### Day 27

**Date:** ____________________

**Points discussed with guide:**  
Built the dual certificate preview interface allowing clerks to view and print both Transfer and Study Certificates seamlessly. Added a physical collection tracking modal to record student pickup dates and acknowledgments. Verified that collection status updates in the master directory.

**Suggestions given by guide:**  
Guide suggested verifying that clerks can preview and print both certificates seamlessly in one action.

**Signature of guide:**

---

### Day 28

**Date:** ____________________

**Points discussed with guide:**  
Conducted comprehensive end-to-end testing across all student, faculty, and clerk workflows. Tested edge cases including partial department clearances, rejected logins, duplicate student PINs, and network timeouts. Fixed minor UI alignment issues and normalized API error responses.

**Suggestions given by guide:**  
Guide suggested testing edge cases thoroughly and verifying that all system error messages are user-friendly.

**Signature of guide:**

---

### Day 29

**Date:** ____________________

**Points discussed with guide:**  
Deployed the completed application to cloud hosting on Render connected to a Supabase PostgreSQL database. Configured an automated GitHub Actions keep-alive workflow to maintain continuous server uptime. Tested live URL accessibility across desktop and mobile browsers.

**Suggestions given by guide:**  
Guide verified the live cloud deployment and advised monitoring server logs for smooth uptime.

**Signature of guide:**

---

### Day 30

**Date:** ____________________

**Points discussed with guide:**  
Reviewed the completed project documentation, source code repository, and user manuals with the guide. Practiced the project presentation and demonstrated live clearance workflows for the external viva examination. Verified all deliverables against initial project objectives.

**Suggestions given by guide:**  
Guide expressed full satisfaction with the working system and approved the project for final submission and viva presentation.

**Signature of guide:**

---
