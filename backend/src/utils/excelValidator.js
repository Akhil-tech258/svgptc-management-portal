const xlsx = require('xlsx');
const { isValidDateFormat } = require('./helpers');

// Expanded column definition with extensive aliases and combined support
const COLUMN_DEFS = [
  { 
    key: 'pin', 
    required: true,
    labels: [
      'pin', 'student pin', 'reg no', 'hall ticket no', 'htno', 'roll no', 
      'registration no', 'permanent identification number', 'permanent id', 
      'pin number', 'id number', 'permanent id number'
    ] 
  },
  { 
    key: 'student_name', 
    required: true,
    labels: [
      'student name', 'name', 'candidate name', 'student_name', 
      'name of the student', 'name of pupil', 'pupil name', 'pupil', 'student'
    ] 
  },
  { 
    key: 'father_name', 
    required: true,
    labels: [
      'father name', 'father/guardian name', 'father / guardian name', 
      'father_name', 'guardian name', 'parent name', 'father', 
      'father guardian', 'father / guardian', 'father/guardian'
    ] 
  },
  { 
    key: 'dob', 
    required: true,
    labels: ['date of birth', 'dob', 'birth date', 'birthdate', 'd o b', 'd.o.b', 'born on'] 
  },
  { 
    key: 'nationality', 
    required: false, // Can be resolved from combined column
    labels: ['nationality', 'country', 'nation'] 
  },
  { 
    key: 'religion', 
    required: false, // Can be resolved from combined column
    labels: ['religion', 'caste', 'community'] 
  },
  { 
    key: 'combined_nat_rel', 
    required: false,
    labels: [
      'nationality, religion', 'nationality religion', 'nationality / religion', 
      'nationality/religion', 'nationality and religion'
    ] 
  },
  { 
    key: 'course_branch', 
    required: true,
    labels: [
      'course/branch', 'course / branch', 'course', 'branch', 
      'department', 'program', 'class', 'trade', 'course of study'
    ] 
  },
  { 
    key: 'date_of_admission', 
    required: true,
    labels: ['date of admission', 'admission date', 'doa', 'd o a', 'admitted on', 'date of joining'] 
  },
  { 
    key: 'admission_no', 
    required: false, // Can be auto-derived if not present
    labels: ['admission no', 'admission number', 'admission_no', 'adm no', 'admno', 'adm_no'] 
  },
  // Optional Certificate Fields
  {
    key: 'date_of_leaving',
    required: false,
    labels: ['date left institution', 'date of leaving', 'leaving date', 'date left']
  },
  {
    key: 'promotion_status',
    required: false,
    labels: ['promotion', 'promotion status', 'qualified for promotion']
  },
  {
    key: 'conduct_character',
    required: false,
    labels: ['conduct & character', 'conduct and character', 'conduct', 'character']
  },
  {
    key: 'fees_paid',
    required: false,
    labels: ['fees paid', 'fee paid', 'all dues paid']
  }
];

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\.\/]+/g, ' ');
}

