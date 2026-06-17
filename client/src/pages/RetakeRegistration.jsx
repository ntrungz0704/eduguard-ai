import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, Search, Info } from 'lucide-react';
import api from '../lib/api';

export default function RetakeRegistration() {
  const [eligibleCourses, setEligibleCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [coursesRes, historyRes] = await Promise.all([
        api.get('/retake/eligible-courses'),
        api.get('/retake/history')
      ]);
      setEligibleCourses(coursesRes.data.courses || []);
      setHistory(historyRes.data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (courseId) => {
    setSelectedCourseId(courseId);
    try {
      const res = await api.get(`/retake/classes?courseId=${courseId}`);
      setAvailableClasses(res.data.classes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (classId) => {
    try {
      setRegistering(true);
      await api.post('/retake/register', { retakeClassId: classId });
      alert('Đăng ký thành công! Vui lòng chờ phê duyệt.');
      fetchInitialData();
      setSelectedCourseId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi đăng ký.');
    } finally {
      setRegistering(false);
    }
  };

  const renderStatus = (status) => {
    switch(status) {
      case 'PENDING': return <span className="px-2 py-1 text-xs font-bold rounded-md bg-amber-500/20 text-amber-400">Đang chờ duyệt</span>;
      case 'APPROVED': return <span className="px-2 py-1 text-xs font-bold rounded-md bg-emerald-500/20 text-emerald-400">Đã chấp thuận</span>;
      case 'REJECTED': return <span className="px-2 py-1 text-xs font-bold rounded-md bg-rose-500/20 text-rose-400">Đã từ chối</span>;
      default: return null;
    }
  };

  if (loading) return <div className="p-8 text-white">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-6xl p-6 mx-auto space-y-8 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Đăng ký Học lại</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* LEFT COLUMN: ELIGIBLE COURSES */}
        <section className="p-6 border rounded-xl bg-slate-900 border-slate-800">
          <h2 className="flex items-center gap-2 mb-4 text-lg font-bold">
            <AlertTriangle className="text-rose-500" />
            Môn học Cần học lại
          </h2>
          <div className="space-y-4">
            {eligibleCourses.length === 0 ? (
              <p className="text-sm text-slate-400">Chúc mừng! Bạn không có môn nào phải học lại.</p>
            ) : eligibleCourses.map(course => (
              <div 
                key={course.scoreId} 
                className={`p-4 rounded-lg cursor-pointer transition-colors border ${selectedCourseId === course.courseId ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}
                onClick={() => handleSelectCourse(course.courseId)}
              >
                <div className="flex justify-between mb-2">
                  <h3 className="font-bold">{course.courseId} - {course.courseName}</h3>
                  <span className="text-sm text-slate-400">{course.credits} TC</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-rose-400">Điểm: {course.currentScore}</span>
                  {course.priorityLevel === 'CRITICAL' && (
                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded">Ưu tiên: CAO</span>
                  )}
                </div>
                {course.priorityLevel === 'CRITICAL' && (
                  <p className="mt-2 text-xs text-rose-300">
                    <Info size={12} className="inline mr-1" />
                    {course.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT COLUMN: AVAILABLE CLASSES */}
        <section className="p-6 border rounded-xl bg-slate-900 border-slate-800">
          <h2 className="flex items-center gap-2 mb-4 text-lg font-bold">
            <Search className="text-indigo-400" />
            Lớp mở dự kiến
          </h2>
          {!selectedCourseId ? (
            <p className="text-sm text-slate-400">Vui lòng chọn 1 môn học bên trái để xem lớp.</p>
          ) : (
            <div className="space-y-4">
              {availableClasses.length === 0 ? (
                <p className="text-sm text-slate-400">Hiện chưa có lớp mở cho môn này.</p>
              ) : availableClasses.map(cls => (
                <div key={cls.id} className="p-4 border rounded-lg bg-slate-800/50 border-slate-700">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-bold text-indigo-300">GV: {cls.lecturerName}</h3>
                    <span className="text-xs text-slate-400">Còn {cls.availableSeats}/{cls.totalSeats} chỗ</span>
                  </div>
                  <p className="mb-4 text-sm text-slate-300">Lịch học: {cls.schedule}</p>
                  <button 
                    onClick={() => handleRegister(cls.id)}
                    disabled={registering || cls.availableSeats <= 0}
                    className="w-full py-2 text-sm font-bold text-white transition bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cls.availableSeats <= 0 ? 'Hết chỗ' : 'Đăng ký vào lớp này'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* HISTORY SECTION */}
      <section className="p-6 border rounded-xl bg-slate-900 border-slate-800">
        <h2 className="flex items-center gap-2 mb-4 text-lg font-bold">
          <Clock className="text-slate-400" />
          Lịch sử Đăng ký
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có lịch sử đăng ký học lại.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/50 text-slate-300">
                <tr>
                  <th className="p-3">Môn học</th>
                  <th className="p-3">Giảng viên</th>
                  <th className="p-3">Lịch học</th>
                  <th className="p-3">Ngày đăng ký</th>
                  <th className="p-3 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="p-3">{item.retakeClass?.course?.id} - {item.retakeClass?.course?.name}</td>
                    <td className="p-3">{item.retakeClass?.lecturerName}</td>
                    <td className="p-3">{item.retakeClass?.schedule}</td>
                    <td className="p-3 text-slate-400">{new Date(item.registeredAt).toLocaleDateString('vi-VN')}</td>
                    <td className="p-3 text-right">{renderStatus(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
