const { calculateOfficialGPA } = require('./server/src/utils/dataService');

const scores = [
  { courseId: 'COM1071', value: 9.5, status: 'PASSED' },
  { courseId: 'PDP102', value: 8.0, status: 'PASSED' },
  { courseId: 'COM108', value: 10, status: 'PASSED' },
  { courseId: 'ITI101', value: 9.2, status: 'PASSED' },
  { courseId: 'ENT1128', value: 7.2, status: 'PASSED' },
  { courseId: 'COM2012', value: 8.6, status: 'PASSED' },
  { courseId: 'WEB1013', value: 9.1, status: 'PASSED' },
  { courseId: 'ENT123', value: 7.4, status: 'PASSED' },
  { courseId: 'WEB1043', value: 9.1, status: 'PASSED' },
  { courseId: 'WEB108', value: 9.1, status: 'PASSED' },
  { courseId: 'VIE108', value: 10, status: 'PASSED' },
  { courseId: 'ENT213', value: 7.4, status: 'PASSED' },
  { courseId: 'WEB3023', value: 9.9, status: 'PASSED' },
  { courseId: 'WEB2014', value: 9.2, status: 'PASSED' },
  { courseId: 'PDP103', value: 8.5, status: 'PASSED' },
  { courseId: 'WEB105', value: 9.4, status: 'PASSED' },
  { courseId: 'WEB2041', value: 5.8, status: 'PASSED' },
  { courseId: 'VIE1026', value: 7.7, status: 'PASSED' },
  { courseId: 'VIE103', value: null, status: 'PASSED' },
  { courseId: 'VIE104', value: null, status: 'PASSED' }
];

console.log(calculateOfficialGPA(scores));
