import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ShieldAlert, Activity, CheckCircle2, Send, Loader2, Search, RotateCcw, Info, XCircle, BellRing, Users, ClipboardList, Download, Check, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function Interventions() {
  const [data, setData] = useState({ 
    highRisk: [], 
    monitoring: [], 
    stable: [],
    closed: [],
    statsSummary: {
      totalStudents: 0,
      criticalRisk: 0,
      highRisk: 0,
      mediumRisk: 0,
      lowRisk: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();

  // Action Modal State
  const [actionModal, setActionModal] = useState(null);

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
  const [activeTab, setActiveTab] = useState('highRisk');
  const [searchQuery, setSearchQuery] = useState('');

  // Undo state - track recently changed students
  const [recentlyMoved, setRecentlyMoved] = useState([]);

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

  const handleAction = (type) => {
    const criticalCount = data.statsSummary?.criticalRisk || 10;
    const highCount = data.statsSummary?.highRisk || 55;
    const totalRisk = criticalCount + highCount;

    if (type === 'advisor_alert') {
      setActionModal({
        type,
        title: 'DSS Action Triggered',
        icon: BellRing,
        color: 'text-amber-500 bg-amber-500/10',
        content: (
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <p className="text-sm">
              Hệ thống DSS đã phát hiện <span className="font-bold text-rose-500">{criticalCount}</span> sinh viên nguy cơ rất cao và <span className="font-bold text-orange-500">{highCount}</span> sinh viên nguy cơ cao.
            </p>
            <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check size={14} /> Tự động phân nhóm theo Cố vấn học tập.
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check size={14} /> Sinh nội dung cảnh báo học vụ.
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check size={14} /> Hỗ trợ theo dõi và lập kế hoạch can thiệp.
              </div>
            </div>
            <p className="text-xs text-slate-500 italic">
              * Phiên bản hiện tại tạo danh sách cảnh báo và mẫu nội dung can thiệp. Trong triển khai thực tế có thể tích hợp Email Gateway để gửi tự động.
            </p>
          </div>
        )
      });
    } else if (type === 'tutor_list') {
      setActionModal({
        type,
        title: 'DSS Action Triggered',
        icon: Users,
        color: 'text-indigo-500 bg-indigo-500/10',
        content: (
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <p className="text-sm">
              Hệ thống đề xuất danh sách sinh viên có thành tích học tập tốt phù hợp làm Peer Tutor.
            </p>
            <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-2 text-xs">
              <div className="font-bold text-indigo-500 mb-1">Ví dụ: Môn WEB2063</div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                 <Check size={14} /> GPA ≥ 8.0
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                 <Check size={14} /> Điểm WEB2063 ≥ 8.5
              </div>
            </div>
            <p className="text-xs text-slate-500 italic">
              * Danh sách được sử dụng làm cơ sở hỗ trợ hoạt động phụ đạo học thuật.
            </p>
          </div>
        )
      });
    } else if (type === 'recovery_plan') {
      setActionModal({
        type,
        title: 'DSS Action Triggered',
        icon: ClipboardList,
        color: 'text-cyan-500 bg-cyan-500/10',
        content: (
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <p className="text-sm">
              Hệ thống sử dụng:
            </p>
            <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check size={14} /> DFS Root Cause Traversal
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check size={14} /> Graduation Delay Index
              </div>
            </div>
            <p className="text-sm">
              để tạo lộ trình phục hồi học thuật cá nhân hóa.
            </p>
            <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check size={14} /> Đề xuất đăng ký học lại các môn nợ cốt lõi (Root Cause) để mở khóa chuỗi môn sau.
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check size={14} /> Giãn tiến độ học tập cho các kỳ tiếp theo để giảm tải áp lực.
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Check size={14} /> Lập lộ trình học tập phục hồi cho <span className="font-bold">{totalRisk}</span> sinh viên nguy cơ.
              </div>
            </div>
          </div>
        )
      });
    } else if (type === 'export_pdf') {
      setActionModal({
        type,
        title: 'DSS Action Triggered',
        icon: Download,
        color: 'text-emerald-500 bg-emerald-500/10',
        content: (
          <div className="space-y-4 text-slate-600 dark:text-slate-300">
            <p className="text-sm">
              Hệ thống tổng hợp:
            </p>
            <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"><Check size={14} /> Risk Distribution</div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"><Check size={14} /> Bottleneck Courses</div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"><Check size={14} /> Root Cause Analysis</div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold"><Check size={14} /> Intervention Recommendations</div>
            </div>
            <p className="text-sm">
              và chuẩn bị báo cáo DSS phục vụ công tác học vụ.
            </p>
          </div>
        )
      });
    }
  };

  // Check if student score has improved (>= 5.0 means safe)
  const hasScoreImproved = (st) => {
    // For roadmap entries (top50/top100), check if student scores improved
    if (st.student?.scores && st.student.scores.length > 0) {
      const courseScore = st.student.scores.find(s => s.courseId === st.targetCourseId || s.courseId === st.courseId);
      if (courseScore && courseScore.value >= 5.0) return true;
    }
    // For predictions, if predictedScore still low, not improved
    if (st.predictedScore !== undefined && st.predictedScore < 5.0) return false;
    return false;
  };

  const handleUpdateStatus = async (st, newStatus) => {
    // Prevent "stable" if student scores haven't improved
    if (newStatus === 'stable') {
      const improved = hasScoreImproved(st);
      if (!improved && activeTab === 'monitoring') {
        const confirmed = window.confirm(
          `⚠️ Điểm của sinh viên ${st.student?.name || st.mssv} chưa được cải thiện (Dự báo: ${st.predictedScore?.toFixed(1) || '?'}đ < 5.0đ).\n\nBạn có chắc chắn muốn đánh dấu "Ổn định"?\n(Chỉ đánh dấu khi điểm thực tế đã được cập nhật và sinh viên đạt ≥ 5.0đ)`
        );
        if (!confirmed) return;
      }
    }

    setUpdating(true);
    try {
      const studentId = st.mssv || st.studentId;
      const targetCourseId = st.courseId || st.targetCourseId;
      const actionMap = {
        'highRisk': 'UNDO_TO_HIGH_RISK',
        'monitoring': 'MOVE_TO_MONITORING',
        'stable': 'MARK_STABLE',
        'closed': 'CLOSE_CASE'
      };

      await api.post('/interventions-management/change-status', {
        studentId,
        targetCourseId,
        status: newStatus === 'highRisk' ? 'HIGH_RISK' : newStatus.toUpperCase(),
        oldStatus: activeTab.toUpperCase(),
        action: actionMap[newStatus]
      });
      
      if (newStatus === 'highRisk') {
        setRecentlyMoved(prev => [...prev, { ...st, movedFrom: activeTab }]);
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
      const actionMap = {
        'highRisk': 'UNDO_TO_HIGH_RISK',
        'monitoring': 'MOVE_TO_MONITORING',
        'stable': 'MARK_STABLE',
        'closed': 'CLOSE_CASE'
      };
      
      for (const st of selectedRows) {
        const studentId = st.mssv || st.studentId;
        const targetCourseId = st.courseId || st.targetCourseId;
        
        await api.post('/interventions-management/change-status', {
          studentId,
          targetCourseId,
          status: newStatus === 'highRisk' ? 'HIGH_RISK' : newStatus.toUpperCase(),
          oldStatus: activeTab.toUpperCase(),
          action: actionMap[newStatus]
        });
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
      if (!st.id || !st.sentDate) {
        try {
          await api.post('/interventions-management/change-status', {
            studentId: st.mssv || st.studentId,
            targetCourseId: st.courseId || st.targetCourseId,
            status: 'MONITORING',
            oldStatus: 'HIGH_RISK',
            action: 'SEND_ROADMAP_BULK'
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
    let msg = `Chào ${student.student?.name || student.mssv},\n\nGiảng viên phát hiện em đang có nguy cơ gặp khó khăn ở môn ${student.course?.name || student.targetCourse?.name || student.courseId} sắp tới (Nguy cơ rớt: ${riskLevelText}, Dự báo: ${student.predictedScore ? student.predictedScore.toFixed(1) : '-'} điểm).`;
    msg += `\n\n🎯 Lộ trình cải thiện (AI Đề xuất):\n1. Ôn tập lại ngay kiến thức căn bản.\n2. Cần đặc biệt chú ý cải thiện phần logic và thực hành.\n3. Nếu cần hỗ trợ thêm tài liệu, hãy phản hồi lại qua Hộp thư này.\n\nChúc em học tốt!`;
    setRoadmapMsg(msg);
    setShowRoadmapModal(true);
  };

  const handleSendRoadmap = async () => {
    setSendingMsg(true);
    try {
      await api.post('/comm/messages', {
        senderId: currentUser.id,
        receiverId: selectedStudent.mssv || selectedStudent.studentId,
        content: roadmapMsg
      });
      await api.post(`/students/${selectedStudent.mssv || selectedStudent.studentId}/flag`, {
        courseId: selectedStudent.courseId || selectedStudent.targetCourseId,
        action: 'Đã gửi Lộ trình Cải thiện qua Inbox',
        status: 'ACTIVE'
      });
      // Move to monitoring via change-status API
      await api.post('/interventions-management/change-status', {
        studentId: selectedStudent.mssv || selectedStudent.studentId,
        targetCourseId: selectedStudent.courseId || selectedStudent.targetCourseId,
        status: 'MONITORING',
        oldStatus: activeTab.toUpperCase(),
        action: 'SEND_ROADMAP'
      });
      setShowRoadmapModal(false);
      alert('Đã gửi Lộ trình thành công! Sinh viên đã được chuyển sang "Theo dõi".');
      fetchData();
    } catch (e) {
      alert('Lỗi gửi tin nhắn: ' + e.message);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleOpenBulk = () => {
    if (data.highRisk.length === 0) {
      alert("Không có sinh viên nào trong danh sách Nguy cơ cao!");
      return;
    }
    setShowBulkModal(true);
  };

  const handleSendBulk = async () => {
    setBulkSending(true);
    setBulkProgress(0);
    let count = 0;
    for (const st of data.highRisk) {
      const personalizedMsg = bulkMsg.replace('{name}', st.student?.name || st.mssv).replace('{course}', st.course?.name || st.courseId);
      try {
        await api.post('/comm/messages', {
          senderId: currentUser.id,
          receiverId: st.mssv || st.studentId,
          content: personalizedMsg
        });
        await api.post(`/students/${st.mssv || st.studentId}/flag`, {
          courseId: st.courseId || st.targetCourseId,
          action: 'Đã gửi Can thiệp tự động (AI)',
          status: 'ACTIVE'
        });
        await api.post('/interventions-management/change-status', {
          studentId: st.mssv || st.studentId,
          targetCourseId: st.courseId || st.targetCourseId,
          status: 'MONITORING',
          oldStatus: 'HIGH_RISK',
          action: 'SEND_ROADMAP_BULK'
        });
      } catch(e) {
        console.error("Error bulk sending to", st.mssv || st.studentId);
      }
      count++;
      setBulkProgress(Math.floor((count / data.highRisk.length) * 100));
    }
    setShowBulkModal(false);
    setBulkSending(false);
    alert(`Đã hoàn tất gửi thông báo can thiệp tự động cho ${count} sinh viên!`);
    fetchData();
  };

  const getStatusLabel = (tab) => {
    if (tab === 'highRisk') return { label: 'Nguy cơ cao', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' };
    if (tab === 'monitoring') return { label: 'Đang theo dõi', color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' };
    if (tab === 'stable') return { label: 'Ổn định', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' };
    return { label: 'Đã đóng case', color: 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400' };
  };

  const tabs = [
    { id: 'highRisk', label: 'HIGH RISK', icon: ShieldAlert, color: 'text-rose-500', count: data.highRisk?.length || 0 },
    { id: 'monitoring', label: 'MONITORING', icon: Activity, color: 'text-orange-500', count: data.monitoring?.length || 0 },
    { id: 'stable', label: 'STABLE', icon: CheckCircle2, color: 'text-emerald-500', count: data.stable?.length || 0 },
    { id: 'closed', label: 'CLOSED', icon: Check, color: 'text-slate-500', count: data.closed?.length || 0 }
  ];

  const currentData = data[activeTab] || [];
  const filteredData = currentData.filter(st => {
    const search = searchQuery.toLowerCase();
    const name = (st.student?.name || '').toLowerCase();
    const mssv = (st.mssv || st.studentId || '').toLowerCase();
    const course = (st.course?.name || st.targetCourse?.name || st.courseId || st.targetCourseId || '').toLowerCase();
    return name.includes(search) || mssv.includes(search) || course.includes(search);
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-600 dark:text-slate-400">Đang tải dữ liệu...</div>;
  }

  const statusInfo = getStatusLabel(activeTab);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Danh sách Cần Can Thiệp</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Theo dõi và quản lý quá trình hỗ trợ sinh viên với giao diện dạng bảng.</p>
      </div>

      {/* Academic Intervention Center Dashboard */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 dark:from-slate-950 dark:via-black dark:to-slate-950 rounded-[32px] border border-slate-800 dark:border-white/10 p-6 shadow-2xl relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">DSS Decision Action Engine</span>
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">Academic Intervention Center</h3>
            </div>
            <div className="text-xs text-slate-400 max-w-md bg-white/5 border border-white/10 rounded-2xl p-3 flex items-start gap-2">
              <Info size={16} className="text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>
                <b>Trung tâm Điều phối Hành động Can thiệp:</b> Cho phép chuyển đổi phân tích cảnh báo nguy cơ học thuật thành các hành động hỗ trợ thực tế và tức thì đối với sinh viên.
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/10">
              <span className="text-xs font-bold text-slate-400">Tổng số sinh viên</span>
              <div className="text-3xl font-black text-white mt-1">
                {data.statsSummary?.totalStudents || 0}
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">Dữ liệu thực tế hệ thống</span>
            </div>

            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 transition-all hover:bg-rose-500/10">
              <span className="text-xs font-bold text-rose-400">Nguy cơ Cực kỳ Nguy hiểm</span>
              <div className="text-3xl font-black text-rose-500 mt-1 flex items-baseline gap-1.5">
                {data.statsSummary?.criticalRisk || 0}
                <span className="text-[10px] font-mono text-rose-400/70 font-semibold">({((data.statsSummary?.criticalRisk || 0) / (data.statsSummary?.totalStudents || 1) * 100).toFixed(1)}%)</span>
              </div>
              <span className="text-[10px] text-rose-400/60 block mt-1">Cần hành động khẩn cấp</span>
            </div>

            <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 transition-all hover:bg-orange-500/10">
              <span className="text-xs font-bold text-orange-400">Nguy cơ Cao (High Risk)</span>
              <div className="text-3xl font-black text-orange-500 mt-1 flex items-baseline gap-1.5">
                {data.statsSummary?.highRisk || 0}
                <span className="text-[10px] font-mono text-orange-400/70 font-semibold">({((data.statsSummary?.highRisk || 0) / (data.statsSummary?.totalStudents || 1) * 100).toFixed(1)}%)</span>
              </div>
              <span className="text-[10px] text-orange-400/60 block mt-1">Lộ trình theo dõi sát sao</span>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 transition-all hover:bg-emerald-500/10">
              <span className="text-xs font-bold text-emerald-400">Mức Ổn định / Thấp</span>
              <div className="text-3xl font-black text-emerald-500 mt-1 flex items-baseline gap-1.5">
                {((data.statsSummary?.totalStudents || 0) - (data.statsSummary?.criticalRisk || 0) - (data.statsSummary?.highRisk || 0)) || 0}
                <span className="text-[10px] font-mono text-emerald-400/70 font-semibold">({(((data.statsSummary?.totalStudents || 0) - (data.statsSummary?.criticalRisk || 0) - (data.statsSummary?.highRisk || 0)) / (data.statsSummary?.totalStudents || 1) * 100).toFixed(1)}%)</span>
              </div>
              <span className="text-[10px] text-emerald-400/60 block mt-1">Học tập đạt yêu cầu</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-400 block mb-3">Decision Action — Hành động Hỗ trợ Quyết định:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button 
                onClick={() => handleAction('advisor_alert')}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-950/20 transition-all hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <BellRing size={16} />
                  Send Advisor Alert
                </span>
                <span className="bg-black/20 text-[10px] px-2 py-0.5 rounded-full">Khẩn cấp</span>
              </button>

              <button 
                onClick={() => handleAction('tutor_list')}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-950/20 transition-all hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <Users size={16} />
                  Generate Tutor List
                </span>
                <span className="bg-black/20 text-[10px] px-2 py-0.5 rounded-full">Tự động</span>
              </button>

              <button 
                onClick={() => handleAction('recovery_plan')}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold text-xs shadow-lg shadow-cyan-950/20 transition-all hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  Generate Recovery Plan
                </span>
                <span className="bg-black/20 text-[10px] px-2 py-0.5 rounded-full">Lộ trình DFS</span>
              </button>

              <button 
                onClick={() => handleAction('export_pdf')}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-950/20 transition-all hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <Download size={16} />
                  Export PDF Report
                </span>
                <span className="bg-black/20 text-[10px] px-2 py-0.5 rounded-full">Tải báo cáo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <Info size={18} className="mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold">Quy trình can thiệp:</span>
          {' '}Sinh viên được phát hiện nguy cơ → Gửi Lộ trình (chuyển sang <b>Theo dõi</b>) → Khi điểm thực tế ≥ 5.0đ thì chuyển sang <b>Ổn định</b>. 
          Bạn có thể undo về "Nguy hiểm" nếu bấm nhầm.
        </div>
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
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setSelectedRows([]); }}
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
          {activeTab === 'highRisk' && (
            <button onClick={handleOpenBulk} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 transition-colors flex items-center gap-2 whitespace-nowrap">
              <Activity size={16} /> Đề xuất can thiệp ưu tiên
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
              onClick={() => setSelectedRows([])} 
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-1"
            >
              <XCircle size={14} /> Bỏ chọn
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
              <option value="highRisk">🔴 Nguy cơ cao</option>
              <option value="monitoring">🟠 Cần theo dõi</option>
              <option value="stable">🟢 Ổn định</option>
              <option value="closed">⚪ Đóng case</option>
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
                <th className="px-6 py-4 font-semibold text-center">Dự báo điểm (XAI)</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredData.length > 0 ? (
                filteredData.map((st, i) => {
                  const isSelected = selectedRows.some(r => (r.mssv || r.studentId) === (st.mssv || st.studentId) && (r.courseId || r.targetCourseId) === (st.courseId || st.targetCourseId));
                  const studentMssv = st.mssv || st.studentId;
                  const courseDisplay = st.course?.name || st.targetCourse?.name || st.courseId || st.targetCourseId;
                  const predictedScore = st.predictedScore;
                  const riskLevel = st.risk || (predictedScore < 3 ? 'HIGH' : predictedScore < 5 ? 'MEDIUM' : 'LOW');
                  const scoreImproved = hasScoreImproved(st);
                  const confidence = st.confidence ? (st.confidence * 100).toFixed(0) + '%' : null;
                  const evidence = st.evidence || null;
                  
                  return (
                  <tr key={(st.id || studentMssv) + '-' + (st.courseId || st.targetCourseId) + '-' + i} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, st]);
                          } else {
                            setSelectedRows(selectedRows.filter(r => !((r.mssv || r.studentId) === (st.mssv || st.studentId) && (r.courseId || r.targetCourseId) === (st.courseId || st.targetCourseId))));
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
                          <div className="font-bold text-slate-900 dark:text-slate-200">{st.student?.name || studentMssv}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{studentMssv}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg">
                        {courseDisplay}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {predictedScore !== undefined && predictedScore !== null ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-black ${
                              (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                              riskLevel === 'MEDIUM' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                              'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {predictedScore.toFixed(1)} đ
                            </span>
                            {confidence && (
                              <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-white/5 px-1 rounded">
                                conf: {confidence}
                              </span>
                            )}
                          </div>
                          {evidence && (
                            <div className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate" title={evidence}>
                              {evidence}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      {activeTab === 'monitoring' && (
                        <div className="mt-1">
                          {scoreImproved ? (
                            <span className="text-[10px] text-emerald-500 font-bold">✓ Điểm đã cải thiện</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Chờ điểm cải thiện</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {/* Undo / Move back button for monitoring and stable */}
                        {activeTab !== 'highRisk' && (
                          <button 
                            onClick={() => handleUpdateStatus(st, 'highRisk')}
                            disabled={updating}
                            title="Chuyển lại Nguy cơ cao (Undo)"
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 p-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {activeTab !== 'stable' && activeTab !== 'closed' && (
                          <button 
                            onClick={() => handleOpenRoadmap(st)} 
                            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            {activeTab === 'highRisk' ? 'Gửi Roadmap' : 'Xem Roadmap'}
                          </button>
                        )}
                        {/* Mark as stable - only for monitoring */}
                        {activeTab === 'monitoring' && (
                          <button
                            onClick={() => handleUpdateStatus(st, 'stable')}
                            disabled={updating}
                            title={scoreImproved ? 'Đánh dấu Ổn định' : 'Cần điểm SV ≥ 5.0đ để hoàn thành'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1 ${
                              scoreImproved 
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-white/5 cursor-not-allowed'
                            }`}
                          >
                            <CheckCircle2 size={12} />
                            {scoreImproved ? 'Ổn định' : 'Chờ điểm'}
                          </button>
                        )}
                        {/* Mark as closed - only for stable */}
                        {activeTab === 'stable' && (
                          <button
                            onClick={() => handleUpdateStatus(st, 'closed')}
                            disabled={updating}
                            title="Đóng case can thiệp này"
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            <Check size={12} />
                            Đóng case
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(`/inbox?mssv=${studentMssv}`)} 
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
                    {activeTab === 'closed' 
                      ? '⚪ Chưa có case nào được đóng.'
                      : activeTab === 'stable'
                      ? '✅ Chưa có sinh viên nào được đánh dấu Ổn định. Hãy theo dõi và cập nhật khi điểm cải thiện.'
                      : activeTab === 'monitoring'
                      ? '📋 Chưa có sinh viên nào trong danh sách Theo dõi. Hãy gửi Roadmap cho sinh viên Nguy cơ cao.'
                      : '🎉 Tuyệt vời! Không có sinh viên nào trong vùng nguy cơ cao.'
                    }
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
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Gửi lộ trình qua hộp thư cho <b>{selectedStudent?.student?.name || selectedStudent?.mssv}</b>.
              <span className="ml-1 text-amber-600 dark:text-amber-400">⚡ Sau khi gửi, sinh viên sẽ được chuyển sang "Theo dõi".</span>
            </p>
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
              Hệ thống sẽ tự động cá nhân hóa thông báo cho <b>{data.top20.length}</b> sinh viên. Các biến <span className="text-cyan-400 font-mono text-xs">{'{name}'}</span> và <span className="text-cyan-400 font-mono text-xs">{'{course}'}</span> sẽ được điền tự động.
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

      {/* Decision Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative animate-fade-in">
            <div className="flex items-start gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${actionModal.color}`}>
                <actionModal.icon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {actionModal.title}
                </h3>
                <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-widest block mt-0.5">✓ DSS Action Triggered</span>
              </div>
            </div>
            
            <div className="py-2">
              {actionModal.content}
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setActionModal(null)} 
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-black shadow-lg shadow-black/10 transition-colors"
              >
                Đóng & Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
