const syllabusEngine = require('./syllabusEngine');

class InterventionEngine {
  
  generatePersonalizedIntervention(studentId, courseCode, predictedScore, studentData) {
    const course = syllabusEngine.getCourseDetails(courseCode);
    const prereqs = syllabusEngine.getPrerequisites(courseCode);
    
    let message = `Hệ thống ghi nhận bạn đang có rủi ro học tập ở môn **${course ? course.courseName : courseCode}** `;
    message += `(Điểm dự báo: **${predictedScore.toFixed(1)}**).\n\n`;
    
    if (course) {
      // Giả lập phân tích topic yếu (nếu có dữ liệu thật thì thay thế)
      const missingTopic = course.topics[0] || 'các phần cơ bản';
      message += `Dựa trên tiến độ, có vẻ bạn đang gặp khó khăn ở phần **${missingTopic}**. `;
      message += `Bạn cần sắp xếp thêm thời gian (${course.recommendedStudyHours} giờ tổng cộng) để hoàn thành môn này.\n\n`;
      
      // Check next courses that require this course
      let requiredFor = [];
      if (global.PrerequisiteCache) {
        for (const [nextCourseCode, prereqData] of global.PrerequisiteCache.entries()) {
          if (prereqData.requires && prereqData.requires.includes(courseCode)) {
            requiredFor.push(nextCourseCode);
          }
        }
      }
      
      if (requiredFor.length > 0) {
        message += `⚠️ Đừng quên, đây là môn nền tảng bắt buộc để bạn có thể học tiếp các môn **${requiredFor.join(', ')}** ở học kỳ sau. Vui lòng cải thiện ngay nhé!`;
      }
    } else {
      message += `Vui lòng liên hệ giảng viên để được hỗ trợ cải thiện lộ trình học.`;
    }
    
    return message;
  }
  
  generateClassAggregateIntervention(classId, courseCode, riskCount, totalCount) {
    const course = syllabusEngine.getCourseDetails(courseCode);
    const percent = ((riskCount / totalCount) * 100).toFixed(1);
    
    const criticalTopic = course ? course.topics[Math.floor(Math.random() * course.topics.length)] : 'các khái niệm cốt lõi';
    
    let message = `Lớp **${classId}** hiện có **${riskCount}** sinh viên (chiếm ${percent}%) đang có nguy cơ rớt môn **${courseCode}**.\n\n`;
    message += `Phân tích Syllabus cho thấy đa số sinh viên đang vướng mắc ở chủ đề **${criticalTopic}**.\n`;
    message += `Đề xuất: Cần mở buổi phụ đạo gấp về phần này.`;
    
    return message;
  }
}

module.exports = new InterventionEngine();
