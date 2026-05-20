import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Users, BookOpen, AlertTriangle, Database, TrendingUp, ShieldAlert, CheckCircle2, MessageSquare, Activity, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { api, requestWithRestartRetry } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { trainingData, setActiveStudent } = useStore();
  const [redAlerts, setRedAlerts] = useState(null);
  const [kpi, setKpi] = useState({ totalInterventions: 0, improvementRate: 0 });
  const navigate = useNavigate();

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

  if (!trainingData) return <div className="flex h-64 items-center justify-center text-slate-400">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
    Đang tải dữ liệu...
  </div>;

  if (!trainingData.stats) return <div className="flex h-64 items-center justify-center text-slate-400 bg-white/5 rounded-2xl border border-white/10">Chưa có dữ liệu huấn luyện.</div>;

  const totalAtRisk = trainingData.stats.reduce((acc, curr) => acc + curr.atRisk, 0);

  const chartData = [...trainingData.stats]
    .filter(s => s.scored >= 5)
    .sort((a, b) => b.atRisk - a.atRisk)
    .slice(0, 10);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 mb-4 md:mb-0">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Chào mừng, Giảng viên! 👋</h2>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
            Nền tảng <b>EduGuard AI</b> phân tích điểm học kỳ và dự đoán rủi ro bằng thuật toán 
            <span className="text-blue-400 px-1">Linear Regression</span> & 
            <span className="text-purple-400 px-1">Pearson Correlation</span>.
          </p>
        </div>
        {/* KPI Widget */}
        <div className="relative z-10 flex gap-4">
          <div className="bg-white/5 border border-emerald-500/20 px-5 py-3 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Target size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tỷ lệ Cải thiện</p>
              <h4 className="text-xl font-bold text-emerald-400">{kpi.improvementRate}%</h4>
            </div>
          </div>
          <div className="bg-white/5 border border-blue-500/20 px-5 py-3 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Đã Can Thiệp</p>
              <h4 className="text-xl font-bold text-blue-400">{kpi.totalInterventions} <span className="text-xs text-slate-500 font-normal">SV</span></h4>
            </div>
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
                      {alert.isEarlyWarning ? (
                        <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/20">
                          Tuần 1-2
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {alert.weakPrereqs.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {alert.weakPrereqs.map(wp => (
                            <div key={wp.courseId} className="text-xs text-rose-300">
                              <span className="opacity-70">Hổng</span> {wp.courseId}: <span className="font-bold">{wp.score}đ</span>
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
    </div>
  );
}
