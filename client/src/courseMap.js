export const courseNameToCode = {
  'Tin học': 'COM1071',
  'Nhập môn lập trình': 'COM108',
  'Tiếng Anh 1.1': 'ENT1128',
  'Nhập môn Công nghệ thông tin': 'ITI101',
  'Nhập môn công nghệ thông tin': 'ITI101',
  'Kỹ năng học tập': 'PDP102',
  'Giáo dục thể chất': 'VIE103',
  'Giáo dục thể chất - Vovinam': 'VIE103',
  'Cơ sở dữ liệu': 'COM2012',
  'Tiếng Anh 1.2': 'ENT123',
  'Giáo dục chính trị': 'VIE108',
  'Chính trị': 'VIE108',
  'Xây dựng trang Web': 'WEB1013',
  'Lập trình cơ sở với JavaScript': 'WEB1043',
  'Lập trình PHP cơ bản': 'WEB108',
  'Tiếng Anh 2.1': 'ENT213',
  'Kỹ năng phát triển bản thân': 'PDP103',
  'Thiết kế UI/UX': 'WEB105',
  'Lập trình PHP 1': 'WEB2014',
  'Dự án mẫu': 'WEB2041',
  'Dự án mẫu (TKTW)': 'WEB2041',
  'Thiết kế Web với HTML5 & CSS3': 'WEB3023',
  'Thiết kế Web với HTML5&CSS3': 'WEB3023',
  'Tiếng Anh 2.2': 'ENT223',
  'Dự án 1': 'PRO1014',
  'Dự án 1 (TKTW)': 'PRO1014',
  'Quản trị website': 'WEB1023',
  'Marketing trên Internet': 'WEB2055',
  'Lập trình Javascript nâng cao': 'WEB2063',
  'Lập trình JavaScript nâng cao': 'WEB2063',
  'Lập trình ECMAScript': 'WEB501',
  'Kỹ năng làm việc': 'PDP104',
  'Khởi sự doanh nghiệp': 'SYB3013',
  'Lập trình Front-End Framework 1': 'WEB2081',
  'Lập trình Front-End Framework 2': 'WEB2091',
  'Lập trình TypeScript': 'WEB502',
  'NodeJS & Restful Web Service': 'WEB503',
  'Thực tập tốt nghiệp': 'PRO116',
  'Thực tập tốt nghiệp (TKTW)': 'PRO116',
  'Dự án tốt nghiệp': 'PRO2201',
  'Dự án tốt nghiệp (TKTW-Single page Application)': 'PRO2201',
  'Pháp luật': 'VIE1026',
  'Giáo dục quốc phòng': 'VIE104'
};

export const courseCodeToName = Object.fromEntries(
  Object.entries(courseNameToCode).map(([name, code]) => [code, name])
);

export const resolveCourseCode = (courseNameOrId) => {
  const raw = String(courseNameOrId || '').trim();
  return courseNameToCode[raw] || raw.toUpperCase();
};
