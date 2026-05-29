const fs = require('fs');
const path = require('path');

class SyllabusLoader {
  constructor() {
    this.syllabusPath = path.join(__dirname, '../../../../data/syllabus.json');
    this.prereqPath = path.join(__dirname, '../../../../data/prerequisite_map.json');
  }

  init() {
    try {
      console.log('📚 [SyllabusLoader] Nạp dữ liệu Syllabus vào RAM...');
      
      let syllabusData = [];
      let prereqData = {};

      if (fs.existsSync(this.syllabusPath)) {
        syllabusData = JSON.parse(fs.readFileSync(this.syllabusPath, 'utf8'));
      } else {
        console.warn(`[SyllabusLoader] Không tìm thấy file syllabus tại: ${this.syllabusPath}`);
      }

      if (fs.existsSync(this.prereqPath)) {
        prereqData = JSON.parse(fs.readFileSync(this.prereqPath, 'utf8'));
      }

      // Khởi tạo global cache
      global.SyllabusCache = new Map();
      global.PrerequisiteCache = new Map();

      syllabusData.forEach(course => {
        global.SyllabusCache.set(course.courseCode, course);
        // Map cả tên môn học phòng khi cần lookup bằng tên
        global.SyllabusCache.set(course.courseName.toLowerCase(), course);
      });

      for (const [courseCode, data] of Object.entries(prereqData)) {
        global.PrerequisiteCache.set(courseCode, data);
      }

      console.log(`✅ [SyllabusLoader] Nạp thành công ${syllabusData.length} môn học và ${Object.keys(prereqData).length} prereq maps.`);
    } catch (error) {
      console.error('❌ [SyllabusLoader] Lỗi khi nạp dữ liệu:', error);
    }
  }
}

module.exports = new SyllabusLoader();
