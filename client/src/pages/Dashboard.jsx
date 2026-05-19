import { useStore } from '../store';
import { Users, BookOpen, AlertTriangle, Database, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const { trainingData } = useStore();

  if (!trainingData) return <div className="flex h-64 items-center justify-center text-slate-400">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
    Đang tải dữ liệu...
  </div>;

  if (!trainingData.stats) return <div className="flex h-64 items-center justify-center text-slate-400 bg-white/5 rounded-2xl border border-white/10">Chưa có dữ liệu huấn luyện.</div>;

  const totalAtRisk = trainingData.stats.reduce((acc, curr) => acc + curr.atRisk, 0);

  // Sort subjects by at risk students to show in chart (only for trainable ones)
  const chartData = [...trainingData.stats]
    .filter(s => s.scored >= 5)
    .sort((a, b) => b.atRisk - a.atRisk)
    .slice(0, 10); // Top 10 worst subjects

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Chào mừng, Giảng viên! 👋</h2>
          <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
            Nền tảng <b>EduGuard AI</b> phân tích điểm học kỳ và dự đoán rủi ro bằng thuật toán 
            <span className="text-blue-400 px-1">Linear Regression</span> & 
            <span className="text-purple-400 px-1">Pearson Correlation</span>.
          </p>
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
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
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
                <Bar dataKey="atRisk" name="Số SV Dưới 5" radius={[4, 4, 0, 0]}>
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
