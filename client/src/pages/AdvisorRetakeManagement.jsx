import React, { useState, useEffect } from 'react';
import { Check, X, Search, Filter } from 'lucide-react';
import api from '../lib/api';

export default function AdvisorRetakeManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/retake/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id, status) => {
    try {
      await api.post('/retake/approve', { registrationId: id, status });
      // Update local state without refetching to be fast
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    } catch (err) {
      alert('Có lỗi xảy ra: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredRequests = requests.filter(r => filter === 'ALL' || r.status === filter);

  if (loading) return <div className="p-8 text-white">Đang tải yêu cầu học lại...</div>;

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý Đăng ký Học lại</h1>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? 'Chờ duyệt' : f === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
            </button>
          ))}
        </div>
      </div>

      <div className="border bg-slate-900 border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="p-4">Sinh viên</th>
                <th className="p-4">Môn học</th>
                <th className="p-4">Lớp / Giảng viên</th>
                <th className="p-4">Ngày đăng ký</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không có dữ liệu.</td></tr>
              ) : filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="font-bold">{req.student?.mssv}</div>
                    <div className="text-xs text-slate-400">{req.student?.name}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-indigo-300">{req.retakeClass?.courseId}</div>
                    <div className="text-xs text-slate-400">{req.retakeClass?.course?.name}</div>
                  </td>
                  <td className="p-4">
                    <div>{req.retakeClass?.schedule}</div>
                    <div className="text-xs text-slate-400">GV: {req.retakeClass?.lecturerName}</div>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(req.registeredAt).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                      req.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                      req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {req.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAction(req.id, 'APPROVED')}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded transition"
                          title="Phê duyệt"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'REJECTED')}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded transition"
                          title="Từ chối"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
