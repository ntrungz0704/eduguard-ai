import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
  PieChart, Pie
} from 'recharts';
import { 
  Layers, AlertTriangle, TrendingUp, Activity, ShieldAlert, 
  Award, Zap, CheckCircle2, Loader2, ArrowRight
} from 'lucide-react';

export default function ProgramAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/program-analytics');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error('Lỗi lấy thống kê chương trình:', err);
      setError('Không thể lấy dữ liệu phân tích chương trình học. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 h-[70vh] items-center justify-center text-slate-600 dark:text-slate-400">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-bold animate-pulse">Đang tổng hợp dữ liệu học vụ toàn khóa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 text-rose-300 max-w-2xl mx-auto mt-12">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-rose-500" /> Lỗi Hệ Thống
        </h3>
        <p className="mb-6">{error}</p>
        <button onClick={fetchAnalytics} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all">
          Thử lại
        </button>
      </div>
    );
  }

  const {
    totalStudents,
    riskLevelDistribution,
    topFailedCourses,
    topWeakestCLOs,
    topSkillGaps,
    topPrerequisiteBottlenecks
  } = data;

  // Prepare Pie Chart Data
  const pieData = [
    { name: 'Nguy cơ thấp (LOW)', value: riskLevelDistribution.low, color: '#10b981' },
    { name: 'Nguy cơ trung bình (MEDIUM)', value: riskLevelDistribution.medium, color: '#f59e0b' },
    { name: 'Nguy cơ cao (HIGH)', value: riskLevelDistribution.high, color: '#f97316' },
    { name: 'Nguy cấp (CRITICAL)', value: riskLevelDistribution.critical, color: '#ef4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden bg-white dark:bg-gradient-to-r dark:from-slate-900/60 dark:to-slate-800/60 border border-slate-200 dark:border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Layers className="text-blue-500" size={32} /> Phân Tích Chương Trình Đào Tạo (DSS Dashboard)
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-3xl text-sm leading-relaxed mt-2 font-medium">
            Hệ thống hỗ trợ ra quyết định học vụ (DSS) phân tích tự động trên toàn bộ <b>{totalStudents} sinh viên</b> ngành Thiết kế & Lập trình Website, truy xuất các rủi ro học thuật, CLO yếu nhất, lỗ hổng năng lực để cải tiến chương trình học.
          </p>
        </div>
      </div>

      {/* KPI Cards & Risk Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: KPI Stats */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Học tập an toàn</span>
              <h4 className="text-2xl font-black text-emerald-400">
                {riskLevelDistribution.low} <span className="text-xs font-normal text-slate-500">SV ({((riskLevelDistribution.low / totalStudents) * 100).toFixed(1)}%)</span>
              </h4>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Cảnh báo trung bình</span>
              <h4 className="text-2xl font-black text-amber-400">
                {riskLevelDistribution.medium} <span className="text-xs font-normal text-slate-500">SV ({((riskLevelDistribution.medium / totalStudents) * 100).toFixed(1)}%)</span>
              </h4>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex items-center gap-4">
            <div className="p-3.5 bg-orange-500/20 text-orange-400 rounded-xl">
              <ShieldAlert size={24} />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Nguy cơ cao</span>
              <h4 className="text-2xl font-black text-orange-400">
                {riskLevelDistribution.high} <span className="text-xs font-normal text-slate-500">SV ({((riskLevelDistribution.high / totalStudents) * 100).toFixed(1)}%)</span>
              </h4>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-center gap-4">
            <div className="p-3.5 bg-rose-500/20 text-rose-400 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className="block text-[10px] text-rose-400/80 font-bold uppercase tracking-wider font-mono">Nguy cấp (Cần can thiệp gấp)</span>
              <h4 className="text-2xl font-black text-rose-500">
                {riskLevelDistribution.critical} <span className="text-xs font-normal text-slate-400">SV ({((riskLevelDistribution.critical / totalStudents) * 100).toFixed(1)}%)</span>
              </h4>
            </div>
          </div>
        </div>

        {/* Right Column: Donut Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Phân Phối Rủi Ro Học Tập Toàn Khóa</h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">Tỷ lệ cơ cấu các mức độ rủi ro theo thuật toán Early Risk Assessment</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-slate-500 text-[10px] font-bold uppercase">Tổng sinh viên</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white">{totalStudents}</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="space-y-3 flex-1 max-w-xs">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-semibold p-2 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span className="text-slate-700 dark:text-slate-300">{d.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {d.value} ({((d.value / totalStudents) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Main Stats Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Top 10 Failed Courses */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <TrendingUp className="text-rose-400" size={18} /> Top 10 Môn Học Có Tỷ Lệ Rớt Cao Nhất
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Tỷ lệ sinh viên nhận kết quả tổng kết dưới 5.0đ thực tế trên hệ thống</p>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFailedCourses} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <XAxis dataKey="courseCode" tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                <YAxis unit="%" domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                />
                <Bar dataKey="failRate" name="Tỷ lệ rớt" radius={[4, 4, 0, 0]}>
                  {topFailedCourses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.failRate > 15 ? '#ef4444' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase">
                  <th className="pb-2">Mã môn</th>
                  <th className="pb-2">Tên môn</th>
                  <th className="pb-2 text-center">Tổng SV đã học</th>
                  <th className="pb-2 text-center">Số lượng trượt</th>
                  <th className="pb-2 text-right">Tỷ lệ trượt</th>
                </tr>
              </thead>
              <tbody>
                {topFailedCourses.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-white/5 transition-colors font-medium">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-300">{c.courseCode}</td>
                    <td className="py-2.5 text-slate-900 dark:text-white">{c.courseName}</td>
                    <td className="py-2.5 text-center">{c.total}</td>
                    <td className="py-2.5 text-center text-rose-500">{c.failed}</td>
                    <td className="py-2.5 text-right font-black text-rose-400">{c.failRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 Prerequisite Bottlenecks */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Zap className="text-amber-400" size={18} /> Top 10 Môn Học Nút Thắt Cổ Chai Tiên Quyết
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Chỉ số Bottleneck = Môn tiên quyết bị trượt ảnh hưởng cản trở các học phần phía sau</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPrerequisiteBottlenecks} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <XAxis dataKey="courseCode" tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                <YAxis tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                />
                <Bar dataKey="bottleneckScore" name="Chỉ số nghẽn" radius={[4, 4, 0, 0]}>
                  {topPrerequisiteBottlenecks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#f59e0b" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase">
                  <th className="pb-2">Mã môn</th>
                  <th className="pb-2">Tên môn tiên quyết</th>
                  <th className="pb-2 text-center">Số môn bị chặn phía sau</th>
                  <th className="pb-2 text-center">Số SV trượt môn này</th>
                  <th className="pb-2 text-right">Chỉ số nghẽn học vụ</th>
                </tr>
              </thead>
              <tbody>
                {topPrerequisiteBottlenecks.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-white/5 transition-colors font-medium">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-300">{c.courseCode}</td>
                    <td className="py-2.5 text-slate-900 dark:text-white">{c.courseName}</td>
                    <td className="py-2.5 text-center text-blue-400 font-bold">{c.unlocksCount} môn</td>
                    <td className="py-2.5 text-center text-amber-500 font-bold">{c.blockedStudentsCount} SV</td>
                    <td className="py-2.5 text-right font-black text-amber-500">{c.bottleneckScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 Weakest CLOs */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Award className="text-purple-400" size={18} /> Top 10 Chuẩn Đầu Ra (CLO) Yếu Nhất
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Chỉ số điểm yếu CLO tính toán dựa trên mức độ trượt của các học phần ánh xạ tương ứng</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={topWeakestCLOs} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <XAxis type="number" tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                <YAxis type="category" dataKey="courseId" tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" width={60} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                />
                <Bar dataKey="count" name="Điểm phạt CLO yếu" radius={[0, 4, 4, 0]}>
                  {topWeakestCLOs.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#818cf8" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase">
                  <th className="pb-2">Chuẩn đầu ra (CLO)</th>
                  <th className="pb-2">Môn học gốc</th>
                  <th className="pb-2 text-right">Mức độ yếu kém</th>
                </tr>
              </thead>
              <tbody>
                {topWeakestCLOs.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-white/5 transition-colors font-medium">
                    <td className="py-2.5 text-slate-950 dark:text-slate-200 font-bold">{c.cloName}</td>
                    <td className="py-2.5 text-blue-400 font-mono font-bold">{c.courseId}</td>
                    <td className="py-2.5 text-right font-mono font-black text-indigo-400">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 10 Skill Gaps */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Layers className="text-[#3b82f6]" size={18} /> Top 10 Lỗ Hổng Kỹ Năng / Kiến Thức
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Thống kê số lượng sinh viên nợ môn/thi trượt phân rã theo kỹ năng cấu thành môn học</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSkillGaps} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <XAxis dataKey="skillName" tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                <YAxis tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                />
                <Bar dataKey="count" name="Số lượng sinh viên hổng" radius={[4, 4, 0, 0]}>
                  {topSkillGaps.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase">
                  <th className="pb-2">Kỹ năng / Phân khúc kiến thức</th>
                  <th className="pb-2 text-right">Số lượng sinh viên bị hổng</th>
                </tr>
              </thead>
              <tbody>
                {topSkillGaps.map((c, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-white/5 transition-colors font-medium">
                    <td className="py-2.5 text-slate-950 dark:text-slate-200 font-bold">{c.skillName}</td>
                    <td className="py-2.5 text-right font-black text-blue-400">{c.count} sinh viên</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
