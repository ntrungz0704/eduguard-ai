class SyllabusEngine {
  getCourseDetails(query) {
    if (!global.SyllabusCache) return null;
    
    // query could be courseCode (WEB101) or name (Xây dựng Website)
    const lowerQuery = query.toLowerCase();
    
    if (global.SyllabusCache.has(query)) {
      return global.SyllabusCache.get(query);
    }
    
    if (global.SyllabusCache.has(lowerQuery)) {
      return global.SyllabusCache.get(lowerQuery);
    }
    
    // Tìm kiếm tương đối bằng name
    for (const [key, course] of global.SyllabusCache.entries()) {
      if (typeof key === 'string' && key.includes(lowerQuery)) {
        return course;
      }
    }
    
    return null;
  }

  getPrerequisites(courseCode) {
    if (!global.PrerequisiteCache) return null;
    return global.PrerequisiteCache.get(courseCode) || null;
  }
  
  formatCourseInfoResponse(course) {
    if (!course) return "Xin lỗi, tôi không tìm thấy thông tin cho môn học này trong hệ thống syllabus.";
    
    return `Môn **${course.courseName} (${course.courseCode})** là một môn học có độ khó **${course.difficulty}**, yêu cầu khoảng ${course.recommendedStudyHours} giờ học.
- **Nội dung chính:** ${course.topics.join(', ')}.
- **Chuẩn đầu ra:** ${course.learningOutcomes.join(', ')}.`;
  }

  formatPrerequisiteResponse(course, prereqs) {
    if (!course) return "Xin lỗi, tôi không tìm thấy môn học này.";
    if (!prereqs || (!prereqs.requires.length && !prereqs.recommended.length)) {
      return `Môn **${course.courseName} (${course.courseCode})** không có môn học tiên quyết bắt buộc nào.`;
    }
    
    let res = `Để học tốt môn **${course.courseName} (${course.courseCode})**:`;
    if (prereqs.requires && prereqs.requires.length > 0) {
      res += `\n- Bắt buộc học trước: **${prereqs.requires.join(', ')}**.`;
    }
    if (prereqs.recommended && prereqs.recommended.length > 0) {
      res += `\n- Khuyên dùng học trước: **${prereqs.recommended.join(', ')}**.`;
    }
    return res;
  }
}

module.exports = new SyllabusEngine();
