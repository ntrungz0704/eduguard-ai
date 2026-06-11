const { calculateFptGPA } = require('./server/src/utils/dataService');

const scores = [
  { courseId: 'COM1071', course: { name: 'Tin học' }, value: 9.5 },
  { courseId: 'COM108', course: { name: 'Nhập môn lập trình' }, value: 8.9 },
  { courseId: 'COM2012', course: { name: 'Cơ sở dữ liệu' }, value: 8.6 },
  { courseId: 'ENT1128', course: { name: 'Tiếng Anh 1.1' }, value: 7.2 },
  { courseId: 'ENT123', course: { name: 'Tiếng Anh 1.2' }, value: 7.4 },
  { courseId: 'ENT213', course: { name: 'Tiếng Anh 2.1' }, value: 7.4 },
  { courseId: 'ITI101', course: { name: 'Nhập môn công nghệ thông tin' }, value: 9.2 },
  { courseId: 'PDP102', course: { name: 'Kỹ năng học tập' }, value: 8.0 },
  { courseId: 'PDP103', course: { name: 'Kỹ năng phát triển bản thân' }, value: 8.5 },
  { courseId: 'VIE1026', course: { name: 'Pháp luật' }, value: 7.7 },
  { courseId: 'VIE103', course: { name: 'Giáo dục thể chất - Vovinam' }, value: 8.2 },
  { courseId: 'WEB1013', course: { name: 'Xây dựng trang Web' }, value: 9.1 },
  { courseId: 'WEB1043', course: { name: 'Lập trình cơ sở với JavaScript' }, value: 9.1 },
  { courseId: 'WEB105', course: { name: 'Thiết kế UI/UX' }, value: 9.4 },
  { courseId: 'WEB108', course: { name: 'Lập trình PHP cơ bản' }, value: 9.1 },
  { courseId: 'WEB2014', course: { name: 'Lập trình PHP 1' }, value: 9.2 },
  { courseId: 'WEB2041', course: { name: 'Dự án mẫu (TKTW)' }, value: 5.8 },
  { courseId: 'WEB3023', course: { name: 'Thiết kế Web với HTML5&CSS3' }, value: 9.9 },
  { courseId: 'VIE104', course: { name: 'Giáo dục quốc phòng' }, value: 1.0 },
  { courseId: 'VIE108', course: { name: 'Chính trị' }, value: 1.0 }
];

console.log(calculateFptGPA(scores));
