

const calculateScore = (row) => {
  const parseVal = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const s = String(val).trim();
    if (s === '*' || s === 'X' || s === '-' || s === 'F') return null;
    const lower = s.toLowerCase();
    if (lower === 'đạt' || lower === 'passed' || lower === 'miễn') return 1.0;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  if (row['Thang điểm 10'] !== undefined) {
    const val = parseVal(row['Thang điểm 10']);
    if (val !== null) return val;
  }
  if (row.score !== undefined) {
    const val = parseVal(row.score);
    if (val !== null) return val;
  }
  if (row.value !== undefined) {
    const val = parseVal(row.value);
    if (val !== null) return val;
  }
  if (row['Điểm tổng kết'] !== undefined) {
    const val = parseVal(row['Điểm tổng kết']);
    if (val !== null) return val;
  }
  if (row['Tổng kết'] !== undefined) {
    const val = parseVal(row['Tổng kết']);
    if (val !== null) return val;
  }
  return null;
};

const row = {
  'MSSV': 'PS47503',
  'name': 'Nguyễn Văn A',
  'course': 'COM1071',
  'semester': 'Summer 2025',
  'Thang điểm 10': 10,
  'Trạng thái': 'Passed'
};

let calculatedScore = calculateScore(row);
let rowStatus = null;
const trangThai = row['Trạng thái'];
if (trangThai) {
  const t = String(trangThai).toLowerCase().trim();
  if (t === 'studying' || t === 'đang học') rowStatus = 'STUDYING';
  else if (t === 'not started' || t === 'chưa học') rowStatus = 'NOT_STARTED';
  else if (t === 'passed' || t === 'đạt' || t === 'miễn' || t === 'mien' || t === 'pass') rowStatus = 'PASSED';
  else if (t === 'failed' || t === 'không đạt' || t === 'chưa đạt' || t === 'trượt' || t === 'rớt' || t === 'học lại' || t === 'fail') rowStatus = 'FAILED';
  else if (t.includes('studying') || t.includes('đang học')) rowStatus = 'STUDYING';
  else if (t.includes('không đạt') || t.includes('chưa đạt') || t.includes('trượt') || t.includes('failed')) rowStatus = 'FAILED';
  else if (t.includes('đạt') || t.includes('passed')) rowStatus = 'PASSED';
}

if (calculatedScore === null) {
  if (row['Thang điểm 10'] !== undefined && row['Thang điểm 10'] !== '') {
    const rawVal = row['Thang điểm 10'];
    const s = String(rawVal).trim().toLowerCase();
    if (s === 'đạt' || s === 'passed' || s === 'miễn') {
      calculatedScore = 1.0;
      rowStatus = 'PASSED';
    } else {
      calculatedScore = parseFloat(rawVal);
    }
  }
}

if (rowStatus === 'STUDYING' || rowStatus === 'NOT_STARTED') {
  calculatedScore = null;
}

console.log('--- PREVIEW RESULT ---');
console.log('calculatedScore:', calculatedScore);
console.log('rowStatus:', rowStatus);

const score = calculatedScore !== null && !isNaN(calculatedScore) ? parseFloat(calculatedScore.toFixed(2)) : null;
console.log('score mapped to previewItem:', score);

let status = rowStatus;
let scoreValue = score;

if (status === 'STUDYING' || status === 'NOT_STARTED') {
  scoreValue = null;
} else if (!status) {
  if (scoreValue === null || scoreValue === undefined) {
    status = 'STUDYING';
    scoreValue = null;
  } else {
    status = (scoreValue >= 5.0 || scoreValue === 1.0) ? 'PASSED' : 'FAILED';
  }
}

console.log('--- DB UPSERT RESULT ---');
console.log('scoreValue:', scoreValue);
console.log('status:', status);