function formatDateValue(val) {
  if (!val && val !== 0) return '';
  
  if (typeof val === 'number') {
    // Excel date serial number
    const date = xlsx.SSF.parse_date_code(val);
    if (date) {
      const d = String(date.d).padStart(2, '0');
      const m = String(date.m).padStart(2, '0');
      const y = date.y;
      return `${d}-${m}-${y}`;
    }
  }
  
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}-${m}-${y}`;
  }
  
  const str = String(val).trim();
  
  // Format: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymd = str.match(/^(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = String(ymd[2]).padStart(2, '0');
    const d = String(ymd[3]).padStart(2, '0');
    return `${d}-${m}-${y}`;
  }

  // Format: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY or D.M.YYYY
  const dmy = str.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{4})$/);
  if (dmy) {
    const d = String(dmy[1]).padStart(2, '0');
    const m = String(dmy[2]).padStart(2, '0');
    const y = dmy[3];
    return `${d}-${m}-${y}`;
  }

  return str;
}

async function validateExcelBuffer(fileBuffer, existingPinsSet = new Set()) {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (!rawRows || rawRows.length < 2) {
    return {
      error: 'The uploaded file is empty or does not contain data rows.',
      summary: { total: 0, valid: 0, rejected: 0, newRows: 0, updateRows: 0 },
      validRows: [],
      rejectedRows: []
    };
  }

  // Dynamic Header Row Detection:
  // Sometimes row 0 is a title banner (e.g. "All 20 TCs"). Scan rows 0 to 5 for best match.
  let bestHeaderRowIndex = 0;
  let maxMatchedCols = 0;
  let bestColIndexMap = {};

  const scanLimit = Math.min(6, rawRows.length);
  for (let r = 0; r < scanLimit; r++) {
    const rowNormalized = (rawRows[r] || []).map(cell => normalizeHeader(cell));
    const currentMap = {};
    let matchesCount = 0;

    for (const col of COLUMN_DEFS) {
      let foundIdx = -1;
      for (let i = 0; i < rowNormalized.length; i++) {
        const cell = rowNormalized[i];
        if (!cell) continue;
        if (col.labels.some(l => cell === l || cell.includes(l) || l.includes(cell))) {
          foundIdx = i;
          break;
        }
      }
      currentMap[col.key] = foundIdx;
      if (foundIdx !== -1) matchesCount++;
    }

    if (matchesCount > maxMatchedCols) {
      maxMatchedCols = matchesCount;
      bestHeaderRowIndex = r;
      bestColIndexMap = currentMap;
    }
  }

  const colIndexMap = bestColIndexMap;

  // Check mandatory columns that MUST be present in header
  // PIN, Name, Father, DOB, Course, DOA are required
  const missingHeaders = [];
  if (colIndexMap['pin'] === -1) missingHeaders.push('PIN / Permanent Identification Number');
  if (colIndexMap['student_name'] === -1) missingHeaders.push('Student Name / Name of Pupil');
  if (colIndexMap['father_name'] === -1) missingHeaders.push('Father/Guardian Name');
  if (colIndexMap['dob'] === -1) missingHeaders.push('Date of Birth');
  if (colIndexMap['course_branch'] === -1) missingHeaders.push('Course / Branch / Class');
  if (colIndexMap['date_of_admission'] === -1) missingHeaders.push('Date of Admission');

  // Check Nationality & Religion (either separate columns OR combined column)
  const hasSeparateNatRel = colIndexMap['nationality'] !== -1 && colIndexMap['religion'] !== -1;
  const hasCombinedNatRel = colIndexMap['combined_nat_rel'] !== -1;
  if (!hasSeparateNatRel && !hasCombinedNatRel) {
    missingHeaders.push('Nationality & Religion');
  }

  if (missingHeaders.length > 0) {
    return {
      error: `Missing mandatory column headers in Excel: ${missingHeaders.join(', ')}`,
      summary: { total: 0, valid: 0, rejected: 0, newRows: 0, updateRows: 0 },
      validRows: [],
      rejectedRows: []
    };
  }

  const validRows = [];
  const rejectedRows = [];
  let newRowsCount = 0;
  let updateRowsCount = 0;
  const seenPinsInFile = new Set();

  for (let rowIndex = bestHeaderRowIndex + 1; rowIndex < rawRows.length; rowIndex++) {
    const row = rawRows[rowIndex];
    // Skip empty lines
    if (!row || row.every(cell => String(cell).trim() === '')) {
      continue;
    }

    const rowNumber = rowIndex + 1; // 1-indexed Excel row
    const errors = [];

    const pinVal = colIndexMap['pin'] !== -1 ? String(row[colIndexMap['pin']] || '').trim() : '';
    let admNoVal = colIndexMap['admission_no'] !== -1 ? String(row[colIndexMap['admission_no']] || '').trim() : '';
    
    // Auto-generate Admission No if column wasn't present in Excel file
    if (!admNoVal && pinVal) {
      admNoVal = `ADM-${pinVal}`;
    }

    let natVal = colIndexMap['nationality'] !== -1 ? String(row[colIndexMap['nationality']] || '').trim() : '';
    let relVal = colIndexMap['religion'] !== -1 ? String(row[colIndexMap['religion']] || '').trim() : '';

    // If combined Nationality & Religion column exists (e.g. "INDIAN-HINDU-KALINGA-BC-A")
    if (colIndexMap['combined_nat_rel'] !== -1 || colIndexMap['nationality'] === colIndexMap['religion']) {
      const combinedColIdx = colIndexMap['combined_nat_rel'] !== -1 ? colIndexMap['combined_nat_rel'] : colIndexMap['nationality'];
      const combined = String(row[combinedColIdx] || '').trim();
      if (combined) {
        const parts = combined.split(/[\-,]+/).map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          natVal = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        }
        if (parts.length > 1) {
          relVal = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
          if (parts.length > 2) {
            relVal += ` (${parts.slice(2).join('-')})`;
          }
        }
      } else {
        natVal = '';
        relVal = '';
      }
    }

    const extracted = {
      pin: pinVal,
      admission_no: admNoVal,
      student_name: colIndexMap['student_name'] !== -1 ? String(row[colIndexMap['student_name']] || '').trim() : '',
      father_name: colIndexMap['father_name'] !== -1 ? String(row[colIndexMap['father_name']] || '').trim() : '',
      dob: colIndexMap['dob'] !== -1 ? formatDateValue(row[colIndexMap['dob']]) : '',
      nationality: natVal,
      religion: relVal,
      course_branch: colIndexMap['course_branch'] !== -1 ? String(row[colIndexMap['course_branch']] || '').trim() : '',
      date_of_admission: colIndexMap['date_of_admission'] !== -1 ? formatDateValue(row[colIndexMap['date_of_admission']]) : ''
    };

    // Extract optional certificate data if present
    const certData = {};
    if (colIndexMap['date_of_leaving'] !== -1 && row[colIndexMap['date_of_leaving']]) {
      certData.date_of_leaving = String(row[colIndexMap['date_of_leaving']]).trim();
    }
    if (colIndexMap['promotion_status'] !== -1 && row[colIndexMap['promotion_status']]) {
      certData.promotion_status = String(row[colIndexMap['promotion_status']]).trim();
    }
    if (colIndexMap['conduct_character'] !== -1 && row[colIndexMap['conduct_character']]) {
      certData.conduct_character = String(row[colIndexMap['conduct_character']]).trim();
    }
    if (colIndexMap['fees_paid'] !== -1 && row[colIndexMap['fees_paid']]) {
      certData.fees_paid = String(row[colIndexMap['fees_paid']]).trim();
    }

    if (Object.keys(certData).length > 0) {
      extracted.certificate_data = certData;
    }

    // Validation checks
    if (!extracted.pin) errors.push('PIN is required');
    if (!extracted.student_name) errors.push('Student Name is required');
    if (!extracted.father_name) errors.push('Father/Guardian Name is required');
    if (!extracted.nationality) errors.push('Nationality is required');
    if (!extracted.religion) errors.push('Religion is required');
    if (!extracted.course_branch) errors.push('Course/Branch/Class is required');

    if (!extracted.dob) {
      errors.push('Date of Birth is required');
    } else if (!isValidDateFormat(extracted.dob)) {
      errors.push(`DOB must be in DD-MM-YYYY format (found: "${extracted.dob}")`);
    }

    if (!extracted.date_of_admission) {
      errors.push('Date of Admission is required');
    } else if (!isValidDateFormat(extracted.date_of_admission)) {
      errors.push(`Date of Admission must be in DD-MM-YYYY format (found: "${extracted.date_of_admission}")`);
    }

    if (extracted.pin) {
      if (seenPinsInFile.has(extracted.pin)) {
        errors.push(`Duplicate PIN "${extracted.pin}" within the same Excel sheet`);
      } else {
        seenPinsInFile.add(extracted.pin);
      }
    }

    if (errors.length > 0) {
      rejectedRows.push({
        rowNumber,
        pin: extracted.pin || '(Empty)',
        student_name: extracted.student_name || '(Empty)',
        reasons: errors
      });
    } else {
      const isUpdate = existingPinsSet.has(extracted.pin);
      if (isUpdate) {
        updateRowsCount++;
      } else {
        newRowsCount++;
      }
      validRows.push({
        ...extracted,
        rowNumber,
        isUpdate
      });
    }
  }

  const total = validRows.length + rejectedRows.length;
  return {
    summary: {
      total,
      valid: validRows.length,
      rejected: rejectedRows.length,
      newRows: newRowsCount,
      updateRows: updateRowsCount
    },
    validRows,
    rejectedRows
  };
}

function generateSampleTemplate() {
  const sampleData = [
    {
      'PIN': '23018-CM-001',
      'Admission No': 'ADM-23018-001',
      'Student Name': 'Karri Jaswant',
      'Father/Guardian Name': 'Karri Satyanarayana',
      'Date of Birth': '14-05-2006',
      'Nationality': 'Indian',
      'Religion': 'Hindu',
      'Course/Branch': 'Computer Engineering / Computer Science',
      'Date of Admission': '01-07-2023'
    },
    {
      'PIN': '23018-EC-015',
      'Admission No': 'ADM-23018-015',
      'Student Name': 'Kondeti Snehalatha',
      'Father/Guardian Name': 'Kondeti Narayana',
      'Date of Birth': '22-09-2006',
      'Nationality': 'Indian',
      'Religion': 'Hindu',
      'Course/Branch': 'Electronics and Communication Engineering (Industry Integrated)',
      'Date of Admission': '01-07-2023'
    },
    {
      'PIN': '23018-C-024',
      'Admission No': 'ADM-23018-024',
      'Student Name': 'Bandaru Yaswanth',
      'Father/Guardian Name': 'Bandaru Venkateswarlu',
      'Date of Birth': '10-02-2006',
      'Nationality': 'Indian',
      'Religion': 'Hindu',
      'Course/Branch': 'Civil Engineering',
      'Date of Admission': '01-07-2023'
    },
    {
      'PIN': '23018-M-038',
      'Admission No': 'ADM-23018-038',
      'Student Name': 'Shaik Mohammed Farhan',
      'Father/Guardian Name': 'Shaik Abdul Khadar',
      'Date of Birth': '18-11-2005',
      'Nationality': 'Indian',
      'Religion': 'Muslim',
      'Course/Branch': 'Mechanical Engineering',
      'Date of Admission': '01-07-2023'
    },
    {
      'PIN': '24018-PH-008',
      'Admission No': 'ADM-24018-008',
      'Student Name': 'Challa Keerthi Reddy',
      'Father/Guardian Name': 'Challa Ramana Reddy',
      'Date of Birth': '05-04-2006',
      'Nationality': 'Indian',
      'Religion': 'Hindu',
      'Course/Branch': 'D.Pharma (Diploma in Pharmacy)',
      'Date of Admission': '15-07-2024'
    }
  ];

  const ws = xlsx.utils.json_to_sheet(sampleData);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'SVGP_Students');
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  validateExcelBuffer,
  generateSampleTemplate
};
