const parseVal = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const s = String(val).trim();
    if (s === '*' || s === 'X' || s === '-' || s === 'F') return null;
    const lower = s.toLowerCase();
    if (lower === 'đạt' || lower === 'passed' || lower === 'miễn') return 1.0;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
};

const calculateScore = (row) => {
  if (row.score !== undefined) return parseVal(row.score);
  if (row.value !== undefined) return parseVal(row.value);
  if (row['Tổng kết'] !== undefined) return parseVal(row['Tổng kết']);
  if (row['Điểm tổng kết'] !== undefined) return parseVal(row['Điểm tổng kết']);
  if (row['Thang điểm 10'] !== undefined) return parseVal(row['Thang điểm 10']);
  
  const quiz = parseFloat(row.quiz) || 0;
  const asm = parseFloat(row.asm) || 0;
  const final = parseFloat(row.final) || 0;
  
  if (row.quiz !== undefined && row.asm !== undefined && row.final !== undefined) {
    return (quiz * 0.2) + (asm * 0.3) + (final * 0.5);
  }
  return null;
};

const mockRow = {
  'Mã môn': 'COM1071',
  'Thang điểm 10': 10,
  'Trạng thái': 'Passed',
};

let calculatedScore = calculateScore(mockRow);
let rowStatus = null;
const trangThai = mockRow['Trạng thái'] || mockRow['Trạng Thái'] || mockRow.status;
if (trangThai) {
  const t = String(trangThai).toLowerCase().trim();
  if (t.includes('studying') || t.includes('đang học')) rowStatus = 'STUDYING';
  else if (t.includes('not started') || t.includes('chưa học')) rowStatus = 'NOT_STARTED';
  else if (t.includes('passed') || t.includes('đạt')) rowStatus = 'PASSED';
  else if (t.includes('failed') || t.includes('trượt')) rowStatus = 'FAILED';
}

if (calculatedScore === null) {
  if (mockRow['Thang điểm 10'] !== undefined && mockRow['Thang điểm 10'] !== '') {
    const rawVal = mockRow['Thang điểm 10'];
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

const previewScore = calculatedScore !== null && !isNaN(calculatedScore) ? parseFloat(calculatedScore.toFixed(2)) : null;

console.log("Calculated Score:", calculatedScore);
console.log("Row Status:", rowStatus);
console.log("Preview Score:", previewScore);
