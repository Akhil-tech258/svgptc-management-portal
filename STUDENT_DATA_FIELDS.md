# 🎓 Sri Venkateswara Government Polytechnic (SVGP), Tirupati
## Student Data Structure & Field Specification Reference

This document provides the complete data dictionary, field specifications, database schemas, and Excel import formats for student data in the SVGP Automated No-Dues & Certificate Generator System.

---

## 1. 📋 Core Student Master Fields
**Database Table:** `students_master`  
**Purpose:** Permanent identity, admissions, and departmental registry records.  
**Ingestion:** Uploaded via institutional Excel (`.xlsx`) files or added directly by the Clerk.

| Field Name | DB Column | Data Type | Mandatory in Excel? | Example / Accepted Format | Description & Validation Rules |
|---|---|---|---|---|---|
| **PIN** | `pin` | VARCHAR(50) | **YES (Primary Key)** | `23018-CM-001` | Permanent Diploma PIN. Must be uppercase. Checked for duplicate collisions upon import. |
| **Admission Number** | `admission_no` | VARCHAR(50) | **YES** | `ADM-23018-001` | Official admission register number. Defaults to `ADM-<PIN>` if left blank by clerk. |
| **Student Full Name** | `student_name` | VARCHAR(150) | **YES** | `Karri Jaswant` | Full legal name as per SSC / Board marksheet. Case-insensitive lookup during login. |
| **Father / Guardian Name** | `father_name` | VARCHAR(150) | **YES** | `Karri Satyanarayana` | Father's or legal guardian's full name. Printed on official TC and Conduct certificates. |
| **Date of Birth** | `dob` | VARCHAR(20) | **YES** | `14-05-2006` | Must follow strict `DD-MM-YYYY` format. Validated before database insertion. |
| **Nationality** | `nationality` | VARCHAR(50) | Optional | `Indian` | Nationality of student. Defaults to 'Indian' if blank. |
| **Religion** | `religion` | VARCHAR(50) | Optional | `Hindu` | Religion of student (e.g., Hindu, Muslim, Christian). Defaults to 'Hindu' if blank. |
| **Course / Branch** | `course_branch` | VARCHAR(100) | **YES** | `Computer Engineering` | Must match one of the 9 official SVGP diploma programs. Used to map branch clearances. |
| **Date of Admission** | `date_of_admission` | VARCHAR(20) | **YES** | `01-07-2023` | Joining date. Must follow strict `DD-MM-YYYY` format. Printed on certificates. |
| **Record Timestamp** | `created_at` | TIMESTAMP | System Auto | `2026-08-31 08:00:00` | Server-generated timestamp when record was enrolled. |

---

## 2. 📜 Certificate & Academic Leaving Fields
**Database Table:** `certificate_data` (Staging) & `certificate_versions` (Permanent Audit Archive)  
**Purpose:** Stores academic leaving specifics entered and verified by the Clerk before locking and generating certificates.

| Field Name | DB Column | Data Type | Example Value | Description & Purpose |
|---|---|---|---|---|
| **Transfer Cert No** | `t_no` | VARCHAR(50) | `1` | Serial number on the printed TC. Auto-derived from the last 3 digits of PIN (e.g. 001 -> 1), Clerk can override. |
| **Date of Leaving** | `date_of_leaving` | VARCHAR(50) | `May 2026` or `15-05-2026` | Month & year or date student completed/left the diploma program. |
| **College Fees & Dues** | `fees_paid` | VARCHAR(20) | `Yes` | Confirms whether all tuition/lab dues were settled. Printed on point 9 of the TC. |
| **Promotion / Exam Status** | `promotion_status` | TEXT | `Qualified for award of Diploma in Computer Engineering` | Official SBTET exam result / award qualification statement (Point 10 of TC). |
| **Conduct & Character** | `conduct_character` | VARCHAR(50) | `Good` | Moral conduct evaluation (Good, Satisfactory, Exemplary). Printed on both TC & Conduct Cert. |
| **Lock Status** | `is_locked` | INTEGER (0 or 1) | `1` (Locked) | Prevents tampering. Data must be locked by Clerk before certificate generation can proceed. |
| **Verified By** | `verified_by` | VARCHAR(100) | `clerk_admin` | Username of the administrative clerk who performed the final verification check. |
| **Verified Timestamp** | `verified_at` | TIMESTAMP | Current Timestamp | Date and time when the record was locked. |
| **Document Version** | `version_number` | INTEGER | `1`, `2`... | Version sequence. Increments whenever an unlocked certificate is modified and re-generated. |
| **Issue Date** | `generated_date` | VARCHAR(20) | `31-08-2026` | Official issue date printed on top right of TC and Study & Conduct Certificate. |

