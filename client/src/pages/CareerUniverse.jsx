import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useStore } from '../store';
import {
  Search, Filter, TrendingUp, Briefcase, Code2, Smartphone, TestTube2,
  Cloud, Palette, Bot, Globe, ChevronRight, Sparkles, Loader2, Star,
  Zap, ArrowUpRight, Trophy, Target, Rocket, Layers
} from 'lucide-react';

const ECOSYSTEM = {
  'Web Development': {
    title: 'Web Development 🌐',
    desc: 'Lập trình toàn diện từ giao diện người dùng (Frontend) đến logic máy chủ và cơ sở dữ liệu (Backend)',
    careers: ['Frontend Developer', 'Backend Developer', 'Fullstack Developer'],
    gradient: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-500',
    icon: <Code2 size={16} />
  },
  'Mobile Development': {
    title: 'Mobile Development 📱',
    desc: 'Phát triển ứng dụng di động đa nền tảng và native hiệu năng cao',
    careers: ['Mobile App Developer'],
    gradient: 'from-pink-500/10 to-rose-500/10',
    border: 'border-pink-500/20',
    text: 'text-pink-500',
    icon: <Smartphone size={16} />
  },
  'Data & AI': {
    title: 'Data & AI 🧠',
    desc: 'Khai phá dữ liệu và xây dựng trí tuệ nhân tạo',
    careers: ['Data Analyst', 'Data Engineer', 'Data Scientist', 'AI/ML Engineer'],
    gradient: 'from-violet-500/10 to-fuchsia-500/10',
    border: 'border-violet-500/20',
    text: 'text-violet-500',
    icon: <Bot size={16} />
  },
  'Cloud & DevOps': {
    title: 'Cloud & Infrastructure ☁️',
    desc: 'Thiết kế, triển khai hạ tầng đám mây và mạng',
    careers: ['DevOps Engineer', 'Cloud Architect', 'System Administrator', 'Network Engineer'],
    gradient: 'from-sky-500/10 to-indigo-500/10',
    border: 'border-sky-500/20',
    text: 'text-sky-500',
    icon: <Cloud size={16} />
  },
  'QA & Testing': {
    title: 'QA & Testing 🧪',
    desc: 'Kiểm thử chất lượng phần mềm, đảm bảo độ tin cậy và tự động hóa quy trình test',
    careers: ['QA/Tester (Manual & Automation)'],
    gradient: 'from-amber-500/10 to-orange-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-500',
    icon: <TestTube2 size={16} />
  },
  'UI/UX & Product': {
    title: 'Design & Product 🎨',
    desc: 'Thiết kế giao diện và quản lý sản phẩm phần mềm',
    careers: ['UI/UX Designer', 'Product Manager', 'Business Analyst (BA)'],
    gradient: 'from-emerald-500/10 to-teal-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-500',
    icon: <Palette size={16} />
  },
  'Cybersecurity & Gaming': {
    title: 'Cybersecurity & Gaming 🎮',
    desc: 'Bảo mật hệ thống và phát triển trò chơi',
    careers: ['Cybersecurity Analyst', 'Game Developer'],
    gradient: 'from-rose-500/10 to-red-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-500',
    icon: <Sparkles size={16} />
  }
};

