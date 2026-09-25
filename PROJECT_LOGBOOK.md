# SVGP NO-DUES CLEARANCE & TRANSFER CERTIFICATE MANAGEMENT PORTAL
## PROJECT ACTIVITY LOGBOOK / WORK DIARY

---

### Day 1

**Date:** ____________________

**Points discussed with guide:**  
Presented multiple project ideas including ProjectForge, PGMS, and a Student No-Dues and Transfer Certificate Management System. Discussed their purpose, users, feasibility, and practical usefulness. After discussing the problems in the existing manual clearance process, the guide and team finalized the SVGP No-Dues Clearance and Transfer Certificate Management Portal.

**Suggestions given by guide:**  
Guide suggested finalizing the project's objectives, scope, and major user roles before starting development.  
Guide also advised focusing on solving a real problem faced by students and college administration.

**Signature of guide:**

---

### Day 2

**Date:** ____________________

**Points discussed with guide:**  
Studied the existing manual no-dues and certificate clearance process followed in the college. Identified difficulties such as repeated visits to departments, paper-based verification, and delays in obtaining certificates. Discussed how the proposed system could simplify the process.

**Suggestions given by guide:**  
Guide suggested documenting the existing problems clearly before designing the proposed solution.  
Guide advised keeping the new workflow simple and convenient for students and staff.

**Signature of guide:**

---

### Day 3

**Date:** ____________________

**Points discussed with guide:**  
Identified the main users of the proposed system and discussed their responsibilities. Planned separate access for students, faculty/department in-charges, and clerks. Discussed the overall flow from student registration and no-dues request to final certificate generation.

**Suggestions given by guide:**  
Guide suggested defining permissions for each user role clearly.  
Guide advised ensuring that users can access only the functions required for their responsibilities.

**Signature of guide:**

---

### Day 4

**Date:** ____________________

**Points discussed with guide:**  
Prepared the initial Software Requirements Specification (SRS) for the project. Discussed functional requirements, system scope, authentication, student records, department clearance, and certificate generation. Reviewed the proposed requirements with the guide and made necessary changes.

**Suggestions given by guide:**  
Guide suggested keeping the SRS clear and avoiding unnecessary features outside the project scope.  
Guide advised finalizing the important requirements before beginning major development.

**Signature of guide:**

---

### Day 5

**Date:** ____________________

**Points discussed with guide:**  
Discussed the overall system architecture and divided the application into major modules. Planned the Student Portal, Clerk Administration, Faculty Clearance, and Certificate Management modules. Discussed how the frontend, backend, and database would communicate with each other.

**Suggestions given by guide:**  
Guide suggested maintaining a modular architecture for easier development and testing.  
Guide advised keeping communication between modules properly organized.

**Signature of guide:**

---

### Day 6

**Date:** ____________________

**Points discussed with guide:**  
Designed the initial database structure for the system. Identified tables required for students, branches, departments, faculty accounts, no-dues requests, department clearances, and certificates. Discussed relationships, primary keys, foreign keys, and data validation requirements.

**Suggestions given by guide:**  
Guide suggested avoiding unnecessary duplication of data in database tables.  
Guide advised maintaining proper relationships between students, departments, and clearance records.

**Signature of guide:**

---

### Day 7

**Date:** ____________________

**Points discussed with guide:**  
Finalized the technologies to be used for the project. Selected HTML, CSS, and JavaScript for the frontend, Node.js and Express.js for the backend, and PostgreSQL for the production database. Created the project repository and established the basic folder structure.

**Suggestions given by guide:**  
Guide approved the selected technologies and suggested keeping the interface lightweight and responsive.  
Guide advised setting up proper environment configurations before writing code.

**Signature of guide:**

---

### Day 8

**Date:** ____________________

**Points discussed with guide:**  
Configured master data seeding for all 28 institutional departments and diploma branches. Added common departments like Central Library, Examination Cell, and Sports, along with branch-specific laboratories. Initialized default clerk and faculty accounts for development testing.

**Suggestions given by guide:**  
Guide suggested verifying that branch-specific laboratories are mapped correctly to their respective branches.  
Guide advised keeping the master department list easily manageable and configurable.

**Signature of guide:**

---

### Day 9

**Date:** ____________________

**Points discussed with guide:**  
Implemented the backend authentication system for clerks and faculty members. Used Bcrypt for secure password hashing and JSON Web Tokens (JWT) for session management. Created middleware to verify user roles and restrict unauthorized page access.

**Suggestions given by guide:**  
Guide suggested enforcing strict role-based access control across all API endpoints.  
Guide advised ensuring that passwords are always hashed before storing them in the database.

**Signature of guide:**

---

### Day 10

**Date:** ____________________

**Points discussed with guide:**  
Implemented login security improvements to protect against automated brute-force attacks. Added IP-based rate limiting middleware on authentication routes with a limit of 15 attempts. Configured automatic reset of attempt counters upon successful login.

**Suggestions given by guide:**  
Guide suggested returning user-friendly error messages when rate limits are exceeded.  
Guide advised ensuring legitimate users are not accidentally locked out during normal use.

**Signature of guide:**

---

### Day 11

**Date:** ____________________

**Points discussed with guide:**  
Developed the Clerk Administration Dashboard for managing student records. Implemented the master student directory with search, branch filtering, and full CRUD operations. Verified that clerks can add, edit, view, and delete student profiles easily.

