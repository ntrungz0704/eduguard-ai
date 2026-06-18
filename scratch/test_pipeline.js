const simulate = (row) => {
  // calculateScore
  const parseVal = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const s = String(val).trim();
    if (s === '*' || s === 'X' || s === '-' || s === 'F') return null;
    const lower = s.toLowerCase();
    if (lower === 'đạt' || lower === 'passed' || lower === 'miễn') return 1.0;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  const calculateScore = (r) => {
    if (r.score !== undefined) return parseVal(r.score);
    if (r.value !== undefined) return parseVal(r.value);
    if (r['Tổng kết'] !== undefined) return parseVal(r['Tổng kết']);
    if (r['Điểm tổng kết'] !== undefined) return parseVal(r['Điểm tổng kết']);
    if (r['Thang điểm 10'] !== undefined) return parseVal(r['Thang điểm 10']);
    return null;
  };

  let calculatedScore = calculateScore(row);
  
  // Trạng thái parsing
  let rowStatus = null;
  const trangThai = row['Trạng thái'] || row['Trạng Thái'] || row.status;
  if (trangThai) {
    const t = String(trangThai).toLowerCase().trim();
    if (t.includes('studying') || t.includes('đang học')) rowStatus = 'STUDYING';
    else if (t.includes('not started') || t.includes('chưa học')) rowStatus = 'NOT_STARTED';
    else if (t.includes('passed') || t.includes('đạt')) rowStatus = 'PASSED';
    else if (t.includes('failed') || t.includes('trượt')) rowStatus = 'FAILED';
  }

  // FPT format fallback
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
  
  let scoreValue = calculatedScore !== null && !isNaN(calculatedScore) ? parseFloat(calculatedScore.toFixed(2)) : null;

  // Publish
  let status = rowStatus;

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

  return { score: scoreValue, status: status };
};

const tests = [
  { "Thang điểm 10": 10, "Trạng thái": "Passed" },
  { "Thang điểm 10": 10, "Trạng thái": "Failed" },
  { "Thang điểm 10": 10, "Tổng kết": "Passed" },
  { "Thang điểm 10": 10, "Tổng kết": "Đạt", "Trạng thái": "Failed" },
  { "Thang điểm 10": 10, "Điểm tổng kết": 1.0, "Trạng thái": "Failed" },
  { "score": 1.0, "Thang điểm 10": 10, "Trạng thái": "Failed" },
  { "value": 1.0, "Thang điểm 10": 10, "Trạng thái": "Failed" },
  { "Thang điểm 10": "10", "Trạng thái": "Trượt" },
];

tests.forEach((t, i) => {
  console.log(`Test ${i + 1}:`, t, "=>", simulate(t));
});
