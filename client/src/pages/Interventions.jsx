import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ShieldAlert, Activity, CheckCircle2, Send, MessageSquare, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function Interventions() {
  const [data, setData] = useState({ urgent: [], monitoring: [], intervened: [], resolved: [] });
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
    const riskLevelText = student.risk === 'HIGH' || student.risk === 'high' ? 'Cao' : student.risk === 'MEDIUM' || student.risk === 'medium' ? 'Vừa' : 'Thấp';
    let msg = `Chào ${student.student?.name || student.mssv},\n\nGiảng viên phát hiện em đang có nguy cơ gặp khó khăn ở môn ${student.course?.name || student.courseId} sắp tới (Nguy cơ rớt: ${riskLevelText}, Dự báo: ${student.predictedScore.toFixed(1)} điểm).`;
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


  const [draggingItem, setDraggingItem] = useState(null);

  const handleDragStart = (e, st, sourceCol) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ st, sourceCol }));
    setDraggingItem(st);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetCol) => {
    e.preventDefault();
    setDraggingItem(null);
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { st, sourceCol } = JSON.parse(dataStr);
      if (sourceCol === targetCol) return;

      // Optimistic Update
      const newSourceArr = data[sourceCol].filter(item => (item.id || item.mssv) !== (st.id || st.mssv));
      const newTargetArr = [st, ...data[targetCol]];
      setData(prev => ({ ...prev, [sourceCol]: newSourceArr, [targetCol]: newTargetArr }));

      if (sourceCol === 'urgent') {
        const statusMap = { monitoring: 'PENDING', intervened: 'ACTIVE', resolved: 'RESOLVED' };
        await api.post(`/students/${st.mssv}/flag`, {
          courseId: st.courseId,
          action: 'Chuyển trạng thái từ Kanban',
          status: statusMap[targetCol] || 'PENDING'
        });
      } else if (targetCol === 'urgent') {
        if (st.id) await api.delete(`/interventions/${st.id}`);
      } else {
        const statusMap = { monitoring: 'PENDING', intervened: 'ACTIVE', resolved: 'RESOLVED' };
        if (st.id) await api.post(`/interventions/${st.id}/status`, { status: statusMap[targetCol] });
      }

      await fetchData();
    } catch (err) {
      alert("Lỗi cập nhật trạng thái: " + err.message);
      fetchData();
    }
  };

  const renderColumn = (colId, title, colorClass, borderClass, bgClass, Icon, items) => (
    <div
      className={`glass-card rounded-3xl border ${borderClass} flex flex-col h-[700px]`}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, colId)}
    >
      <div className={`p-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-3 ${bgClass} rounded-t-3xl`}>
        <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
        <span className={`ml-auto ${colorClass.replace('bg-', 'text-')} text-xs font-black bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md`}>
          {items.length}
        </span>
      </div>

      {colId === 'urgent' && items.length > 0 && (
        <div className="px-4 pt-4">
          <button onClick={handleOpenBulk} className="w-full bg-white dark:bg-gradient-to-r dark:from-rose-600 dark:to-orange-500 hover:dark:from-rose-500 hover:dark:to-orange-400 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2">
            <Activity size={14} /> AI Gửi Khẩn cấp
          </button>
        </div>
      )}

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl">
            Kéo thả sinh viên vào đây
          </div>
        ) : items.map((st, i) => (
          <div
            key={(st.id || st.mssv) + '-' + st.courseId + '-' + i}
            draggable
            onDragStart={(e) => handleDragStart(e, st, colId)}
            className="bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{st.student?.name || st.mssv}</div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                (st.risk === 'HIGH' || st.risk === 'high') ? 'bg-rose-500/20 text-rose-500' :
                (st.risk === 'MEDIUM' || st.risk === 'medium') ? 'bg-orange-500/20 text-orange-500' : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {st.predictedScore ? st.predictedScore.toFixed(1) : '-'}đ
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              MSSV: <span className="font-mono">{st.mssv}</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium bg-slate-100 dark:bg-white/5 p-2 rounded-xl inline-block mb-3">
              {st.course?.name || st.courseId}
            </div>

            {colId !== 'resolved' && (
              <div className="flex gap-2">
                <button onClick={() => handleOpenRoadmap(st)} className="flex-1 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                  Gửi Lộ trình
                </button>
                <button onClick={() => navigate(`/inbox?category=urgent&mssv=${st.mssv}`)} className="flex-1 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 py-1.5 rounded-lg text-[10px] font-bold transition-colors">
                  Inbox
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const handleOpenBulk = () => {
    if (data.urgent.length === 0) {
      alert("Không có sinh viên nào cần can thiệp!");
      return;
    }
    setShowBulkModal(true);
  };

  const handleSendBulk = async () => {
    setBulkSending(true);
    setBulkProgress(0);
    let count = 0;
    for (const st of data.urgent) {
      const personalizedMsg = bulkMsg.replace('{name}', st.student?.name || st.mssv).replace('{course}', st.course?.name || st.courseId);
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
      setBulkProgress(Math.floor((count / data.urgent.length) * 100));
    }
    setShowBulkModal(false);
    setBulkSending(false);
    alert(`Đã hoàn tất gửi thông báo can thiệp tự động cho ${count} sinh viên!`);
    fetchData();
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-600 dark:text-slate-400">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Quản lý Can thiệp Học vụ</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">Theo dõi và quản lý quá trình hỗ trợ sinh viên từ lúc có nguy cơ đến khi vượt khó thành công.</p>
        <div className="flex gap-4 items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 inline-flex">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Thang điểm dự báo (0-10):</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">{"< 5.0"} (Nguy cơ Cao)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-xs font-semibold text-orange-500 dark:text-orange-400">{"5.0 - 6.5"} (Nguy cơ Trung bình)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">{"> 6.5"} (Nguy cơ Thấp)</span>
          </div>
        </div>
      </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {renderColumn('urgent', 'Cần hỗ trợ khẩn cấp', 'bg-rose-500', 'border-rose-200 dark:border-rose-500/20', 'bg-rose-50 dark:bg-rose-900/10', ShieldAlert, data.urgent || [])}
        {renderColumn('monitoring', 'Đang theo dõi', 'bg-orange-500', 'border-orange-200 dark:border-orange-500/20', 'bg-orange-50 dark:bg-orange-900/10', Activity, data.monitoring || [])}
        {renderColumn('intervened', 'Đã can thiệp', 'bg-blue-500', 'border-blue-200 dark:border-blue-500/20', 'bg-blue-50 dark:bg-blue-900/10', Send, data.intervened || [])}
        {renderColumn('resolved', 'Ổn định', 'bg-emerald-500', 'border-emerald-200 dark:border-emerald-500/20', 'bg-emerald-50 dark:bg-emerald-900/10', CheckCircle2, data.resolved || [])}
      </div>

      {/* Roadmap Modal */}
      {showRoadmapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Send size={20} className="text-blue-400" /> Can thiệp bằng Lộ trình
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Gửi lộ trình qua hộp thư cho <b>{selectedStudent?.student.name}</b> để bắt đầu can thiệp.</p>
            <textarea
              value={roadmapMsg}
              onChange={(e) => setRoadmapMsg(e.target.value)}
              className="w-full h-48 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500/50 mb-4 custom-scrollbar"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRoadmapModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white/5">Hủy</button>
              <button onClick={handleSendRoadmap} disabled={sendingMsg} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50">
                {sendingMsg ? 'Đang gửi...' : 'Gửi & Đưa vào Theo dõi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Intervention Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Activity size={20} className="text-purple-400" /> AI Can thiệp tự động
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Hệ thống sẽ tự động cá nhân hóa thông báo cho <b>{data.urgent.length}</b> sinh viên. Các biến <span className="text-cyan-400 font-mono text-xs">{'{name}'}</span> và <span className="text-cyan-400 font-mono text-xs">{'{course}'}</span> sẽ được điền tự động.
            </p>
            <textarea
              value={bulkMsg}
              onChange={(e) => setBulkMsg(e.target.value)}
              className="w-full h-32 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500/50 mb-4 custom-scrollbar"
            />
            {bulkSending && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>Tiến độ phân tích & gửi...</span>
                  <span>{bulkProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-white dark:bg-gradient-to-r dark:from-purple-500 dark:to-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }}></div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBulkModal(false)} disabled={bulkSending} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white/5 disabled:opacity-50">Hủy</button>
              <button onClick={handleSendBulk} disabled={bulkSending} className="px-4 py-2 bg-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-blue-600 hover:dark:from-purple-500 hover:dark:to-blue-500 text-slate-900 dark:text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 flex items-center gap-2">
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
