import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useStore } from '../store';
import {
  ArrowLeft, Briefcase, TrendingUp, Star, Zap, Code2, Wrench, Users,
  BookOpen, CheckCircle, XCircle, AlertCircle, Target, Rocket, Clock,
  ChevronDown, ChevronRight, Sparkles, Loader2, ExternalLink, FolderGit2,
  GraduationCap, Brain, BarChart3, Info, Calendar, Award, Play
} from 'lucide-react';

const DEMAND_COLORS = {
  'VERY HIGH': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', label: 'Rất cao' },
  'HIGH': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-500', label: 'Cao' },
  'BOOMING': { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500', label: 'Bùng nổ 🔥' },
  'MEDIUM': { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', label: 'Trung bình' },
};

const READINESS_LEVELS = [
  { min: 0, max: 20, label: 'Explorer', color: '#64748b', bg: 'bg-slate-500' },
  { min: 21, max: 40, label: 'Foundation', color: '#f59e0b', bg: 'bg-amber-500' },
  { min: 41, max: 60, label: 'Beginner Intern', color: '#3b82f6', bg: 'bg-blue-500' },
  { min: 61, max: 80, label: 'Internship Ready', color: '#10b981', bg: 'bg-emerald-500' },
  { min: 81, max: 100, label: 'Job Ready', color: '#8b5cf6', bg: 'bg-purple-500' },
];

function getReadinessConfig(score) {
  return READINESS_LEVELS.find(l => score >= l.min && score <= l.max) || READINESS_LEVELS[0];
}

function ReadinessGauge({ score, level }) {
  const config = getReadinessConfig(score);
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
          <circle cx="60" cy="60" r="50" fill="none" stroke={config.color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900 dark:text-white">{score}</span>
          <span className="text-[10px] text-slate-500 font-bold">/100</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-black" style={{ color: config.color }}>{level || config.label}</span>
    </div>
  );
}

export default function CareerDetail() {
  const { careerId } = useParams();
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);

  const [career, setCareer] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [generatedProject, setGeneratedProject] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all careers using correct endpoint /v1/knowledge/careers
        let careersRes;
        try {
          careersRes = await api.get('/v1/knowledge/careers');
        } catch {
          careersRes = await api.get('/knowledge/careers');
        }
        const allCareers = careersRes.data.data || [];
        const found = allCareers.find(c => c.id === careerId);
        setCareer(found || null);

        // Fetch student analysis using correct endpoint /v1/knowledge/careers/:goal/analyze/:mssv
        if (currentUser?.role === 'STUDENT' && currentUser?.id && found) {
          try {
            let analysisRes;
            try {
              analysisRes = await api.get(`/v1/knowledge/careers/${careerId}/analyze/${currentUser.id}`);
            } catch {
              analysisRes = await api.get(`/knowledge/careers/${careerId}/analyze/${currentUser.id}`);
            }
            setAnalysis(analysisRes.data.data || null);
          } catch (e) {
            console.warn('Analysis not available:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load career:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [careerId, currentUser]);

  const mode = (currentUser?.role === 'STUDENT' && currentUser?.id) ? 'STUDENT' : 'GUEST';

  // Helper to determine status of a skill in the roadmap
  const getSkillStatus = (skillName) => {
    if (mode === 'GUEST') return 'none';
    if (!analysis) return 'none';

    const cleanSkill = skillName.toLowerCase();
    const haveCore = (analysis.skillGap?.core?.have || []).map(s => s.toLowerCase());
    const haveAdv = (analysis.skillGap?.advanced?.have || []).map(s => s.toLowerCase());
    const missingCore = (analysis.skillGap?.core?.missing || []).map(s => s.toLowerCase());
    const missingAdv = (analysis.skillGap?.advanced?.missing || []).map(s => s.toLowerCase());

    if (haveCore.includes(cleanSkill) || haveAdv.includes(cleanSkill)) return 'acquired';
    if (missingCore.includes(cleanSkill) || missingAdv.includes(cleanSkill)) {
      // Check if student is currently taking a course that teaches this skill
      const isStudying = (analysis.academicProgress || []).some(
        c => c.status === 'IN_PROGRESS' && c.skills.some(s => s.toLowerCase() === cleanSkill)
      );
      return isStudying ? 'in_progress' : 'missing';
    }
    return 'none';
  };

  // Group career skills into structured levels dynamically
  const levels = useMemo(() => {
    if (!career) return [];
    const core = career.coreSkills || [];
    const adv = career.advancedSkills || [];

    const lvl1 = core.slice(0, Math.ceil(core.length / 2));
    const lvl2 = core.slice(Math.ceil(core.length / 2));
    const lvl3 = adv.slice(0, Math.ceil(adv.length / 2));
    const lvl4 = adv.slice(Math.ceil(adv.length / 2));

    return [
      { name: 'Cấp độ 1: Nền tảng thiết yếu', skills: lvl1, desc: 'Kiến thức cốt lõi bắt buộc để bắt đầu' },
      { name: 'Cấp độ 2: Lập trình thực chiến', skills: lvl2, desc: 'Các kỹ năng xây dựng logic và xử lý cơ bản' },
      { name: 'Cấp độ 3: Kỹ năng nâng cao', skills: lvl3, desc: 'Frameworks và kỹ thuật nâng cao giúp tăng hiệu suất' },
      { name: 'Cấp độ 4: Vận hành & Hệ thống', skills: lvl4, desc: 'Công cụ bổ trợ, triển khai và bảo mật thực tế' },
      { name: 'Cấp độ 5: Mục tiêu ứng tuyển', skills: ['Portfolio', 'Internship'], desc: 'Hoàn thiện sản phẩm và sẵn sàng thực tập' }
    ].filter(lvl => lvl.skills.length > 0);
  }, [career]);

  // Skill detail description helper
  const getSkillDetail = (skillName) => {
    // Dynamically look up which school courses teach this skill
    const courses = (analysis?.academicProgress || []).filter(c =>
      c.skills.some(s => s.toLowerCase().includes(skillName.toLowerCase()) || skillName.toLowerCase().includes(s.toLowerCase()))
    );

    return {
      name: skillName,
      courses: courses.map(c => ({ id: c.courseId, name: c.courseName, status: c.status })),
      recommendation: `Để thành thạo ${skillName}, hãy tập trung thực hành thông qua các bài Lab/Assignment tại trường và các dự án mini cá nhân.`
    };
  };

  // Generate personalized portfolio project
  const handleGenerateProject = () => {
    if (!career) return;
    setGenerating(true);
    setTimeout(() => {
      const missingCore = analysis?.skillGap?.core?.missing || [];
      const missingAdv = analysis?.skillGap?.advanced?.missing || [];
      const allMissing = [...missingCore, ...missingAdv];

      const techStack = allMissing.slice(0, 3);
      if (techStack.length === 0) {
        techStack.push("Docker", "System Design", "CI/CD");
      }

      let projectName = "Dự án cá nhân hóa";
      let projectDesc = "Xây dựng ứng dụng hoàn chỉnh.";
      let features = ["Thiết kế giao diện", "Xử lý logic nghiệp vụ", "Kiểm thử ứng dụng"];
      let boost = 10;

      const name = career.careerName.toLowerCase();
      if (name.includes("backend")) {
        projectName = "EduGuard Advanced API Gateway";
        projectDesc = `Hệ thống REST API máy chủ hiệu năng cao phục vụ quản lý thông tin, tích hợp bảo mật và caching sử dụng ${techStack.join(", ")}.`;
        features = [
          "Thiết kế cơ sở dữ liệu quan hệ tối ưu hóa truy vấn.",
          "Xây dựng cơ chế xác thực JWT và phân quyền chi tiết.",
          "Cấu hình Redis caching giảm tải cho database.",
          "Đóng gói ứng dụng vào Docker container."
        ];
        boost = 12;
      } else if (name.includes("frontend") || name.includes("react") || name.includes("next.js")) {
        projectName = "Interactive Learning SaaS Dashboard";
        projectDesc = `Giao diện dashboard quản trị phân tích số liệu học tập thời gian thực, responsive và chuẩn SEO sử dụng ${techStack.join(", ")}.`;
        features = [
          "Xây dựng hệ thống các widget biểu đồ tương tác.",
          "Tích hợp State Management quản lý dữ liệu tập trung.",
          "Tối ưu SEO và Server-Side Rendering (Next.js).",
          "Viết kiểm thử tự động (Unit Test với Jest/Cypress)."
        ];
        boost = 10;
      } else if (name.includes("mobile") || name.includes("flutter") || name.includes("react native")) {
        projectName = "Smart Campus Companion Mobile App";
        projectDesc = `Ứng dụng di động đa nền tảng giúp sinh viên tra cứu lịch học, bản đồ trường và nhận thông báo đẩy sử dụng ${techStack.join(", ")}.`;
        features = [
          "Thiết kế giao diện di động UX/UI hiện đại.",
          "Tích hợp định vị GPS và API bản đồ.",
          "Xử lý lưu trữ dữ liệu offline khi mất kết nối mạng.",
          "Cấu hình Firebase Cloud Messaging nhận thông báo."
        ];
        boost = 15;
      } else if (name.includes("devops") || name.includes("cloud")) {
        projectName = "GitOps Auto-Scaling Cloud Infrastructure";
        projectDesc = `Hạ tầng đám mây tự động tích hợp CI/CD pipeline và giám sát tài nguyên sử dụng ${techStack.join(", ")}.`;
        features = [
          "Viết script Infrastructure as Code (Terraform) tạo tài nguyên cloud.",
          "Thiết lập GitHub Actions pipeline tự động build và deploy.",
          "Triển khai giám sát Prometheus + Grafana cảnh báo lỗi tự động.",
          "Cấu hình Load Balancer tự động phân tải."
        ];
        boost = 15;
      } else if (name.includes("ai")) {
        projectName = "RAG AI Academic Advisor Bot";
        projectDesc = `Hệ thống chatbot tư vấn học vụ thông minh dựa trên tài liệu đào tạo của trường sử dụng công nghệ RAG và ${techStack.join(", ")}.`;
        features = [
          "Module parse và chunk tài liệu học vụ.",
          "Lưu trữ và tìm kiếm ngữ nghĩa trên Vector Database.",
          "Kết nối API mô hình ngôn ngữ lớn (OpenAI/Gemini).",
          "Xây dựng UI chat streaming response mượt mà."
        ];
        boost = 14;
      } else {
        projectName = "Enterprise Enterprise Resource Management";
        projectDesc = `Hệ thống quản lý nguồn lực doanh nghiệp toàn diện tích hợp module phân tích sử dụng ${techStack.join(", ")}.`;
        features = [
          "Thiết kế hệ quản trị cơ sở dữ liệu lớn.",
          "Xây dựng API bảo mật giao tiếp client-server.",
          "Xây dựng giao diện Web App Responsive.",
          "Đóng gói container và triển khai lên Cloud."
        ];
        boost = 12;
      }

      setGeneratedProject({
        name: projectName,
        description: projectDesc,
        techStack,
        features,
        boost
      });
      setGenerating(false);
    }, 1500);
  };

  // 90-Day Weekly Plan generator
  const weeklyPlan = useMemo(() => {
    if (!career) return [];

    const missingCore = analysis?.skillGap?.core?.missing || [];
    const missingAdv = analysis?.skillGap?.advanced?.missing || [];

    const core = missingCore.length > 0 ? missingCore : (career.coreSkills || []);
    const adv = missingAdv.length > 0 ? missingAdv : (career.advancedSkills || []);

    const targetProject = career.portfolios?.[0]?.name || "Dự án cá nhân";

    return [
      {
        weeks: 'Tuần 1-2',
        title: 'Củng cố nền tảng thiết yếu',
        skills: core.slice(0, 2),
        action: `Tìm hiểu kỹ lý thuyết, cú pháp và thực hành viết code nhỏ cho: ${core.slice(0, 2).join(', ') || 'Nền tảng'}.`,
        duration: '1-2 giờ / ngày'
      },
      {
        weeks: 'Tuần 3-4',
        title: 'Xây dựng tư duy logic & cấu trúc',
        skills: core.slice(2, 4),
        action: `Hiểu rõ cơ chế hoạt động, luồng đi của dữ liệu và cách tổ chức code cho: ${core.slice(2, 4).join(', ') || 'Logic cốt lõi'}.`,
        duration: '2 giờ / ngày'
      },
      {
        weeks: 'Tuần 5-6',
        title: 'Cơ sở dữ liệu & Tương tác API',
        skills: core.slice(4).concat(adv.slice(0, 1)),
        action: `Học cách thiết kế database, viết câu lệnh truy vấn và kết nối ứng dụng với cơ sở dữ liệu.`,
        duration: '1.5-2 giờ / ngày'
      },
      {
        weeks: 'Tuần 7-8',
        title: 'Framework nâng cao & Tối ưu hóa',
        skills: adv.slice(1, 3),
        action: `Tập trung vào các chủ đề nâng cao như State Management, Routing, bảo mật và viết test cho: ${adv.slice(1, 3).join(', ') || 'Frameworks'}.`,
        duration: '2 giờ / ngày'
      },
      {
        weeks: 'Tuần 9-10',
        title: 'Xây dựng dự án Portfolio thực tế',
        skills: ['Hoàn thiện dự án'],
        action: `Bắt tay vào code dự án "${targetProject}". Publish code lên GitHub kèm file README.md chỉn chu.`,
        duration: '3 giờ / ngày'
      },
      {
        weeks: 'Tuần 11-12',
        title: 'Dockerize, Cloud Deploy & Phỏng vấn',
        skills: adv.slice(3).concat(['Chuẩn bị CV']),
        action: `Đóng gói dự án bằng Docker, deploy demo lên Render/Vercel/Cloud. Viết CV làm nổi bật Skill Gap đã lấp đầy.`,
        duration: '2 giờ / ngày'
      }
    ].filter(w => w.skills.length > 0 || w.title.includes('Portfolio') || w.title.includes('Deploy'));
  }, [career, analysis]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center py-32">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 size={32} className="text-blue-500 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Đang tải Career Roadmap...</p>
        </div>
      </div>
    );
  }

  if (!career) {
    return (
      <div className="text-center py-32">
        <p className="text-slate-500 font-bold">Không tìm thấy nghề nghiệp này</p>
        <button onClick={() => navigate('/career-universe')} className="mt-4 text-blue-500 text-sm font-bold hover:underline">← Quay lại Career Universe</button>
      </div>
    );
  }

  const demand = DEMAND_COLORS[career.marketDemand] || DEMAND_COLORS['MEDIUM'];

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <button
        onClick={() => navigate('/career-universe')}
        className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors"
      >
        <ArrowLeft size={16} /> Quay lại Career Universe
      </button>

      {/* Career Hero Card */}
      <div className="glass-card rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-gradient-to-br dark:from-blue-950/30 dark:to-indigo-950/20 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 text-blue-500/10"><Sparkles size={120} /></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
          {/* Left Info */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">Lộ trình chi tiết</span>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-2 mb-2 leading-tight">{career.careerName}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">{career.description}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border ${demand.bg} ${demand.border} ${demand.text}`}>
                <TrendingUp size={12} /> Nhu cầu thị trường: {demand.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                💰 Lương phổ biến: {career.salaryRange}
              </span>
            </div>
          </div>

          {/* Right Readiness Gauge (Student only) */}
          {analysis && (
            <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shrink-0">
              <ReadinessGauge score={analysis.readinessScore} level={analysis.readinessLevel} />
              <p className="text-[10px] text-slate-500 font-extrabold mt-2 uppercase tracking-wider">Điểm sẵn sàng thực tập</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto gap-2 pb-px scrollbar-none">
        {[
          { id: 'overview', label: 'Tổng quan nghề', icon: <Info size={14} /> },
          { id: 'roadmap', label: 'Roadmap học tập', icon: <BookOpen size={14} /> },
          { id: 'skills', label: 'Skill Gap Analysis', icon: <Target size={14} />, badge: mode === 'STUDENT' },
          { id: 'portfolio', label: 'Portfolio Generator', icon: <FolderGit2 size={14} /> },
          { id: 'plan90', label: 'Kế hoạch 90 ngày', icon: <Calendar size={14} />, badge: mode === 'STUDENT' },
          { id: 'action', label: 'Hành động & Sẵn sàng', icon: <Award size={14} />, show: mode === 'STUDENT' }
        ].map(tab => {
          if (tab.show === false) return null;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedSkill(null);
              }}
              className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-bold text-xs whitespace-nowrap transition-all relative ${
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute top-2 right-2 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="mt-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-500" /> Vai trò & Công việc hàng ngày
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Với vị trí này, bạn sẽ tham gia trực tiếp vào việc nghiên cứu, phát triển và tối ưu hệ thống phần mềm của doanh nghiệp. 
                  Bạn sẽ làm việc nhóm với các kỹ sư khác, Product Owners và Designer để chuyển hóa các yêu cầu nghiệp vụ thành code chạy ổn định trên production.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Công việc thường trực</h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                      <li>Viết code sạch, dễ maintain và tối ưu hiệu suất.</li>
                      <li>Review code cho các thành viên trong team.</li>
                      <li>Phân tích lỗi hệ thống và tối ưu trải nghiệm.</li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Yêu cầu môi trường</h4>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-4">
                      <li>Khả năng thích ứng nhanh với công nghệ mới.</li>
                      <li>Tư duy giải quyết vấn đề độc lập & nhóm.</li>
                      <li>Sử dụng thành thạo Git/GitHub cho dự án.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {career.futureTrend && (
                <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <TrendingUp size={18} className="text-blue-500" /> Xu hướng công nghệ tương lai
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {career.futureTrend}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Chi tiết kỹ năng</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Core Skills ({career.coreSkills?.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(career.coreSkills || []).map((s, i) => (
                        <span key={i} className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Advanced Skills ({career.advancedSkills?.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(career.advancedSkills || []).map((s, i) => (
                        <span key={i} className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10 text-blue-600 dark:text-blue-400">{s}</span>
                      ))}
                    </div>
                  </div>
                  {(career.tools || []).length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Công cụ thường dùng</span>
                      <div className="flex flex-wrap gap-1.5">
                        {career.tools.map((t, i) => (
                          <span key={i} className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROADMAP (roadmap.sh style) */}
        {activeTab === 'roadmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle: The Visual Tree */}
            <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-slate-500/5 pointer-events-none"><BookOpen size={200} /></div>
              
              <div className="text-center mb-8">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Hành trình học tập chi tiết</h3>
                <p className="text-xs text-slate-500 mt-1">Bấm vào từng kỹ năng để xem chi tiết tài liệu học tập và môn học tại trường</p>
              </div>

              <div className="w-full flex flex-col items-center z-10">
                {levels.map((lvl, idx) => (
                  <React.Fragment key={idx}>
                    {/* Level Card */}
                    <div className="w-full max-w-xl text-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 my-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm">
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">{lvl.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</p>
                    </div>
                    
                    {/* Skill Nodes Grid */}
                    <div className="flex flex-wrap justify-center gap-3 max-w-2xl my-3">
                      {lvl.skills.map((skill, sIdx) => {
                        const status = getSkillStatus(skill);
                        const isSelected = selectedSkill?.name === skill;
                        return (
                          <button
                            key={sIdx}
                            onClick={() => setSelectedSkill(getSkillDetail(skill))}
                            className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5 duration-200 flex items-center gap-2 cursor-pointer ${
                              status === 'acquired' 
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/5' 
                                : status === 'in_progress' 
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 animate-pulse' 
                                : status === 'missing'
                                ? 'bg-rose-500/5 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                            } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                          >
                            {status === 'acquired' && <CheckCircle size={12} className="text-emerald-500" />}
                            {status === 'in_progress' && <Clock size={12} className="text-blue-500" />}
                            {status === 'missing' && <XCircle size={12} className="text-rose-500" />}
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Connection Line */}
                    {idx < levels.length - 1 && (
                      <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-800 my-1 flex items-center justify-center">
                        <ChevronDown size={14} className="text-slate-400 animate-bounce" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right: Node Detail Panel */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info size={16} className="text-blue-500" /> Chi tiết kỹ năng lựa chọn
                </h3>
                
                {selectedSkill ? (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">{selectedSkill.name}</h4>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider mt-1">Trạng thái: {getSkillStatus(selectedSkill.name) === 'acquired' ? 'Đã tích lũy ✅' : getSkillStatus(selectedSkill.name) === 'in_progress' ? 'Đang học 🔄' : 'Chưa có 🔴'}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {selectedSkill.recommendation}
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Môn học tương ứng tại trường:</h5>
                      {selectedSkill.courses.length > 0 ? (
                        <div className="space-y-2">
                          {selectedSkill.courses.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-white/2 border border-slate-200/60 dark:border-white/5">
                              <div className="truncate pr-2">
                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{c.id}</p>
                                <p className="text-[10px] text-slate-500 truncate">{c.name}</p>
                              </div>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                                c.status === 'PASSED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                c.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                              }`}>
                                {c.status === 'PASSED' ? 'Đã đỗ' : c.status === 'FAILED' ? 'Trượt' : 'Chưa học'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Kỹ năng này chưa được dạy trực tiếp qua môn học, bạn nên tự học thêm ngoài chương trình.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Info size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-bold">Bấm chọn một kỹ năng trên sơ đồ để xem thông tin chi tiết</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SKILL GAP */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            {mode === 'STUDENT' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Have Skills */}
                <div className="glass-card rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-6 bg-emerald-500/5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <CheckCircle size={18} className="text-emerald-500" /> Kỹ năng bạn đã có ({ (analysis?.skillGap?.core?.have?.length || 0) + (analysis?.skillGap?.advanced?.have?.length || 0) })
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Core Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.skillGap?.core?.have || []).map((s, i) => (
                          <span key={i} className="text-xs font-bold bg-white dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400">{s}</span>
                        ))}
                        {(analysis?.skillGap?.core?.have || []).length === 0 && <span className="text-xs text-slate-500 italic">Chưa có kỹ năng nào</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Advanced Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.skillGap?.advanced?.have || []).map((s, i) => (
                          <span key={i} className="text-xs font-bold bg-white dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400">{s}</span>
                        ))}
                        {(analysis?.skillGap?.advanced?.have || []).length === 0 && <span className="text-xs text-slate-500 italic">Chưa có kỹ năng nào</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Missing Skills */}
                <div className="glass-card rounded-2xl border border-rose-200 dark:border-rose-500/20 p-6 bg-rose-500/5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <XCircle size={18} className="text-rose-500" /> Kỹ năng bạn đang thiếu ({ (analysis?.skillGap?.core?.missing?.length || 0) + (analysis?.skillGap?.advanced?.missing?.length || 0) })
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">Core Skills cần bổ sung</p>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.skillGap?.core?.missing || []).map((s, i) => (
                          <span key={i} className="text-xs font-bold bg-white dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-lg text-rose-700 dark:text-rose-400">{s}</span>
                        ))}
                        {(analysis?.skillGap?.core?.missing || []).length === 0 && <span className="text-xs text-slate-500 italic">Không có kỹ năng nào thiếu</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">Advanced Skills nâng cao</p>
                      <div className="flex flex-wrap gap-2">
                        {(analysis?.skillGap?.advanced?.missing || []).map((s, i) => (
                          <span key={i} className="text-xs font-bold bg-white dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-lg text-rose-700 dark:text-rose-400">{s}</span>
                        ))}
                        {(analysis?.skillGap?.advanced?.missing || []).length === 0 && <span className="text-xs text-slate-500 italic">Không có kỹ năng nào thiếu</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-12 text-center">
                <Brain size={32} className="mx-auto text-blue-500 mb-3" />
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Tính năng dành riêng cho sinh viên</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">Vui lòng đăng nhập với tài khoản sinh viên FPT để so sánh kỹ năng của bản thân với nhu cầu nghề nghiệp.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PORTFOLIO GENERATOR */}
        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Default recommendations */}
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderGit2 size={18} className="text-blue-500" /> Các dự án được đề xuất cho nghề này
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(career.portfolios || []).map((p, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 space-y-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</h4>
                      <div className="flex flex-wrap gap-1">
                        {(p.learnToApply || []).map((tech, ti) => (
                          <span key={ti} className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-500">{tech}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generator Section (Student only) */}
              {mode === 'STUDENT' && (
                <div className="glass-card rounded-2xl border border-blue-200 dark:border-blue-500/20 p-6 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-blue-500" /> AI Portfolio Generator
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Hệ thống AI sẽ quét những kỹ năng bạn đang thiếu để tạo một đề xuất dự án tối ưu nhất giúp lấp đầy khoảng trống.</p>
                  </div>

                  <button
                    onClick={handleGenerateProject}
                    disabled={generating}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Đang phân tích & thiết kế dự án...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Tạo dự án đề xuất cá nhân hóa
                      </>
                    )}
                  </button>

                  {generatedProject && (
                    <div className="border border-blue-200 dark:border-blue-500/20 rounded-xl bg-white dark:bg-slate-950 p-5 space-y-4 animate-fadeIn">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">{generatedProject.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{generatedProject.description}</p>
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-500 whitespace-nowrap">
                          +{generatedProject.boost}% Readiness
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Công nghệ đề xuất sử dụng:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {generatedProject.techStack.map((tech, i) => (
                            <span key={i} className="text-xs font-extrabold px-2 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300">{tech}</span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Các tính năng chính cần code:</span>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pl-4 list-disc">
                          {generatedProject.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Tại sao cần Portfolio?</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nhà tuyển dụng công nghệ đánh giá cao năng lực code thực tế của bạn hơn là điểm số trên giảng đường.
                  Một dự án Portfolio chất lượng trên GitHub sẽ:
                </p>
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Chứng minh bạn có kinh nghiệm thực tế về công nghệ đó.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Chứng tỏ thói quen quản lý source code sạch qua Git/Commit history.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Giúp bạn tự tin trả lời các câu hỏi kỹ thuật khi phỏng vấn.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: 90 DAY PLAN */}
        {activeTab === 'plan90' && (
          <div className="space-y-6">
            <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <Calendar size={18} className="text-blue-500" /> Kế hoạch học tập 90 ngày (12 tuần)
              </h3>
              <p className="text-xs text-slate-500">Lộ trình học tập chi tiết từng tuần thiết kế riêng giúp bạn sẵn sàng cho cơ hội thực tập gần nhất.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyPlan.map((p, i) => (
                <div key={i} className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 hover:border-blue-500/25 transition-all">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{p.weeks}</span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10} /> {p.duration}</span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{p.title}</h4>
                    <p className="text-xs text-slate-500">{p.action}</p>
                  </div>

                  {p.skills.length > 0 && (
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Trọng tâm:</span>
                      <div className="flex flex-wrap gap-1">
                        {p.skills.map((s, si) => (
                          <span key={si} className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ACTION PLAN */}
        {activeTab === 'action' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Top 5 Action Plan */}
            <div className="lg:col-span-2 glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Rocket size={18} className="text-blue-500" /> Kế hoạch hành động tăng điểm nhanh nhất
                </h3>
                <p className="text-xs text-slate-500 mt-1">Danh sách 5 hành động thực tế tiếp theo giúp nâng cao điểm số và trình độ của bạn.</p>
              </div>

              <div className="space-y-3">
                {analysis.topMissingSkills?.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 group hover:border-blue-300 dark:hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 text-xs font-black">{i + 1}</span>
                      <div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Học kỹ năng {s.skill}</span>
                        <span className="text-[10px] text-slate-500 block">Kỹ năng cốt lõi đang thiếu</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                      +{s.gainedReadiness || 10} điểm
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 group hover:border-blue-300 dark:hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 text-xs font-black">4</span>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Xây dựng dự án Portfolio</span>
                      <span className="text-[10px] text-slate-500 block">Áp dụng công nghệ thực tế</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                    +5 điểm
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 group hover:border-blue-300 dark:hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 text-xs font-black">5</span>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Duy trì điểm chuyên cần</span>
                      <span className="text-[10px] text-slate-500 block">Cải thiện chỉ số Behavior</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap">
                    +3 điểm
                  </span>
                </div>
              </div>
            </div>

            {/* Score Explanation & Projected score */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Giải thích Điểm số</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Academic (Học thuật)', val: Math.round((analysis.scores?.academic / 100) * 30), max: 30, desc: 'Dựa trên số lượng môn học liên quan đã đỗ.' },
                    { label: 'Industry Skills (Kỹ năng)', val: Math.round((analysis.scores?.industry / 100) * 40), max: 40, desc: 'Đánh giá qua các kỹ năng đã được kiểm chứng.' },
                    { label: 'Portfolio (Dự án)', val: Math.round((analysis.scores?.portfolio / 100) * 20), max: 20, desc: 'Đánh giá qua sản phẩm code thực tế.' },
                    { label: 'Behavior (Thái độ)', val: Math.round((analysis.scores?.behavior / 100) * 10), max: 10, desc: 'Chỉ số chuyên cần và tham gia hoạt động.' },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1 pb-2 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{item.label}</span>
                        <span>{item.val}/{item.max}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {analysis.projectedReadiness && (
                <div className="glass-card rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-6 bg-emerald-500/5 text-center space-y-2">
                  <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Dự phóng Điểm Sẵn Sàng</h3>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{analysis.projectedReadiness}/100</div>
                  <p className="text-[11px] text-slate-500">Sau khi hoàn thành các mục tiêu hành động bên trái, bạn sẽ thăng cấp lên trình độ:</p>
                  <span className="inline-block px-3 py-1 bg-emerald-500 text-white font-extrabold text-xs rounded-lg">{getReadinessConfig(analysis.projectedReadiness).label}</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
