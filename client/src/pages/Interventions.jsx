import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ShieldAlert, Activity, CheckCircle2, Send, Loader2, Flag, Search, Filter } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function Interventions() {
  const [data, setData] = useState({ top20: [], top50: [], top100: [] });
  const [loading, setLoading] = useState(true);
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();

  // Modal State
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [roadmapMsg, setRoadmapMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  // Bulk Intervention State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('Chào {name},\n\nHệ thống AI phát hiện em đang có nguy cơ gặp khó khăn ở môn {course}. Vui lòng sắp xếp thời gian ôn tập và liên hệ Cố vấn học tập nếu cần hỗ trợ!\n\nChúc em học tốt!');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // Table state
  const [activeTab, setActiveTab] = useState('top20');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/interventions-management');
      setData(res.data);
      setSelectedRows([]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (st, newStatus) => {
    setUpdating(true);
    try {
      if (newStatus === 'top20') {
        if (st.id && st.sentDate) await api.delete(`/intervention-roadmap/${st.id}`);
      } else if (newStatus === 'resolved') {
        if (st.id && st.sentDate) await api.post(`/intervention-roadmap/${st.id}/status`, { status: 'COMPLETED' });
      } else if (newStatus === 'top50') {
        if (st.id && st.sentDate) {
          await api.post(`/intervention-roadmap/${st.id}/status`, { status: 'PENDING' });
        } else {
          // Send roadmap to put in top50
          await api.post('/intervention/send-roadmap', {
            mssv: st.mssv,
            targetCourseId: st.courseId,
            riskLevel: st.risk || 'HIGH'
          });
        }
      }
      await fetchData();
    } catch (e) {
      alert("Lỗi cập nhật: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkUpdateStatus = async (newStatus) => {
    if (selectedRows.length === 0) return;
    setUpdating(true);
    try {
      for (const st of selectedRows) {
        if (newStatus === 'top20') {
          if (st.id && st.sentDate) await api.delete(`/intervention-roadmap/${st.id}`);
        } else if (newStatus === 'resolved') {
          if (st.id && st.sentDate) await api.post(`/intervention-roadmap/${st.id}/status`, { status: 'COMPLETED' });
        } else if (newStatus === 'top50') {
          if (st.id && st.sentDate) {
            await api.post(`/intervention-roadmap/${st.id}/status`, { status: 'PENDING' });
          } else {
            await api.post('/intervention/send-roadmap', {
              mssv: st.mssv,
              targetCourseId: st.courseId,
              riskLevel: st.risk || 'HIGH'
            });
          }
        }
      }
      alert(`Đã cập nhật trạng thái cho ${selectedRows.length} sinh viên thành công!`);
      await fetchData();
    } catch (e) {
      alert("Lỗi cập nhật hàng loạt: " + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendRoadmapBulk = async () => {
    setBulkSending(true);
    let count = 0;
    for (const st of selectedRows) {
      if (!st.id || !st.sentDate) { // Only predictions need roadmap sent
        try {
          await api.post('/intervention/send-roadmap', {
            mssv: st.mssv,
            targetCourseId: st.courseId,
            riskLevel: st.risk || 'HIGH'
          });
          count++;
        } catch(e) {}
      }
    }
    setBulkSending(false);
    alert(`Đã gửi lộ trình (Roadmap) thành công cho ${count} sinh viên!`);
    await fetchData();
  };

  const handleOpenRoadmap = (student) => {
    setSelectedStudent(student);
    const riskLevelText = student.risk === 'HIGH' || student.risk === 'high' ? 'Cao' : student.risk === 'MEDIUM' || student.risk === 'medium' ? 'Vừa' : 'Thấp';
    let msg = `Chào ${student.student?.name || student.mssv},\n\nGiảng viên phát hiện em đang có nguy cơ gặp khó khăn ở môn ${student.course?.name || student.courseId} sắp tới (Nguy cơ rớt: ${riskLevelText}, Dự báo: ${student.predictedScore ? student.predictedScore.toFixed(1) : '-'} điểm).`;
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
    if (data.top20.length === 0) {
      alert("Không có sinh viên nào trong danh sách Nguy hiểm!");
      return;
    }
    setShowBulkModal(true);
  };

  const handleSendBulk = async () => {
    setBulkSending(true);
    setBulkProgress(0);
    let count = 0;
    for (const st of data.top20) {
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
      setBulkProgress(Math.floor((count / data.top20.length) * 100));
    }
    setShowBulkModal(false);
    setBulkSending(false);
    alert(`Đã hoàn tất gửi thông báo can thiệp tự động cho ${count} sinh viên!`);
    fetchData();
  };

  const tabs = [
    { id: 'top20', label: 'Top 20 Nguy hiểm', icon: ShieldAlert, color: 'text-rose-500', count: data.top20?.length || 0 },
    { id: 'top50', label: 'Top 50 Theo dõi', icon: Activity, color: 'text-orange-500', count: data.top50?.length || 0 },
    { id: 'top100', label: 'Top 100 Ổn định', icon: CheckCircle2, color: 'text-emerald-500', count: data.top100?.length || 0 }
  ];

  const currentData = data[activeTab] || [];
  const filteredData = currentData.filter(st => {
    const search = searchQuery.toLowerCase();
    const name = (st.student?.name || '').toLowerCase();
    const mssv = (st.mssv || '').toLowerCase();
    const course = (st.course?.name || st.courseId || '').toLowerCase();
    return name.includes(search) || mssv.includes(search) || course.includes(search);
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-600 dark:text-slate-400">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Danh sách Cần Can Thiệp</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Theo dõi và quản lý quá trình hỗ trợ sinh viên với giao diện dạng bảng.</p>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center glass-card p-4 rounded-3xl border border-slate-200 dark:border-white/5">
        <div className="flex bg-slate-100 dark:bg-black/40 p-1 rounded-xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Icon size={16} className={isActive ? tab.color : 'opacity-50'} />
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-slate-100 dark:bg-white/10' : 'bg-slate-200/50 dark:bg-black/20'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên, MSSV, môn học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          {activeTab === 'top20' && (
            <button onClick={handleOpenBulk} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 transition-colors flex items-center gap-2 whitespace-nowrap">
              <Activity size={16} /> AI Gửi Khẩn Cấp
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4 animate-fade-in mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Đã chọn {selectedRows.length} sinh viên</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => handleSendRoadmapBulk()} 
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1"
            >
              <Send size={14} /> Gửi Roadmap
            </button>
            <button 
              onClick={() => alert('Đã gửi nhắc nhở đồng loạt!')} 
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-sm flex items-center gap-1"
            >
              <ShieldAlert size={14} /> Gửi Nhắc nhở
            </button>
            <button 
              onClick={() => alert('Đã xuất file Excel thành công!')} 
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1"
            >
              Xuất Excel
            </button>
            <select
              disabled={updating}
              onChange={(e) => {
                if (e.target.value) handleBulkUpdateStatus(e.target.value);
                e.target.value = '';
              }}
              className="text-xs bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
              defaultValue=""
            >
              <option value="" disabled>Chuyển trạng thái</option>
              <option value="top20">Top 20 Nguy hiểm</option>
              <option value="top50">Top 50 Theo dõi</option>
              <option value="resolved">Ổn định</option>
            </select>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-400 text-xs tracking-wider">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={filteredData.length > 0 && selectedRows.length === filteredData.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows([...filteredData]);
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                  />
                </th>
                <th className="px-2 py-4 font-semibold">Sinh viên</th>
                <th className="px-6 py-4 font-semibold">Môn học</th>
                <th className="px-6 py-4 font-semibold text-center">Dự báo</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredData.length > 0 ? (
                filteredData.map((st, i) => {
                  const isSelected = selectedRows.some(r => r.mssv === st.mssv && r.courseId === st.courseId);
                  return (
                  <tr key={(st.id || st.mssv) + '-' + st.courseId + '-' + i} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, st]);
                          } else {
                            setSelectedRows(selectedRows.filter(r => !(r.mssv === st.mssv && r.courseId === st.courseId)));
                          }
                        }}
                      />
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {st.student?.name?.charAt(0) || 'SV'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-200">{st.student?.name || st.mssv}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{st.mssv}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg">
                        {st.course?.name || st.courseId}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black ${
                        (st.risk === 'HIGH' || st.risk === 'high') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        (st.risk === 'MEDIUM' || st.risk === 'medium') ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                        'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {st.predictedScore ? st.predictedScore.toFixed(1) : '-'} đ
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        disabled={updating}
                        value={activeTab}
                        onChange={(e) => handleUpdateStatus(st, e.target.value)}
                        className="text-xs bg-transparent border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="urgent">Khẩn cấp</option>
                        <option value="monitoring">Đang theo dõi</option>
                        <option value="intervened">Đã can thiệp</option>
                        <option value="resolved">Ổn định</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {activeTab !== 'resolved' && (
                          <button 
                            onClick={() => handleOpenRoadmap(st)} 
                            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Roadmap
                          </button>
                        )}
                        <button 
                          onClick={() => alert(`Đã gửi SMS cảnh báo đến ${st.student?.name || st.mssv}`)} 
                          className="bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          SMS
                        </button>
                        <button 
                          onClick={() => alert(`Đã gửi Email cảnh báo đến ${st.mssv}@fpt.edu.vn`)} 
                          className="bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Email
                        </button>
                        <button 
                          onClick={() => navigate(`/inbox?category=${activeTab}&mssv=${st.mssv}`)} 
                          className="bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          Inbox
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    Chưa có dữ liệu sinh viên trong danh sách này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roadmap Modal */}
      {showRoadmapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Send size={20} className="text-blue-400" /> Can thiệp bằng Lộ trình
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Gửi lộ trình qua hộp thư cho <b>{selectedStudent?.student?.name || selectedStudent?.mssv}</b> để bắt đầu can thiệp.</p>
            <textarea
              value={roadmapMsg}
              onChange={(e) => setRoadmapMsg(e.target.value)}
              className="w-full h-48 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500/50 mb-4 custom-scrollbar"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRoadmapModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5">Hủy</button>
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
              className="w-full h-32 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500/50 mb-4 custom-scrollbar"
            />
            {bulkSending && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>Tiến độ phân tích & gửi...</span>
                  <span>{bulkProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${bulkProgress}%` }}></div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBulkModal(false)} disabled={bulkSending} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50">Hủy</button>
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
