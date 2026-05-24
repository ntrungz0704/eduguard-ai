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
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);

  // Send Roadmap State
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [roadmapMsg, setRoadmapMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

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
    fetchRedAlerts();
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
    msg += `\n\n🎯 Lộ trình cải thiện (AI Đề xuất):\n1. Ôn tập lại ngay kiến thức căn bản của các bài tập/lab trước.\n2. Cần đặc biệt chú ý cải thiện phần logic và thực hành.\n3. Nếu cần hỗ trợ thêm tài liệu, hãy phản hồi lại qua Hộp thư này.\n\nChúc em học tốt!`;
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

  if (!trainingData) return (
    <div className="space-y-8 animate-pulse pb-10">
      <div className="glass-card p-8 rounded-3xl h-32 bg-white/5 border border-white/5 flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-8 bg-white/10 rounded-lg w-64"></div>
          <div className="h-4 bg-white/5 rounded-lg w-96"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-16 bg-white/10 rounded-2xl w-32"></div>
          <div className="h-16 bg-white/10 rounded-2xl w-32"></div>
        </div>
      </div>
      <div className="glass-card rounded-3xl h-64 bg-white/5 border border-white/5"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="glass-card h-28 rounded-2xl bg-white/5 border border-white/5"></div>)}
      </div>
    </div>
  );

  if (!trainingData.stats) return <div className="flex h-64 items-center justify-center text-slate-400 bg-white/5 rounded-2xl border border-white/10">Chưa có dữ liệu huấn luyện.</div>;

  const totalAtRisk = trainingData.stats.reduce((acc, curr) => acc + curr.atRisk, 0);

  const chartData = [...trainingData.stats]
    .filter(s => s.scored >= 5)
    .sort((a, b) => b.atRisk - a.atRisk)
    .slice(0, 10);

  const trendData = [
    { name: 'Tuần 1', risk: 85, safe: 500 },
    { name: 'Tuần 2', risk: 90, safe: 495 },
    { name: 'Tuần 3', risk: 110, safe: 475 },
    { name: 'Tuần 4', risk: totalAtRisk, safe: trainingData.totalStudents - totalAtRisk }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 mb-6 md:mb-0">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Trang chủ Giảng viên 👋</h2>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
            Nền tảng <b>EduGuard AI</b> giám sát tiến độ học tập thời gian thực, phát hiện sớm nguy cơ trượt học phần.
          </p>
        </div>
        
        {/* 3 Clear Insights KPI Widget */}
        <div className="relative z-10 flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="bg-rose-500/5 border border-rose-500/20 px-5 py-4 rounded-2xl flex items-center gap-4 hover:bg-rose-500/10 transition-colors flex-shrink-0">
            <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[11px] text-rose-400/80 uppercase tracking-wider font-bold">Nguy cơ gãy chuỗi học tập</p>
              <h4 className="text-xl font-bold text-rose-400">{redAlerts ? redAlerts.length : 12} <span className="text-xs font-normal">sinh viên</span></h4>
            </div>
          </div>
          
          <div className="bg-amber-500/5 border border-amber-500/20 px-5 py-4 rounded-2xl flex items-center gap-4 hover:bg-amber-500/10 transition-colors flex-shrink-0">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[11px] text-amber-400/80 uppercase tracking-wider font-bold">Chuyên cần dưới ngưỡng</p>
              <h4 className="text-xl font-bold text-amber-400">8 <span className="text-xs font-normal">sinh viên</span></h4>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 px-5 py-4 rounded-2xl flex items-center gap-4 hover:bg-emerald-500/10 transition-colors flex-shrink-0">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Target size={20} />
            </div>
            <div>
              <p className="text-[11px] text-emerald-400/80 uppercase tracking-wider font-bold">Ổn định học vụ</p>
              <h4 className="text-xl font-bold text-emerald-400">75% <span className="text-xs font-normal">tổng số SV</span></h4>
            </div>
          </div>
        </div>
      </div>

      {/* TREND CHART & QUICK ALERTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card rounded-3xl border border-white/5 p-6 h-[300px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-400" /> Xu Hướng Cảnh Báo (4 Tuần Gần Nhất)
          </h3>
          <div className="flex-1 w-full min-h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 12}} stroke="#334155" />
                <YAxis tick={{fill: '#94a3b8', fontSize: 12}} stroke="#334155" />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px'}}
                  itemStyle={{color: '#fff'}}
                />
                <Area type="monotone" dataKey="risk" name="SV Rủi ro cao" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-3xl border border-rose-500/20 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-rose-500/5 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <ShieldAlert size={36} className="text-rose-500" />
            </div>
            <h3 className="text-5xl font-black text-white mb-2">{redAlerts ? redAlerts.length : 0}</h3>
            <p className="text-rose-400 font-bold uppercase tracking-widest text-sm mb-4">Cảnh báo khẩn cấp</p>
            <p className="text-slate-400 text-sm">Sinh viên có nguy cơ cấm thi hoặc rớt môn tiên quyết tuần này.</p>
          </div>
        </div>
      </div>

      {/* CẢNH BÁO ĐỎ - RED ALERTS */}
      <div className="glass-card rounded-3xl border border-rose-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <ShieldAlert size={24} className="text-rose-500" />
          <h3 className="text-xl font-bold text-white">Cảnh Báo Đỏ - Cần Can Thiệp Khẩn Cấp</h3>
          <span className="ml-auto bg-rose-500/20 text-rose-400 text-xs px-3 py-1 rounded-full font-bold">Top rủi ro cao</span>
        </div>
        <div className="overflow-x-auto">
          {!redAlerts ? (
             <div className="p-8 text-center text-slate-400">Đang quét dữ liệu...</div>
          ) : redAlerts.length === 0 ? (
             <div className="p-8 text-center text-emerald-400 font-medium">Tuyệt vời! Không có sinh viên nào nằm trong vùng nguy hiểm cao.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Sinh viên</th>
                  <th className="px-6 py-4 font-semibold">Môn rủi ro (Dự báo)</th>
                  <th className="px-6 py-4 font-semibold">Cảnh báo sớm</th>
                  <th className="px-6 py-4 font-semibold">Bằng chứng (Lỗ hổng)</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác hỗ trợ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {redAlerts.map((alert, idx) => (
                  <tr key={`${alert.mssv}-${alert.targetCourse}-${idx}`} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-200">{alert.name}</div>
                      <div className="text-slate-500 text-xs">{alert.mssv} • {alert.classCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-300">{alert.targetCourse}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400">
                          {alert.predictedScore.toFixed(1)}đ
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {alert.priorityLevel === 'CRITICAL' ? (
                        <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-black border border-rose-500/50 uppercase">
                          Cấp Cứu
                        </span>
                      ) : alert.priorityLevel === 'HIGH' ? (
                        <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 uppercase">
                          Báo Động
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/20 uppercase">
                          Theo Dõi
                        </span>
                      )}
                      {alert.isEarlyWarning && <span className="ml-2 text-[10px] text-amber-300 font-bold">Tuần 1-2</span>}
                    </td>
                    <td className="px-6 py-4">
                      {alert.weakPrereqs.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {alert.weakPrereqs.map(wp => (
                            <div key={wp.courseId} className="text-xs text-rose-300">
                              <span className="opacity-70">Gãy</span> {wp.courseId}: <span className="font-bold">{wp.score}đ</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Phong độ giảm sút</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleOpenRoadmap(alert, e)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 tooltip-trigger flex items-center gap-1 text-xs font-bold"
                          title="Gửi Lộ trình qua Hộp thư"
                        >
                          <Send size={14} /> Gửi Lộ trình
                        </button>
                        <button 
                          onClick={(e) => handleChat(alert, e)}
                          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-colors shadow-lg shadow-blue-500/20 tooltip-trigger"
                          title="Tư vấn với AI"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleIntervene(alert.mssv, alert.targetCourse, e)}
                          disabled={alert.intervened}
                          className={`p-2 rounded-xl transition-colors flex items-center gap-1 ${
                            alert.intervened 
                              ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed border border-emerald-500/20' 
                              : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/5'
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Tổng sinh viên (Train)', value: trainingData.totalStudents, icon: <Users size={24} className="text-blue-400" />, color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20' },
          { label: 'Số môn học', value: trainingData.totalSubjects, icon: <BookOpen size={24} className="text-purple-400" />, color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20' },
          { label: 'Nguồn dữ liệu', value: 'FPT Poly', icon: <Database size={24} className="text-cyan-400" />, color: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/20' },
          { label: 'Tổng lượt rớt (<5)', value: totalAtRisk, icon: <AlertTriangle size={24} className="text-rose-400" />, color: 'from-rose-500/20 to-rose-500/5', border: 'border-rose-500/20' }
        ].map((stat, i) => (
          <div key={i} className={`glass-card p-6 rounded-2xl flex items-center bg-gradient-to-br ${stat.color} border ${stat.border} hover:scale-105 transition-transform duration-300 cursor-default hover:shadow-lg`}>
            <div className="mr-5 p-3 bg-white/5 rounded-xl border border-white/5">{stat.icon}</div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card p-6 rounded-3xl border border-white/5 h-[500px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-400" /> Top 10 Môn Có Nguy Cơ Tạch Cao Nhất
          </h3>
          <p className="text-xs text-slate-400 mb-6 font-medium">
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
                  stroke="#334155"
                  tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                />
                <YAxis tick={{fill: '#94a3b8', fontSize: 11}} stroke="#334155" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                  itemStyle={{color: '#fff'}}
                />
                <Bar dataKey="scored" name="Tổng số SV đã học" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atRisk" name="Số SV Dưới 5 (Rớt)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : index < 6 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/5 overflow-hidden flex flex-col h-[500px]">
          <h3 className="text-lg font-bold text-white mb-4">Chi tiết Môn học</h3>
          <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
            {trainingData.stats.map(s => {
              const isNotEnough = s.scored < 5;
              return (
                <div key={s.subject} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2 animate-fade-in">
                    <h4 className="font-semibold text-sm text-slate-200 leading-tight">{s.subject}</h4>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded transition-colors ${isNotEnough ? 'bg-amber-500/20 text-amber-400' : s.atRisk > 5 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {isNotEnough ? 'Thiếu dữ liệu' : `${s.atRisk} rớt`}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Trung bình: <span className="text-white font-medium">{isNotEnough ? 'N/A' : s.avg}</span></span>
                    <span>Đã chấm: <span className="text-white font-medium">{s.scored}/{s.total}</span></span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(s.scored / s.total) * 100}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── ENTERPRISE INTELLIGENCE ANALYTICS ─────────────────────────────── */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ padding: '6px 10px', background: 'rgba(99,102,241,0.15)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.3)' }}>
            <Layers size={18} style={{ color: '#818cf8' }} />
          </div>
          <h3 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 700, margin: 0 }}>Intelligence Analytics Dashboard</h3>
          <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 600 }}>Phase 3 — Enterprise</span>
        </div>

        {/* Row 1: Risk Distribution + Bottleneck */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
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
        <div style={{ marginBottom: 20 }}>
          <TimelineEscalation />
        </div>

        {/* Row 3: Risk Heatmap */}
        <RiskHeatmap
          students={redAlerts ? redAlerts.slice(0, 8).map(a => ({
            mssv: a.mssv,
            name: a.name,
            riskScore: a.riskScore || 70,
            level: a.priorityLevel
          })) : []}
        />
      </div>

      {/* Roadmap Modal */}
      {showRoadmapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative animate-fade-in">
            <button 
              onClick={() => setShowRoadmapModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Send size={20} className="text-blue-400" /> Gửi Lộ trình qua Hộp thư
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Tin nhắn này sẽ được gửi trực tiếp đến hộp thư của sinh viên <b>{selectedAlert?.name} ({selectedAlert?.mssv})</b>.
            </p>
            
            <textarea
              value={roadmapMsg}
              onChange={(e) => setRoadmapMsg(e.target.value)}
              className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-200 outline-none focus:border-blue-500/50 mb-4 custom-scrollbar"
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowRoadmapModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSendRoadmap}
                disabled={sendingMsg}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
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