const DEMAND_LABEL = {
  'VERY HIGH': { label: 'Rất cao', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'HIGH': { label: 'Cao', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  'BOOMING': { label: 'Bùng nổ 🔥', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  'MEDIUM': { label: 'TB', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

function TopMatchCard({ career, rank, onClick }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <button onClick={onClick} className="group glass-card rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5 text-left transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:border-amber-400 dark:hover:border-amber-500/50 relative overflow-hidden w-full cursor-pointer">
      <div className="absolute top-3 right-3 text-2xl">{medals[rank] || '⭐'}</div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">#{rank + 1} Phù hợp nhất</p>
      <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">{career.careerName}</h3>
      {career.insufficientEvidence ? (
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-1 rounded inline-block mt-1">
          ⚠️ Không đủ dữ liệu đánh giá nghề {career.careerName}
        </span>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000" style={{ width: `${career.readinessScore || 0}%` }} />
          </div>
          <span className="text-sm font-black text-amber-600 dark:text-amber-400">{career.readinessScore || 0}% Alignment</span>
        </div>
      )}
    </button>
  );
}

function CareerCard({ career, onClick }) {
  const demand = DEMAND_LABEL[career.marketDemand] || DEMAND_LABEL['MEDIUM'];

  return (
    <button
      onClick={onClick}
      className="group glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-5 text-left transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-400 dark:hover:border-blue-500/50 relative overflow-hidden w-full cursor-pointer"
    >
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-500">💰 Lương: {career.salaryRange}</span>
        <span className={`text-[9px] font-bold px-2 py-1 rounded-md border ${demand.bg} ${demand.border} ${demand.color}`}>
          {demand.label}
        </span>
      </div>

      {/* Career Name */}
      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
        {career.careerName}
      </h3>

      {/* Readiness score for students */}
      {career.readinessScore !== undefined && career.readinessScore !== null && (
        <div className="mb-3">
          {career.insufficientEvidence ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">⚠️ Không đủ dữ liệu đánh giá nghề {career.careerName}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-slate-500 uppercase tracking-wider">Chỉ số Phù hợp</span>
                <span className="text-blue-600 dark:text-blue-400">{career.readinessScore}% Alignment</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${career.readinessScore}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Skills Preview */}
      <div className="flex flex-wrap gap-1 mb-4">
        {(career.coreSkills || []).slice(0, 4).map((skill, i) => (
          <span key={i} className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">
            {skill}
          </span>
        ))}
        {(career.coreSkills || []).length > 4 && (
          <span className="text-[9px] font-bold text-blue-500">+{career.coreSkills.length - 4}</span>
        )}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Xem Roadmap & AI Coach →</span>
        <ArrowUpRight size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </button>
  );
}

export default function CareerUniverse() {
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const [careers, setCareers] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mssv = currentUser?.role === 'STUDENT' ? currentUser.id : null;
        let res;
        try {
          res = await api.get('/v1/knowledge/careers', {
            params: mssv ? { mssv } : {}
          });
        } catch {
          res = await api.get('/knowledge/careers', {
            params: mssv ? { mssv } : {}
          });
        }
        const allCareers = res.data.data || [];
        setCareers(allCareers);

        // Compute top matches
        if (mssv && allCareers.length > 0) {
          const sorted = [...allCareers].sort((a, b) => (b.readinessScore || 0) - (a.readinessScore || 0));
          setTopMatches(sorted.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load careers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const categories = useMemo(() => {
    return ['all', ...Object.keys(ECOSYSTEM)];
  }, []);

  const filteredCareers = useMemo(() => {
    let result = careers;
    if (activeCategory !== 'all') {
      const allowedNames = ECOSYSTEM[activeCategory]?.careers || [];
      result = result.filter(c => allowedNames.includes(c.careerName));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.careerName.toLowerCase().includes(q) ||
        (c.coreSkills || []).some(s => s.toLowerCase().includes(q)) ||
        (c.advancedSkills || []).some(s => s.toLowerCase().includes(q))
      );
    }
    return result;
  }, [careers, activeCategory, searchQuery]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center py-32">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Đang tải Career Universe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="glass-card rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-gradient-to-br dark:from-blue-950/30 dark:to-indigo-950/20 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-blue-500/10 pointer-events-none"><Sparkles size={140} /></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full -translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Rocket size={20} className="text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Ecosystem Định hướng</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Khám phá Career Universe</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-5 max-w-2xl">
            Tìm hiểu toàn bộ hệ sinh thái {careers.length} lộ trình nghề nghiệp lập trình và công nghệ thông tin. So khớp kỹ năng, phân tích Chỉ số Phù hợp (Alignment Indicator) và định hướng lộ trình học tập tham khảo.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3 mb-5">
            {[
              { icon: <Briefcase size={14} />, label: `${careers.length} Lộ trình chi tiết`, color: 'blue' },
              { icon: <Target size={14} />, label: 'Phân tích lỗ hổng kỹ năng', color: 'emerald' },
              { icon: <TrendingUp size={14} />, label: 'Chỉ báo Phù hợp (Alignment Indicator)', color: 'purple' },
              { icon: <Star size={14} />, label: 'Kế hoạch 90 ngày & Gợi ý dự án', color: 'amber' },
            ].map((stat, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                <span className="text-blue-500">{stat.icon}</span>
                {stat.label}
              </span>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-lg">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nghề nghiệp, kỹ năng (React, Node.js, Docker, API...)"
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-white/10 transition-all focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            />
          </div>
        </div>
      </div>

      {/* Top Career Match (Student Only) */}
      {currentUser?.role === 'STUDENT' && (
        <div className="animate-fadeIn">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Chỉ báo Định hướng Nghề nghiệp Phù hợp</h2>
          </div>
          {topMatches.filter(c => (c.readinessScore || 0) > 0).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topMatches.filter(c => (c.readinessScore || 0) > 0).slice(0, 3).map((career, i) => (
                <TopMatchCard key={career.id} career={career} rank={i} onClick={() => navigate(`/career/${career.id}`)} />
              ))}
            </div>
          ) : (
            <div className="p-8 glass-panel border border-slate-200 dark:border-white/10 rounded-2xl text-center">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Chưa đủ dữ liệu điểm số để ước tính chỉ số phù hợp nghề nghiệp. Vui lòng cập nhật điểm các môn chuyên ngành.</p>
            </div>
          )}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => {
          const isActive = activeCategory === cat;
          const config = ECOSYSTEM[cat] || {};
          const count = cat === 'all' 
            ? careers.length 
            : careers.filter(c => (config.careers || []).includes(c.careerName)).length;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-blue-500/20 text-slate-900 dark:text-blue-300 border-blue-300 dark:border-blue-500/30 shadow-sm'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30'
              }`}
            >
              {cat === 'all' ? <Filter size={12} /> : config.icon}
              {cat === 'all' ? 'Tất cả' : cat}
              <span className="opacity-50">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grouped Ecosystem Rendering */}
      <div className="space-y-10">
        {Object.entries(ECOSYSTEM).map(([catKey, catVal]) => {
          // Filter careers belonging to this category
          const belongs = filteredCareers.filter(c => catVal.careers.includes(c.careerName));
          if (belongs.length === 0) return null;

          return (
            <div key={catKey} className="space-y-4 animate-fadeIn">
              {/* Category Header Card */}
              <div className={`p-5 rounded-2xl border bg-gradient-to-r ${catVal.gradient} ${catVal.border} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={catVal.text}>{catVal.icon}</span>
                    <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">{catVal.title}</h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{catVal.desc}</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-lg self-start sm:self-center">{belongs.length} nghề</span>
              </div>

              {/* Grid of Career Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {belongs.map(career => (
                  <CareerCard key={career.id} career={career} onClick={() => navigate(`/career/${career.id}`)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCareers.length === 0 && (
        <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-16 text-center">
          <Search size={40} className="mx-auto mb-3 text-slate-400 opacity-30" />
          <p className="text-sm font-bold text-slate-500">Không tìm thấy nghề nghiệp phù hợp</p>
        </div>
      )}
    </div>
  );
}
