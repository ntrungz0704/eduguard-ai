const roadmapTemplates = {
  getTemplate(courseId, durationWeeks) {
    if (durationWeeks === 4) {
      return {
        title: `Lộ trình cấp tốc 4 tuần cải thiện điểm ${courseId}`,
        description: `Đây là lộ trình được EduGuard AI thiết kế riêng dựa trên điểm yếu của bạn, tập trung vào những lỗ hổng chí mạng để bạn có thể vượt qua môn ${courseId} trong thời gian ngắn nhất.`,
        weeks: [
          {
            week: 1,
            focus: 'Ôn tập nền tảng cốt lõi',
            tasks: ['Xem lại slide bài giảng chương 1, 2', 'Làm quiz ôn tập trắc nghiệm', 'Thực hành các bài lab cơ bản bị thiếu']
          },
          {
            week: 2,
            focus: 'Lấp lỗ hổng kiến thức',
            tasks: ['Tham gia 1 buổi phụ đạo với giảng viên', 'Thực hành lại bài tập lớn phần 1', 'Giải quyết các bài tập khó trong tuần']
          },
          {
            week: 3,
            focus: 'Luyện tập nâng cao',
            tasks: ['Làm bài test thử với thời gian giới hạn', 'Ôn tập chương 3, 4', 'Sửa lỗi các bài lab điểm thấp']
          },
          {
            week: 4,
            focus: 'Tổng duyệt và thi thử',
            tasks: ['Làm bài thi thử cuối kỳ', 'Xem lại các lỗi thường gặp', 'Tổng kết kiến thức toàn môn học']
          }
        ]
      };
    }

    return {
      title: `Lộ trình tiêu chuẩn 8 tuần làm chủ ${courseId}`,
      description: `Lộ trình tiêu chuẩn giúp bạn xây dựng nền tảng vững chắc và đạt điểm cao trong môn ${courseId}.`,
      weeks: [
        { week: 1, focus: 'Khởi động & Nền tảng', tasks: ['Đọc giáo trình', 'Làm quen công cụ'] },
        { week: 2, focus: 'Kiến thức cơ bản', tasks: ['Làm lab 1, 2', 'Xem lại video bài giảng'] },
        { week: 3, focus: 'Ứng dụng cơ bản', tasks: ['Thực hành Assignment phần 1', 'Làm quiz 1-3'] },
        { week: 4, focus: 'Kiểm tra giữa kỳ', tasks: ['Thi thử giữa kỳ', 'Sửa bài tập'] },
        { week: 5, focus: 'Kiến thức nâng cao', tasks: ['Làm lab 3, 4', 'Đọc thêm tài liệu mở rộng'] },
        { week: 6, focus: 'Ứng dụng nâng cao', tasks: ['Thực hành Assignment phần 2', 'Làm quiz 4-6'] },
        { week: 7, focus: 'Hoàn thiện dự án', tasks: ['Bảo vệ thử Assignment', 'Sửa lỗi code'] },
        { week: 8, focus: 'Tổng duyệt', tasks: ['Thi thử cuối kỳ', 'Nộp bài hoàn chỉnh'] }
      ]
    };
  }
};

module.exports = roadmapTemplates;