**Suggestions given by guide:**  
Guide suggested adding confirmation alerts before modifying or deleting student records.  
Guide advised keeping the search functionality fast and responsive.

**Signature of guide:**

---

### Day 12

**Date:** ____________________

**Points discussed with guide:**  
Implemented the Smart Excel (XLSX) batch upload feature in the clerk module using SheetJS. Added automatic column mapping, duplicate PIN validation, and a 10MB file size limit. Tested bulk student ingestion to insert entire graduating classes in a single batch.

**Suggestions given by guide:**  
Guide suggested testing the upload feature with sample student spreadsheets.  
Guide advised showing clear error messages for invalid or missing row data during import.

**Signature of guide:**

---

### Day 13

**Date:** ____________________

**Points discussed with guide:**  
Created the faculty management section within the Clerk Dashboard. Added features allowing clerks to create faculty accounts and assign them to specific departments. Handled reassignment of departmental in-charges and HOD profiles dynamically.

**Suggestions given by guide:**  
Guide suggested ensuring that every active department has at least one assigned faculty member.  
Guide advised verifying that faculty assignments update correctly in the database.

**Signature of guide:**

---

### Day 14

**Date:** ____________________

**Points discussed with guide:**  
Developed the Faculty Clearance Portal interface and department review queue. Implemented department-level data isolation so faculty members can only access their assigned department. Added search and filter tools by student PIN and branch.

**Suggestions given by guide:**  
Guide suggested enforcing strict department isolation so faculty cannot modify dues of other departments.  
Guide advised making the student review list easy to read and navigate.

**Signature of guide:**

---

### Day 15

**Date:** ____________________

**Points discussed with guide:**  
Designed the actionable dues logging feature for faculty members. Created a popup modal allowing staff to enter specific item descriptions, fine amounts, and lab room numbers. Verified that logged dues reflect immediately on the student's personal status.

**Suggestions given by guide:**  
Guide suggested keeping dues remarks descriptive and specific.  
Guide advised ensuring students clearly understand the required actions and room locations to clear dues.

**Signature of guide:**

---

### Day 16

**Date:** ____________________

**Points discussed with guide:**  
Implemented the 1-click clearance approval workflow and batch clearance feature for faculty. Added functionality to quickly clear graduating batches with zero dues. Verified that clearance timestamps and status changes update immediately in the database.

**Suggestions given by guide:**  
Guide suggested adding an approval confirmation prompt to prevent accidental clearance clicks.  
Guide advised ensuring real-time status updates across the system.

**Signature of guide:**

---

### Day 17

**Date:** ____________________

**Points discussed with guide:**  
Developed the Student Self-Service Portal user interface. Created a responsive layout with dark and light mode that works smoothly on mobile screens. Tested page elements, navigation, and readability on various screen sizes.

**Suggestions given by guide:**  
Guide suggested keeping the student dashboard clean, simple, and mobile-friendly.  
Guide advised ensuring the interface loads quickly on low-bandwidth campus networks.

**Signature of guide:**

---

### Day 18

**Date:** ____________________

**Points discussed with guide:**  
Implemented passwordless student login using PIN and registered name verification. Built the dynamic visual clearance progress meter displaying the percentage of cleared departments. Added color-coded badges to highlight cleared and pending dues clearly.

**Suggestions given by guide:**  
Guide suggested making the clearance meter prominent so students can instantly track their progress.  
Guide advised displaying pending dues and lab locations clearly on the student dashboard.

**Signature of guide:**

---

### Day 19

**Date:** ____________________

**Points discussed with guide:**  
Added the NCC/NSS Cadet declaration toggle to the student portal. Configured the system to dynamically add the NCC/NSS Officer to the student's clearance chain when enabled. Added the clearance notification request button with rate limiting.

**Suggestions given by guide:**  
Guide suggested adding instructions explaining when students should enable the NCC/NSS cadet option.  
Guide advised setting reasonable notification rate limits to prevent spamming faculty inboxes.

**Signature of guide:**

---

### Day 20

**Date:** ____________________

**Points discussed with guide:**  
Developed the Transfer Certificate (TC) generation engine with hard database clearance locking. Implemented strict server-side validation to block TC generation until all 28 departments are cleared. Generated unique sequential serial numbers for every issued certificate.

**Suggestions given by guide:**  
Guide verified the clearance locking mechanism by attempting to generate a TC for an uncleared student.  
Guide advised recording the issuing clerk ID and timestamp for every generated certificate.

**Signature of guide:**

---

### Day 21

**Date:** ____________________

**Points discussed with guide:**  
Implemented the Study and Conduct Certificate generation module alongside the TC engine. Added multi-version tracking (`v1` original, `v2` duplicate re-issue) and physical certificate collection tracking. Designed the official government-standard A4 print stylesheet with CSS `@media print`.

**Suggestions given by guide:**  
Guide tested the print preview across multiple browsers and verified the A4 layout.  
Guide advised maintaining a complete history log for all issued and re-issued certificates.

**Signature of guide:**

---

### Day 22

**Date:** ____________________

**Points discussed with guide:**  
Conducted end-to-end integration testing across student, faculty, and clerk roles. Deployed the portal to cloud hosting on Render with a Supabase PostgreSQL database and configured automated uptime monitoring. Reviewed the final project documentation and prepared for the viva examination.

**Suggestions given by guide:**  
Guide expressed complete satisfaction with the working system and its features.  
Guide approved the project for final diploma submission and external viva presentation.

**Signature of guide:**

---
