export const DEFAULT_CURRICULUM = [
  { id: 'COM1071', name: 'Tin học', credits: 3 },
  { id: 'ITI101', name: 'Nhập môn Công nghệ thông tin', credits: 3 },
  { id: 'COM108', name: 'Nhập môn lập trình', credits: 3 },
  { id: 'PDP102', name: 'Kỹ năng học tập', credits: 2 },
  { id: 'VIE103', name: 'Giáo dục thể chất', credits: 2 },
  { id: 'ENT1128', name: 'Tiếng Anh 1.1', credits: 3 },
  { id: 'WEB1013', name: 'Xây dựng trang Web', credits: 3 },
  { id: 'COM2012', name: 'Cơ sở dữ liệu', credits: 3 },
  { id: 'ENT1227', name: 'Tiếng Anh 1.2', credits: 3 },
  { id: 'WEB108', name: 'Lập trình PHP cơ bản', credits: 3 },
  { id: 'WEB1043', name: 'Lập trình cơ sở với JavaScript', credits: 3 },
  { id: 'VIE1016', name: 'Chính trị', credits: 4 },
  { id: 'WEB3023', name: 'Thiết kế Web với HTML5 & CSS3', credits: 3 },
  { id: 'WEB2014', name: 'Lập trình PHP 1', credits: 3 },
  { id: 'VIE1026', name: 'Pháp luật', credits: 2 },
  { id: 'PDP103', name: 'Kỹ năng phát triển bản thân', credits: 2 },
  { id: 'WEB105', name: 'Thiết kế UI/UX', credits: 3 },
  { id: 'WEB2041', name: 'Dự án mẫu', credits: 3 },
  { id: 'ENT2127', name: 'Tiếng Anh 2.1', credits: 3 },
  { id: 'ENT2227', name: 'Tiếng Anh 2.2', credits: 3 },
  { id: 'WEB1023', name: 'Quản trị website', credits: 3 },
  { id: 'WEB2053', name: 'Marketing trên Internet', credits: 3 },
  { id: 'WEB501', name: 'Lập trình ECMAScript', credits: 3 },
  { id: 'WEB2064', name: 'Lập trình Javascript nâng cao', credits: 3 },
  { id: 'PRO1014', name: 'Dự án 1', credits: 3 },
  { id: 'WEB503', name: 'NodeJS & Restful Web Service', credits: 3 },
  { id: 'WEB502', name: 'Lập trình TypeScript', credits: 3 },
  { id: 'PDP104', name: 'Kỹ năng làm việc', credits: 2 },
  { id: 'SYB3013', name: 'Khởi sự doanh nghiệp', credits: 3 },
  { id: 'WEB2081', name: 'Lập trình Front-End Framework 1', credits: 3 },
  { id: 'WEB2091', name: 'Lập trình Front-End Framework 2', credits: 3 },
  { id: 'PRO116', name: 'Thực tập tốt nghiệp', credits: 5 },
  { id: 'PRO220', name: 'Dự án tốt nghiệp', credits: 5 }
];

export const getCourseCredits = (courseNameOrId) => {
  const cid = String(courseNameOrId || '').toUpperCase().trim();
  const found = DEFAULT_CURRICULUM.find(c => c.id === cid);
  if (found) return found.credits;
  return 3;
};

export const isConditionalCourse = (courseName, courseId) => {
  const name = (courseName || '').toLowerCase();
  const cid = (courseId || '').toUpperCase().trim();
  return (
    name.includes('thể chất') || name.includes('quốc phòng') ||
    name.includes('thực tập tốt nghiệp') || name.includes('vovinam') ||
    name.includes('gdqp') || cid.includes('VIE103') || cid.includes('VIE104') ||
    cid.includes('PRO110') || cid.includes('PRO115') || cid.includes('PRO116')
  );
};

export const isEnglishCourse = (courseName, courseId) => {
  const name = (courseName || '').toLowerCase();
  const cid = (courseId || '').toUpperCase();
  return name.includes('tiếng anh') || name.includes('tieng anh') || cid.includes('ENT');
};
