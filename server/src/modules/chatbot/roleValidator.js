function validateRole(userRole, targetMssv, userId, targetIntent) {
  const isStudent = userRole === 'STUDENT';

  // Enforce role security: STUDENT cannot view other student's profile
  if (isStudent && targetMssv && userId && targetMssv.toUpperCase() !== userId.toUpperCase()) {
    console.warn(`[SECURITY] Blocked student ${userId} attempting to view target student ${targetMssv}`);
    return {
      allowed: false,
      reason: '🔒 BẢO MẬT HỆ THỐNG\n\nXin lỗi, bạn không có quyền xem dữ liệu phân tích của sinh viên khác. Bạn chỉ có thể tự tra cứu cho chính mình.'
    };
  }

  // Enforce role security: STUDENT cannot view class level analytics
  if (isStudent && targetIntent === 'CLASS_ANALYTICS_INTENT') {
    console.warn(`[SECURITY] Blocked student ${userId} attempting to view CLASS_ANALYTICS`);
    return {
      allowed: false,
      reason: '🔒 BẢO MẬT HỆ THỐNG\n\nXin lỗi, bạn không có quyền xem dữ liệu quản trị lớp học. Bạn chỉ có thể tra cứu thông tin của chính mình.'
    };
  }

  return { allowed: true };
}

module.exports = {
  validateRole
};
