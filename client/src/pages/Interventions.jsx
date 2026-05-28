import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ShieldAlert, Activity, CheckCircle2, Send, MessageSquare, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function Interventions() {
  const [data, setData] = useState({ atRisk: [], active: [], resolved: [] });
  const [loading, setLoading] = useState(true);
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();
  
  // Roadmap Modal State
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [roadmapMsg, setRoadmapMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Pagination states
  const [showAllAtRisk, setShowAllAtRisk] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllResolved, setShowAllResolved] = useState(false);

  // Bulk Intervention State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('Chào {name},\n\nHệ thống AI phát hiện em đang có nguy cơ gặp khó khăn ở môn {course}. Vui lòng sắp xếp thời gian ôn tập và liên hệ Cố vấn học tập nếu cần hỗ trợ!\n\nChúc em học tốt!');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/interventions-management');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await api.post(`/interventions/${id}/status`, { status });
      await fetchData();
    } catch (e) {
      alert("Lỗi: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenRoadmap = (student) => {
    setSelectedStudent(student);
    let msg = `Chào ${student.student.name},\n\nGiảng viên phát hiện em đang có nguy cơ gặp khó khăn ở môn ${student.course.name} sắp tới (Nguy cơ rớt: ${student.predictedScore.toFixed(1)}%).`;
    msg += `\n\n🎯 Lộ trình cải thiện (AI Đề xuất):\n1. Ôn tập lại ngay kiến thức căn bản.\n2. Cần đặc biệt chú ý cải thiện phần logic và thực hành.\n3. Nếu cần hỗ trợ thêm tài liệu, hãy phản hồi lại qua Hộp thư này.\n\nChúc em học tốt!`;
    setRoadmapMsg(msg);
    setShowRoadmapModal(true);
  };

  const handleSendRoadmap = async () => {
    setSendingMsg(true);
    try {
      await api.post('/comm/messages', {
        senderId: currentUser.id,
        receiverId: selectedStudent.mssv,
        content: roadmapMsg
      });
      // Also flag them as intervened (ACTIVE)
      await api.post(`/students/${selectedStudent.mssv}/flag`, {
        courseId: selectedStudent.courseId,
        action: 'Đã gửi Lộ trình Cải thiện qua Inbox',
        status: 'ACTIVE'
      });
      setShowRoadmapModal(false);
      alert('Đã gửi Lộ trình thành công!');
      fetchData();
    } catch (e) {
      alert('Lỗi gửi tin nhắn: ' + e.message);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleOpenBulk = () => {
    if (data.atRisk.length === 0) {
      alert("Không có sinh viên nào cần can thiệp!");
      return;
    }
    setShowBulkModal(true);
  };

  const handleSendBulk = async () => {
    setBulkSending(true);
    setBulkProgress(0);
    let count = 0;
    for (const st of data.atRisk) {
      const personalizedMsg = bulkMsg.replace('{name}', st.student.name).replace('{course}', st.course.name);
      try {
        await api.post('/comm/messages', {
          senderId: currentUser.id,
          receiverId: st.mssv,
          content: personalizedMsg
        });
        await api.post(`/students/${st.mssv}/flag`, {
          courseId: st.courseId,
          action: 'Đã gửi Can thiệp tự động (AI)',
          status: 'ACTIVE'
        });
      } catch(e) {
        console.error("Error bulk sending to", st.mssv);
      }
      count++;
      setBulkProgress(Math.floor((count / data.atRisk.length) * 100));
    }
    setShowBulkModal(false);
    setBulkSending(false);
    alert(`Đã hoàn tất gửi thông báo can thiệp tự động cho ${count} sinh viên!`);
    fetchData();
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Quản lý Can thiệp Học vụ</h2>
        <p className="text-slate-400 text-sm">Theo dõi và quản lý quá trình hỗ trợ sinh viên từ lúc có nguy cơ đến khi vượt khó thành công.</p>
      </div>

      {/* Table 1: At Risk */}
      <div className="glass-card rounded-3xl border border-rose-500/20 overflow-hidden relative">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <ShieldAlert size={24} className="text-rose-500" />
          <h3 className="text-xl font-bold text-white">1. Sinh viên có nguy cơ (Chưa can thiệp)</h3>
          <span className="bg-rose-500/20 text-rose-400 text-xs px-3 py-1 rounded-full font-bold ml-auto">{data.atRisk.length} sinh viên</span>
          {data.atRisk.length > 0 && (
            <button onClick={handleOpenBulk} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2">
              <Activity size={16} /> AI Can thiệp hàng loạt
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          {data.atRisk.length === 0 ? (
            <div className="p-8 text-center text-emerald-400">Không có sinh viên nào đang trong diện nguy cơ mà chưa được can thiệp.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Sinh viên</th>
                  <th className="px-6 py-4">Môn học</th>
                  <th className="px-6 py-4">Dự báo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(showAllAtRisk ? data.atRisk : data.atRisk.slice(0, 5)).map((st) => (
                  <tr key={`${st.mssv}-${st.courseId}`} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{st.student.name}</div>
                      <div className="text-slate-500 text-xs">{st.mssv}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{st.course.name}</td>
                    <td className="px-6 py-4"><span className="text-rose-400 font-bold">{st.predictedScore.toFixed(1)}% Nguy cơ</span></td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenRoadmap(st)} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg">
                        Can thiệp ngay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {data.atRisk.length > 5 && (
          <div className="p-4 border-t border-white/5 text-center">
            <button onClick={() => setShowAllAtRisk(!showAllAtRisk)} className="text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors">
              {showAllAtRisk ? 'Thu gọn danh sách' : `Xem thêm ${data.atRisk.length - 5} sinh viên...`}
            </button>
          </div>
        )}
      </div>

      {/* Table 2: Active */}
      <div className="glass-card rounded-3xl border border-blue-500/20 overflow-hidden relative">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Activity size={24} className="text-blue-500" />
          <h3 className="text-xl font-bold text-white">2. Đang can thiệp & Theo dõi</h3>
          <span className="ml-auto bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-bold">{data.active.length} sinh viên</span>
        </div>
        <div className="overflow-x-auto">
          {data.active.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Không có can thiệp nào đang diễn ra.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Sinh viên</th>
                  <th className="px-6 py-4">Môn học</th>
                  <th className="px-6 py-4">Chi tiết Can thiệp</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(showAllActive ? data.active : data.active.slice(0, 5)).map((st) => (
                  <tr key={st.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{st.student.name}</div>
                      <div className="text-slate-500 text-xs">{st.mssv}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{st.course.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-blue-400 text-xs max-w-xs truncate">{st.action}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{new Date(st.createdAt).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(`/inbox?category=urgent&mssv=${st.mssv}`)} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors tooltip-trigger" title="Mở hộp thư">
                          <MessageSquare size={16} />
                        </button>
                        <button onClick={() => handleUpdateStatus(st.id, 'RESOLVED')} disabled={updating} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg">
                          Đã Vượt Khó
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {data.active.length > 5 && (
          <div className="p-4 border-t border-white/5 text-center">
            <button onClick={() => setShowAllActive(!showAllActive)} className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              {showAllActive ? 'Thu gọn danh sách' : `Xem thêm ${data.active.length - 5} sinh viên...`}
            </button>
          </div>
        )}
      </div>

      {/* Table 3: Resolved */}
      <div className="glass-card rounded-3xl border border-emerald-500/20 overflow-hidden relative">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <CheckCircle2 size={24} className="text-emerald-500" />
          <h3 className="text-xl font-bold text-white">3. Đã vượt khó thành công</h3>
          <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold">{data.resolved.length} sinh viên</span>
        </div>
        <div className="overflow-x-auto">
          {data.resolved.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Chưa có dữ liệu thành công.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Sinh viên</th>
                  <th className="px-6 py-4">Môn học</th>
                  <th className="px-6 py-4">Kết quả</th>
                  <th className="px-6 py-4 text-right">Ngày ghi nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(showAllResolved ? data.resolved : data.resolved.slice(0, 5)).map((st) => (
                  <tr key={st.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{st.student.name}</div>
                      <div className="text-slate-500 text-xs">{st.mssv}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{st.course.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg text-xs font-bold">Thành công</span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 text-xs">
                      {new Date(st.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {data.resolved.length > 5 && (
          <div className="p-4 border-t border-white/5 text-center">
            <button onClick={() => setShowAllResolved(!showAllResolved)} className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              {showAllResolved ? 'Thu gọn danh sách' : `Xem thêm ${data.resolved.length - 5} sinh viên...`}
            </button>
          </div>
        )}
      </div>

      {/* Roadmap Modal */}
      {showRoadmapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Send size={20} className="text-blue-400" /> Can thiệp bằng Lộ trình
            </h3>
            <p className="text-xs text-slate-400 mb-4">Gửi lộ trình qua hộp thư cho <b>{selectedStudent?.student.name}</b> để bắt đầu can thiệp.</p>
            <textarea
              value={roadmapMsg}
              onChange={(e) => setRoadmapMsg(e.target.value)}
              className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-200 outline-none focus:border-blue-500/50 mb-4 custom-scrollbar"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRoadmapModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5">Hủy</button>
              <button onClick={handleSendRoadmap} disabled={sendingMsg} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50">
                {sendingMsg ? 'Đang gửi...' : 'Gửi & Đưa vào Theo dõi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Intervention Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Activity size={20} className="text-purple-400" /> AI Can thiệp tự động
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Hệ thống sẽ tự động cá nhân hóa thông báo cho <b>{data.atRisk.length}</b> sinh viên. Các biến <span className="text-cyan-400 font-mono text-xs">{'{name}'}</span> và <span className="text-cyan-400 font-mono text-xs">{'{course}'}</span> sẽ được điền tự động.
            </p>
            <textarea
              value={bulkMsg}
              onChange={(e) => setBulkMsg(e.target.value)}
              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-200 outline-none focus:border-purple-500/50 mb-4 custom-scrollbar"
            />
            {bulkSending && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Tiến độ phân tích & gửi...</span>
                  <span>{bulkProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }}></div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBulkModal(false)} disabled={bulkSending} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-50">Hủy</button>
              <button onClick={handleSendBulk} disabled={bulkSending} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 flex items-center gap-2">
                {bulkSending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} 
                {bulkSending ? 'Đang xử lý...' : 'Bắt đầu Phân tích & Gửi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
