import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Users, BookOpen, AlertTriangle, Database, TrendingUp, ShieldAlert, CheckCircle2, MessageSquare, Activity, Target, Send, X, BarChart2, PieChart as PieIcon, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, AreaChart, Area, CartesianGrid } from 'recharts';
import { api, requestWithRestartRetry } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import RiskDistribution from '../components/charts/RiskDistribution';
import BottleneckChart from '../components/charts/BottleneckChart';
import TimelineEscalation from '../components/charts/TimelineEscalation';
import RiskHeatmap from '../components/charts/RiskHeatmap';


export default function Dashboard() {
  const { trainingData, setActiveStudent } = useStore();
  const [redAlerts, setRedAlerts] = useState(null);
  const [kpi, setKpi] = useState({ totalInterventions: 0, improvementRate: 0 });
  const [roadmapProgress, setRoadmapProgress] = useState(null);
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);

  // Send Roadmap State
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [roadmapMsg, setRoadmapMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);

  useEffect(() => {
    const fetchRedAlerts = async () => {
      try {
        const res = await requestWithRestartRetry(() => api.get('/red-alerts'));
        setRedAlerts(res.data.alerts);
        setKpi(res.data.kpi);
      } catch (e) {
        console.error(e);
      }
    };
    
    const fetchRoadmapProgress = async () => {
      try {
        const res = await api.get('/advisor/class-roadmap-progress');
        if (res.data && res.data.success) {
          setRoadmapProgress(res.data.data);
        }
      } catch (e) {
        console.error("Lỗi tải tiến độ lộ trình:", e);
      }
    };
    
    fetchRedAlerts();
    fetchRoadmapProgress();
  }, []);

  const handleIntervene = async (mssv, courseId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/students/${mssv}/flag`, { courseId, action: 'Cảnh báo từ Dashboard', status: 'ACTIVE' });
      setRedAlerts(prev => prev.map(a => 
        (a.mssv === mssv && a.targetCourse === courseId) ? { ...a, intervened: true } : a
      ));
      setKpi(prev => ({ ...prev, totalInterventions: prev.totalInterventions + 1 }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = (alert, e) => {
    e.stopPropagation();
    setActiveStudent({ id: alert.mssv, name: alert.name, classCode: alert.classCode });
    navigate('/chat');
  };

  const handleOpenRoadmap = (alert, e) => {
    e.stopPropagation();
    setSelectedAlert(alert);
    let msg = `Chào ${alert.name},\n\nGiảng viên phát hiện em đang có nguy cơ gặp khó khăn ở môn ${alert.targetCourse} sắp tới (Dự báo: ${alert.predictedScore.toFixed(1)}đ).`;
    if (alert.weakPrereqs.length > 0) {
      msg += ` Nguyên nhân chính do em bị hổng kiến thức từ các môn: ${alert.weakPrereqs.map(w => `${w.courseId} (${w.score}đ)`).join(', ')}.`;
    } else {
      msg += ` Nguyên nhân do phong độ học tập gần đây của em có dấu hiệu giảm sút.`;
    }
    let dynamicRoadmap = '';
    if (alert.weakPrereqs && alert.weakPrereqs.length > 0) {
      dynamicRoadmap += `1. Ôn tập khẩn cấp: Xem lại ngay toàn bộ slide/video của môn ${alert.weakPrereqs[0].courseId} vì đây là nền tảng cốt lõi.\n`;
      dynamicRoadmap += `2. Bù đắp lỗ hổng: Làm lại các bài tập thực hành của môn tiên quyết trước khi bắt tay vào làm Assignment hiện tại.\n`;
    } else {
      dynamicRoadmap += `1. Tăng cường chú ý: Xem lại video bài giảng và các phần thực hành trên lớp tuần qua.\n`;
      dynamicRoadmap += `2. Tránh sao nhãng: Lập kế hoạch phân bổ thời gian tập trung ôn luyện môn ${alert.targetCourse} đều đặn mỗi ngày.\n`;
    }
    
    if (alert.priorityLevel === 'CRITICAL') {
      dynamicRoadmap += `3. Khẩn cấp: Đặt lịch hẹn gặp Cố vấn học tập (CVHT) trong tuần này để được hỗ trợ phương án cứu vãn.`;
    } else if (alert.priorityLevel === 'HIGH') {
      dynamicRoadmap += `3. Chú ý: Tham gia các buổi tutorial/phụ đạo do trường tổ chức hoặc nhờ nhóm bạn hỗ trợ.`;
    } else {
      dynamicRoadmap += `3. Gợi ý: Trao đổi thêm với giảng viên trên lớp nếu có bất kỳ thắc mắc nào chưa hiểu rõ.`;
    }

    msg += `\n\n🎯 Lộ trình cải thiện (AI Đề xuất):\n${dynamicRoadmap}\n\nNếu cần hỗ trợ thêm, hãy phản hồi lại qua Hộp thư này. Chúc em học tốt!`;
    setRoadmapMsg(msg);
    setShowRoadmapModal(true);
  };

  const handleSendRoadmap = async () => {
    setSendingMsg(true);
    try {
      await api.post('/comm/messages', {
        senderId: currentUser.id,
        receiverId: selectedAlert.mssv,
        content: roadmapMsg
      });
      setShowRoadmapModal(false);
      // Mark as intervened
      handleIntervene(selectedAlert.mssv, selectedAlert.targetCourse, { stopPropagation: () => {} });
      alert('Đã gửi Lộ trình thành công qua Hộp thư cho sinh viên!');
    } catch (e) {
      alert('Lỗi gửi tin nhắn: ' + e.message);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSendBulkRoadmap = async () => {
    if (!redAlerts || redAlerts.length === 0) return;
    const unintervened = redAlerts.filter(a => !a.intervened);
    if (unintervened.length === 0) {
      alert('Tất cả sinh viên trong danh sách đều đã được can thiệp!');
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn gửi lộ trình tự động cho ${unintervened.length} sinh viên chưa được can thiệp?`)) return;

    setSendingBulk(true);
    let successCount = 0;

    try {
      for (const alert of unintervened) {
        let msg = `Chào ${alert.name},\n\nGiảng viên phát hiện em đang có nguy cơ gặp khó khăn ở môn ${alert.targetCourse} sắp tới (Dự báo: ${alert.predictedScore.toFixed(1)} điểm).`;
        if (alert.weakPrereqs.length > 0) {
          msg += ` Nguyên nhân chính do em bị hổng kiến thức từ các môn: ${alert.weakPrereqs.map(w => `${w.courseId} (${w.score}đ)`).join(', ')}.`;
        } else {
          msg += ` Nguyên nhân do phong độ học tập gần đây của em có dấu hiệu giảm sút.`;
        }
        let dynamicRoadmap = '';
        if (alert.weakPrereqs && alert.weakPrereqs.length > 0) {
          dynamicRoadmap += `1. Ôn tập khẩn cấp: Xem lại ngay toàn bộ slide/video của môn ${alert.weakPrereqs[0].courseId} vì đây là nền tảng cốt lõi.\n`;
          dynamicRoadmap += `2. Bù đắp lỗ hổng: Làm lại các bài tập thực hành của môn tiên quyết trước khi bắt tay vào làm Assignment hiện tại.\n`;
        } else {
          dynamicRoadmap += `1. Tăng cường chú ý: Xem lại video bài giảng và các phần thực hành trên lớp tuần qua.\n`;
          dynamicRoadmap += `2. Tránh sao nhãng: Lập kế hoạch phân bổ thời gian tập trung ôn luyện môn ${alert.targetCourse} đều đặn mỗi ngày.\n`;
        }
        
        if (alert.priorityLevel === 'CRITICAL') {
          dynamicRoadmap += `3. Khẩn cấp: Đặt lịch hẹn gặp Cố vấn học tập (CVHT) trong tuần này để được hỗ trợ phương án cứu vãn.`;
        } else if (alert.priorityLevel === 'HIGH') {
          dynamicRoadmap += `3. Chú ý: Tham gia các buổi tutorial/phụ đạo do trường tổ chức hoặc nhờ nhóm bạn hỗ trợ.`;
        } else {
          dynamicRoadmap += `3. Gợi ý: Trao đổi thêm với giảng viên trên lớp nếu có bất kỳ thắc mắc nào chưa hiểu rõ.`;
        }

        msg += `\n\n🎯 Lộ trình cải thiện (AI Đề xuất):\n${dynamicRoadmap}\n\nNếu cần hỗ trợ thêm, hãy phản hồi lại qua Hộp thư này. Chúc em học tốt!`;

        await api.post('/comm/messages', {
          senderId: currentUser.id,
          receiverId: alert.mssv,
          content: msg
        });
        
        await api.post(`/students/${alert.mssv}/flag`, { courseId: alert.targetCourse, action: 'Cảnh báo hàng loạt từ Dashboard', status: 'ACTIVE' });
        successCount++;
      }
      
      setRedAlerts(prev => prev.map(a => 
        unintervened.find(u => u.mssv === a.mssv && u.targetCourse === a.targetCourse) 
          ? { ...a, intervened: true } 
          : a
      ));
      setKpi(prev => ({ ...prev, totalInterventions: prev.totalInterventions + successCount }));
      
      alert(`Đã gửi lộ trình và đánh dấu can thiệp cho ${successCount} sinh viên thành công!`);
    } catch (e) {
      alert('Lỗi khi gửi hàng loạt: ' + e.message);
    } finally {
      setSendingBulk(false);
    }
  };

  if (!trainingData) return (
    <div className="space-y-8 animate-pulse pb-10">
      <div className="glass-card p-8 rounded-3xl h-32 bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-8 bg-white/10 rounded-lg w-64"></div>
          <div className="h-4 bg-white/5 rounded-lg w-96"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-16 bg-white/10 rounded-2xl w-32"></div>
          <div className="h-16 bg-white/10 rounded-2xl w-32"></div>
        </div>
      </div>
      <div className="glass-card rounded-3xl h-64 bg-white/5 border border-slate-200 dark:border-white/5"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="glass-card h-28 rounded-2xl bg-white/5 border border-slate-200 dark:border-white/5"></div>)}
      </div>
    </div>
  );

  if (!trainingData.stats) return (
    <div className="flex flex-col gap-4 h-64 items-center justify-center text-slate-600 dark:text-slate-400 bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10">
      <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-sm font-medium animate-pulse">Đang tải dữ liệu phân tích học vụ...</p>
    </div>
  );

  const totalAtRisk = trainingData.stats.reduce((acc, curr) => acc + curr.atRisk, 0);

  const chartData = [...trainingData.stats]
    .filter(s => s.scored >= 5)
    .sort((a, b) => b.atRisk - a.atRisk)
    .slice(0, 10);

  const currentRisk = redAlerts ? redAlerts.length : 0;
  const safePercentage = trainingData.totalStudents > 0 
    ? Number((((trainingData.totalStudents - currentRisk) / trainingData.totalStudents) * 100).toFixed(1))
    : 0;

  // Empty State logic for No Data
  if (!trainingData || trainingData.totalStudents === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-200 dark:border-white/5">
          <Database size={40} className="text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Chưa có dữ liệu học tập</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
          Hệ thống hiện tại chưa có thông tin điểm số để phân tích. Vui lòng chuyển đến trang <b className="text-slate-900 dark:text-white">Dữ liệu & Phân tích</b> để import bảng điểm (Excel/CSV) và bắt đầu.
        </p>
        <button 
          onClick={() => navigate('/predict')}
          className="bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-sm dark:shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Target size={18} /> Đi tới trang Import Dữ liệu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 mb-6 md:mb-0">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Trang chủ Giảng viên 👋</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
            Nền tảng <b>EduGuard AI</b> giám sát tiến độ học tập thời gian thực, phát hiện sớm nguy cơ trượt học phần.
          </p>
        </div>
        
        {/* 3 Clear Insights KPI Widget */}
        <div className="relative z-10 flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 px-5 py-4 rounded-2xl flex items-center gap-4 hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-colors flex-shrink-0">
            <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 uppercase tracking-wider font-bold">Nguy cơ gãy chuỗi</p>
              <h4 className="text-xl font-bold text-rose-600 dark:text-rose-400">{currentRisk} <span className="text-xs font-normal">sinh viên</span></h4>
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 px-5 py-4 rounded-2xl flex items-center gap-4 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors flex-shrink-0">
            <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 uppercase tracking-wider font-bold">Chuyên cần dưới ngưỡng</p>
              <h4 className="text-xl font-bold text-amber-600 dark:text-amber-400">{kpi.lowAttendanceCount || 0} <span className="text-xs font-normal">sinh viên</span></h4>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 px-5 py-4 rounded-2xl flex items-center gap-4 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-colors flex-shrink-0">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider font-bold">Ổn định học vụ</p>
              <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{safePercentage}% <span className="text-xs font-normal">tổng số SV</span></h4>
            </div>
          </div>
        </div>
      </div>

      {/* TREND CHART & QUICK ALERTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card rounded-3xl border border-slate-200 dark:border-white/5 p-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900/50 relative overflow-hidden">
          <Database size={48} className="text-slate-600/50 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Chưa đủ dữ liệu lịch sử</h3>
          <p className="text-slate-500 text-sm max-w-sm text-center">
            Hệ thống cần thu thập dữ liệu học tập liên tục qua các tuần để xây dựng biểu đồ Xu hướng Cảnh báo chính xác.
          </p>
        </div>

        <div className="glass-card rounded-3xl border border-rose-200 dark:border-rose-500/20 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-rose-50 dark:bg-rose-500/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/30">
              <ShieldAlert size={36} className="text-rose-600 dark:text-rose-500" />
            </div>
            <h3 className="text-5xl font-black text-slate-900 dark:text-white mb-2">{currentRisk}</h3>
            <p className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-widest text-sm mb-4">Cảnh báo khẩn cấp</p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Sinh viên có nguy cơ cấm thi hoặc rớt môn tiên quyết tuần này.</p>
          </div>
        </div>
      </div>

      {/* CẢNH BÁO ĐỎ - RED ALERTS */}
      <div className="glass-card rounded-3xl border border-rose-200 dark:border-rose-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 dark:bg-rose-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center gap-3 flex-wrap relative z-10">
          <ShieldAlert size={24} className="text-rose-600 dark:text-rose-500" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Cảnh Báo Đỏ - Cần Can Thiệp Khẩn Cấp</h3>
          <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs px-3 py-1 rounded-full font-bold">Top rủi ro cao</span>
          <button 
            onClick={handleSendBulkRoadmap}
            disabled={sendingBulk || !redAlerts || redAlerts.length === 0}
            className="ml-auto bg-white dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 hover:dark:from-indigo-500 hover:dark:to-purple-500 text-slate-900 dark:text-white px-4 py-2 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-none dark:shadow-indigo-500/20 flex items-center gap-2 text-sm font-bold disabled:opacity-50"
          >
            {sendingBulk ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
            {sendingBulk ? 'Đang gửi...' : 'Gửi toàn bộ Lộ trình'}
          </button>
        </div>
        <div className="overflow-x-auto relative z-10 bg-white dark:bg-transparent">
          {!redAlerts ? (
             <div className="p-8 text-center text-slate-600 dark:text-slate-400">Đang quét dữ liệu...</div>
          ) : redAlerts.length === 0 ? (
             <div className="p-8 text-center text-emerald-600 dark:text-emerald-400 font-medium">Tuyệt vời! Không có sinh viên nào nằm trong vùng nguy hiểm cao.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Sinh viên</th>
                  <th className="px-6 py-4 font-semibold">Môn rủi ro (Ước lượng)</th>
                  <th className="px-6 py-4 font-semibold">Cảnh báo sớm</th>
                  <th className="px-6 py-4 font-semibold">Bằng chứng (Lỗ hổng)</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác hỗ trợ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {(showAllAlerts ? redAlerts : redAlerts.slice(0, 5)).map((alert, idx) => (
                  <tr key={`${alert.mssv}-${alert.targetCourse}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-200">{alert.name}</div>
                      <div className="text-slate-500 text-xs">{alert.mssv} • {alert.classCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-300">{alert.targetCourse}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                          {alert.predictedScore.toFixed(1)} điểm
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {alert.priorityLevel === 'CRITICAL' ? (
                        <span className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-200 dark:border-rose-500/50 uppercase">
                          Cấp Cứu
                        </span>
                      ) : alert.priorityLevel === 'HIGH' ? (
                        <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-500/30 uppercase">
                          Báo Động
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-200 dark:border-blue-500/20 uppercase">
                          Theo Dõi
                        </span>
                      )}
                      {alert.isEarlyWarning && <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-300 font-bold">Tuần 1-2</span>}
                    </td>
                    <td className="px-6 py-4">
                      {alert.weakPrereqs.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {alert.weakPrereqs.map(wp => (
                            <div key={wp.courseId} className="text-xs text-rose-600 dark:text-rose-300">
                              <span className="opacity-70 text-slate-600 dark:text-rose-300/70">Gãy</span> {wp.courseId}: <span className="font-bold">{wp.score}đ</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Phong độ giảm sút</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleOpenRoadmap(alert, e)}
                          className="bg-indigo-50 dark:bg-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500 text-indigo-600 dark:text-white p-2 rounded-xl transition-colors shadow-sm dark:shadow-indigo-500/20 tooltip-trigger flex items-center gap-1 text-xs font-bold border border-indigo-200 dark:border-none"
                          title="Gửi Lộ trình qua Hộp thư"
                        >
                          <Send size={14} /> Gửi Lộ trình
                        </button>
                        <button 
                          onClick={(e) => handleChat(alert, e)}
                          className="bg-blue-50 dark:bg-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500 text-blue-600 dark:text-white p-2 rounded-xl transition-colors shadow-sm dark:shadow-blue-500/20 tooltip-trigger border border-blue-200 dark:border-none"
                          title={(() => {
                            try {
                              const arr = JSON.parse(alert.reasons);
                              if (Array.isArray(arr)) {
                                return "Lý do AI dự báo:\n" + arr.map(r => `- ${r.explanation}`).join('\n');
                              }
                            } catch(e) {}
                            return "Hỗ trợ tư vấn NLP";
                          })()}
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleIntervene(alert.mssv, alert.targetCourse, e)}
                          disabled={alert.intervened}
                          className={`p-2 rounded-xl transition-colors flex items-center gap-1 ${
                            alert.intervened 
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-not-allowed border border-emerald-200 dark:border-emerald-500/20' 
                              : 'bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 shadow-sm'
                          }`}
                          title={alert.intervened ? 'Đã can thiệp' : 'Đánh dấu can thiệp'}
                        >
                          <CheckCircle2 size={16} />
                          {alert.intervened && <span className="text-xs font-bold pr-1">Đã xử lý</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {redAlerts && redAlerts.length > 5 && (
          <div className="p-4 border-t border-slate-200 dark:border-white/5 text-center">
            <button 
              onClick={() => setShowAllAlerts(!showAllAlerts)}
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {showAllAlerts ? 'Thu gọn danh sách' : `Xem thêm ${redAlerts.length - 5} sinh viên cảnh báo...`}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Tổng sinh viên (Train)', value: trainingData.totalStudents, icon: <Users size={24} className="text-blue-600 dark:text-blue-400" />, color: 'bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-blue-500/5', border: 'border-blue-200 dark:border-blue-500/20' },
          { label: 'Số môn học', value: trainingData.totalSubjects, icon: <BookOpen size={24} className="text-purple-600 dark:text-purple-400" />, color: 'bg-purple-50 dark:bg-gradient-to-br dark:from-purple-500/20 dark:to-purple-500/5', border: 'border-purple-200 dark:border-purple-500/20' },
          { label: 'Nguồn dữ liệu', value: 'FPT Poly', icon: <Database size={24} className="text-cyan-600 dark:text-cyan-400" />, color: 'bg-cyan-50 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-cyan-500/5', border: 'border-cyan-200 dark:border-cyan-500/20' },
          { label: 'Tổng lượt rớt (Lịch sử)', value: totalAtRisk, icon: <AlertTriangle size={24} className="text-rose-600 dark:text-rose-400" />, color: 'bg-rose-50 dark:bg-gradient-to-br dark:from-rose-500/20 dark:to-rose-500/5', border: 'border-rose-200 dark:border-rose-500/20' }
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-6 rounded-2xl flex items-center ${stat.color} border ${stat.border} hover:scale-105 transition-transform duration-300 cursor-default hover:shadow-md`}>
            <div className="mr-5 p-3 bg-white dark:bg-white/5 shadow-sm dark:shadow-none rounded-xl border border-slate-200 dark:border-white/5">{stat.icon}</div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 h-[500px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" /> Top 10 Môn Có Nguy Cơ Tạch Cao Nhất
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
            *Biểu đồ hiển thị số sinh viên rớt đối chiếu với tổng số sinh viên đã học môn đó (Dựa trên toàn bộ kho dữ liệu).
          </p>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}/>
                <XAxis 
                  dataKey="subject" 
                  tick={{fill: '#94a3b8', fontSize: 10}} 
                  angle={-40} 
                  textAnchor="end" 
                  height={85} 
                  stroke="#94a3b8"
                  tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                />
                <YAxis tick={{fill: '#94a3b8', fontSize: 11}} stroke="#94a3b8" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                  itemStyle={{color: '#fff'}}
                />
                <Bar dataKey="scored" name="Tổng số SV đã học" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atRisk" name="Số SV Dưới 5 (Rớt)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : index < 6 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col h-[500px]">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Chi tiết Môn học</h3>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
            {trainingData.stats.map(s => {
              const isNotEnough = s.scored < 5;
              return (
                <div key={s.subject} className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2 animate-fade-in">
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-tight">{s.subject}</h4>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${isNotEnough ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : s.atRisk > 5 ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                      {isNotEnough ? 'Thiếu dữ liệu' : `${s.atRisk} rớt`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Trung bình: <span className="text-slate-800 dark:text-white font-medium">{isNotEnough ? 'N/A' : s.avg}</span></span>
                    <span>Đã chấm: <span className="text-slate-800 dark:text-white font-medium">{s.scored}/{s.total}</span></span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-3">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(s.scored / s.total) * 100}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── ENTERPRISE INTELLIGENCE ANALYTICS ─────────────────────────────── */}
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/15 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
            <Layers size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-slate-800 dark:text-slate-200 text-lg font-bold m-0">Intelligence Analytics Dashboard</h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-semibold ml-2">Phase 3 — Enterprise</span>
        </div>

        {/* Row 1: Risk Distribution + Bottleneck */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <RiskDistribution
            data={redAlerts ? [
              { name: 'CRITICAL', value: redAlerts.filter(a => a.priorityLevel === 'CRITICAL').length },
              { name: 'HIGH', value: redAlerts.filter(a => a.priorityLevel === 'HIGH').length },
              { name: 'MEDIUM', value: redAlerts.filter(a => a.priorityLevel === 'MEDIUM').length },
              { name: 'LOW', value: Math.max(0, (trainingData?.totalStudents || 30) - redAlerts.length) }
            ] : null}
          />
          <BottleneckChart
            data={trainingData?.stats
              ?.filter(s => s.atRisk > 0)
              .sort((a, b) => b.atRisk - a.atRisk)
              .slice(0, 5)
              .map(s => ({ name: s.subject, failCount: s.atRisk }))}
          />
        </div>

        {/* Row 2: Timeline Escalation */}
        <div className="mb-5">
          <TimelineEscalation 
            data={[
              { week: 1, warnings: 5, critical: 1 },
              { week: 2, warnings: 8, critical: 3 },
              { week: 3, warnings: 12, critical: 5 },
              { week: 4, warnings: 15, critical: 9 },
              { week: 5, warnings: 22, critical: 14 }
            ]} 
          />
        </div>

        {/* Row 3: Risk Heatmap */}
        <RiskHeatmap
          students={redAlerts ? redAlerts.slice(0, 8).map(a => ({
            mssv: a.mssv,
            name: a.name,
            riskScore: a.riskScore || 70,
            level: a.priorityLevel,
            gpa: a.gpa || 0,
            attendance: a.avgAttendance || 100,
            failedSubjects: a.failedCourses?.length || 0
          })) : []}
        />
        
        {/* Row 4: Class Roadmap Progress (Learning Board Analytics) */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-500/15 rounded-lg border border-blue-200 dark:border-blue-500/30">
              <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-slate-800 dark:text-slate-200 text-lg font-bold m-0">Career Roadmap Progress (Toàn Lớp)</h3>
          </div>
          
          {!roadmapProgress ? (
             <div className="p-8 text-center text-slate-600 dark:text-slate-400 glass-card rounded-3xl border border-slate-200 dark:border-white/5">Đang tải dữ liệu tiến độ lộ trình...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                <h4 className="font-bold text-slate-800 dark:text-white mb-4">Phân bổ ngành nghề</h4>
                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieIcon /> {/* Placeholder for PieChart to avoid importing it all */}
                    <BarChart data={roadmapProgress.careerDistribution} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex justify-between text-sm">
                  <span className="text-slate-500">Tổng sinh viên theo học:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{roadmapProgress.totalActiveStudents} SV</span>
                </div>
              </div>
              
              <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-200 dark:border-white/5">
                  <h4 className="font-bold text-slate-800 dark:text-white">Bảng Xếp Hạng Kỹ Năng Thực Tế (Portfolio Points)</h4>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-400 text-xs tracking-wider">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Sinh viên</th>
                        <th className="px-5 py-3 font-semibold">Ngành mục tiêu</th>
                        <th className="px-5 py-3 font-semibold text-center">Tiến độ (%)</th>
                        <th className="px-5 py-3 font-semibold text-center">Đã xác thực</th>
                        <th className="px-5 py-3 font-semibold text-right text-emerald-600 dark:text-emerald-400">Điểm Portfolio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {roadmapProgress.topPerformers.map((student, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                {idx + 1}
                              </span>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-slate-200">{student.name}</div>
                                <div className="text-slate-500 text-[10px]">{student.mssv}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300">
                            {student.careerId.replace(/-/g, ' ')}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full" style={{width: `${student.progressPercent}%`}}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{student.progressPercent}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300">
                            {student.verifiedTasks} / {student.doneTasks}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg font-black">
                              {student.points} pts
                            </span>
                          </td>
                        </tr>
                      ))}
                      {roadmapProgress.topPerformers.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-5 py-8 text-center text-slate-500">Chưa có sinh viên nào học lộ trình nghề nghiệp.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roadmap Modal */}
      {showRoadmapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative animate-fade-in">
            <button 
              onClick={() => setShowRoadmapModal(false)}
              className="absolute top-4 right-4 text-slate-600 dark:text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Send size={20} className="text-blue-400" /> Gửi Lộ trình qua Hộp thư
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Tin nhắn này sẽ được gửi trực tiếp đến hộp thư của sinh viên <b>{selectedAlert?.name} ({selectedAlert?.mssv})</b>.
            </p>
            
            <textarea
              value={roadmapMsg}
              onChange={(e) => setRoadmapMsg(e.target.value)}
              className="w-full h-48 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500/50 mb-4 custom-scrollbar"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowRoadmapModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white/5 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSendRoadmap}
                disabled={sendingMsg}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-xl text-sm font-bold shadow-lg shadow-sm dark:shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {sendingMsg ? 'Đang gửi...' : <><Send size={16} /> Gửi ngay</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