---

## 3. ⚡ Clearance & Dues Tracking Fields (Dynamic Workflow)
**Database Tables:** `no_dues_requests`, `department_clearances`, `dues`  
**Purpose:** Generated during real-time clearance requests across all 28 college departments and labs.

| Field Name | DB Column | Table | Allowed Values / Format | Description |
|---|---|---|---|---|
| **Request ID** | `id` | `no_dues_requests` | Integer | Unique identifier for a student's No-Dues clearance application. |
| **Overall Status** | `status` | `no_dues_requests` | `Pending`, `Completed` | Set to 'Completed' only when all departments/labs approve. |
| **Dept Clearance Status** | `status` | `department_clearances` | `Pending`, `Due Found`, `Approved` | Individual approval status per department. |
| **Approval Mode** | `department_type` | `departments` | `Online` or `Physical` | Online is approved by faculty incharge; Physical (e.g. Library) is verified by Clerk. |
| **Due Item / Reason** | `reason` | `dues` | Free-text (e.g. `Library Book #4920: Java Programming`) | Specific explanation of why dues are pending. |
| **Due Amount** | `amount` | `dues` | e.g. `₹250` or `0` | Monetary penalty or fee balance (if applicable). |
| **Contact Instruction** | `contact_instruction` | `dues` | Free-text (e.g. `Central Library Counter 2, Contact Sri R. Sharma`) | Mandatory physical room and staff contact details to clear the due. |
| **Re-notify Timestamp**| `last_notified_at` | `department_clearances` | Timestamp | Enforces the strict 48-hour rate-limit on student reminder notifications. |

---

## 4. 🏛️ Official SVGP 9 Diploma Course Codes & Mapping
For the `course_branch` field, the system maps to these 9 official diploma courses:

| Course Code | Official Diploma Name | Duration | Standard Clearance Scope |
|---|---|---|---|
| **CIVIL** | Civil Engineering | 3 Years | Common + Surveying Lab, Civil CAD Lab |
| **MECH** | Mechanical Engineering | 3 Years | Common + Mechanical Workshop, CAD/CAM Lab |
| **EEE** | Electrical and Electronics Engineering | 3 Years | Common + Electrical Machines Lab, Power Systems Lab |
| **ECE** | Electronics and Communication Engineering | 3 Years | Common + EDC Lab, Communication Lab |
| **CME** | Computer Engineering | 3 Years | Common + Computer Lab, Software Networks Lab, Digital Electronics Lab |
| **BME** | Biomedical Engineering | 3 Years | Common + Biomedical Equipment Lab, Medical Electronics Lab |
| **CHE** | Chemical Engineering (Sugar Technology) | 3 Years | Common + Chemical Tech Lab, Sugar Analysis & Process Lab |
| **ECE-II** | Electronics & Communication (Industry Integrated) | 3 Years | Common + Embedded & IoT Lab, VLSI & Telecom Lab |
| **PHARM** | Diploma in Pharmacy (D.Pharma) | 2 Years | Common + Pharmaceutics Lab, Pharmaceutical Chemistry Lab |

---

## 5. 📂 Standard Excel File Column Headers Template
When uploading a bulk student register Excel file (`.xlsx`), use these exact column names:

```csv
PIN,Admission No,Student Name,Father Name,DOB,Nationality,Religion,Course / Branch,Date of Admission
23018-CM-001,ADM-23018-001,Karri Jaswant,Karri Satyanarayana,14-05-2006,Indian,Hindu,Computer Engineering,01-07-2023
23018-EC-015,ADM-23018-015,Kondeti Snehalatha,Kondeti Narayana,22-09-2006,Indian,Hindu,Electronics and Communication Engineering,01-07-2023
23018-C-024,ADM-23018-024,Bandaru Yaswanth,Bandaru Venkateswarlu,10-02-2006,Indian,Hindu,Civil Engineering,01-07-2023
23018-M-038,ADM-23018-038,Shaik Mohammed Farhan,Shaik Basha,04-11-2005,Indian,Muslim,Mechanical Engineering,01-07-2023
24018-PH-008,ADM-24018-008,Challa Keerthi Reddy,Challa Venkat Reddy,18-08-2006,Indian,Hindu,Diploma in Pharmacy (D.Pharma),01-07-2024
```
