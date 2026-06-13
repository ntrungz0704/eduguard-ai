import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store';
import { api } from '../lib/api';
import {
  LayoutDashboard, BookOpen, MessageSquare, Map,
  TrendingUp, TrendingDown, ChevronRight,
  AlertCircle, CheckCircle, Clock, Award,
  GraduationCap, BarChart2, Send, Paperclip, User, Loader2, Sparkles, HelpCircle, Activity, Check, Bot
} from 'lucide-react';


// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const scoreColor = (s) => {
  if (s >= 8) return '#10b981';   // emerald
  if (s >= 6.5) return '#3b82f6'; // blue
  if (s >= 5) return '#f59e0b';   // amber
  return '#ef4444';               // red
};

const scoreBg = (s) => {
  if (s >= 8) return 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-400';
  if (s >= 6.5) return 'bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-400';
  if (s >= 5) return 'bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-400';
  return 'bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-400';
};

const scoreLabel = (s) => {
  if (s >= 8.5) return 'Xuất sắc';
  if (s >= 8) return 'Giỏi';
  if (s >= 6.5) return 'Khá';
  if (s >= 5) return 'Trung bình';
  return 'Yếu';
};

const ScoreBar = ({ value, max = 10 }) => (
  <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden w-full relative">
    <div
      className="h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
      style={{ width: `${(value / max) * 100}%`, backgroundColor: scoreColor(value) }}
    />
  </div>
);

const TabBtn = ({ active, onClick, icon, label, badge = null }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all relative ${
      active
        ? 'bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 text-slate-900 dark:text-white shadow-lg shadow-sm dark:shadow-blue-500/20 border border-blue-200 dark:border-blue-500/30'
        : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge !== null && badge > 0 && (
      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-slate-900 dark:text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-slate-950 animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

function getCourseCredits(courseNameOrId) {
  const name = String(courseNameOrId || '').trim();
  const lower = name.toLowerCase();
  const code = name.toUpperCase();

  if (lower.includes('thể chất') || lower.includes('vovinam') || code.includes('VIE103')) return 3;
  if (lower.includes('quốc phòng') || lower.includes('gdqp') || code.includes('VIE104')) return 4;
  if (lower.includes('thực tập tốt nghiệp') || code.includes('PRO115') || code.includes('PRO110') || code.includes('PRO116')) return 5;
  if (lower.includes('chính trị') || code.includes('VIE108')) return 5;
  if (lower.includes('dự án tốt nghiệp') || code.includes('PRO2201') || code.includes('PRO220')) return 5;

  if (
    lower.includes('tiếng anh') || lower.includes('tieng anh') || code.includes('ENT')
  ) {
    return 3;
  }

  if (
    lower.includes('kỹ năng học tập') || code.includes('PDP102') ||
    lower.includes('kỹ năng phát triển bản thân') || code.includes('PDP103') ||
    lower.includes('kỹ năng làm việc') || code.includes('PDP104') ||
    lower.includes('pháp luật') || code.includes('VIE1028') || code.includes('VIE1026') || code.includes('VIE102')
  ) {
    return 2;
  }

  return 3;
}

const isConditionalCourse = (courseName, courseId) => {
  const name = (courseName || '').toLowerCase();
  const cid = (courseId || '').toUpperCase();
  return (
    name.includes('thể chất') ||
    name.includes('quốc phòng') ||
    name.includes('thực tập tốt nghiệp') ||
    name.includes('vovinam') ||
    name.includes('gdqp') ||
    name.includes('chính trị') ||
    cid.includes('VIE103') ||
    cid.includes('VIE104') ||
    cid.includes('VIE108') ||
    cid.includes('PRO110') ||
    cid.includes('PRO115') ||
    cid.includes('PRO116')
  );
};

const isEnglishCourse = (courseName, courseId) => {
  const name = (courseName || '').toLowerCase();
  const cid = (courseId || '').toUpperCase();
  return name.includes('tiếng anh') || name.includes('tieng anh') || cid.includes('ENT');
};

const get40Scale = (val) => {
  if (val === null || val === undefined) return 0.0;
  if (val >= 9.0) return 4.0;
  if (val >= 8.0) return 3.5;
  if (val >= 7.0) return 3.0;
  if (val >= 6.0) return 2.5;
  if (val >= 5.0) return 2.0;
  return 0.0;
};

const getLetterGrade = (val) => {
  if (val === null || val === undefined) return 'F';
  if (val >= 9.0) return 'A+';
  if (val >= 8.5) return 'A';
  if (val >= 8.0) return 'A-';
  if (val >= 7.5) return 'B+';
  if (val >= 7.0) return 'B';
  if (val >= 6.5) return 'B-';
  if (val >= 6.0) return 'C+';
  if (val >= 5.5) return 'C';
  if (val >= 5.0) return 'C-';
  if (val >= 4.0) return 'D';
  return 'F';
};

const calculateFptStats = (scores) => {
  const validScores = (scores || []).filter(s => s.value !== null && (s.status === 'PASSED' || s.status === 'FAILED'));
  const academicScores = validScores.filter(s => !isConditionalCourse(s.course?.name || s.courseId, s.courseId) && !isEnglishCourse(s.course?.name || s.courseId, s.courseId) && s.value > 1.0);

  let totalScoreWeight10 = 0;
  let totalScoreWeight4 = 0;
  let totalAcademicCredits = 0;

  academicScores.forEach(s => {
    const credits = s.course?.credits || getCourseCredits(s.courseId || s.course?.name);
    totalScoreWeight10 += (s.value * credits);
    totalScoreWeight4 += (get40Scale(s.value) * credits);
    totalAcademicCredits += credits;
  });

  let totalEarnedCredits = 0;
  validScores.forEach(s => {
    if (s.value >= 5.0 || s.value === 1.0 || s.status === 'PASSED') {
      totalEarnedCredits += s.course?.credits || getCourseCredits(s.courseId || s.course?.name);
    }
  });

  const gpa10 = totalAcademicCredits === 0 ? 0.0 : Math.floor(((totalScoreWeight10 / totalAcademicCredits) + 1e-9) * 10) / 10;
  const gpa4 = totalAcademicCredits === 0 ? 0.0 : Math.round(((totalScoreWeight4 / totalAcademicCredits) + 1e-9) * 100) / 100;

  return {
    gpa10,
    gpa4,
    totalEarnedCredits,
    academicScores,
    validScores,
    academicScoresCount: academicScores.length,
    totalScoresCount: validScores.length
  };
};

// ─────────────────────────────────────────────
//  Overview Tab
// ─────────────────────────────────────────────
function OverviewTab({ data, curriculumCourses, stats }) {
  const predictions = Array.isArray(data?.predictions) ? data.predictions : [];
  
  const gpa = stats.gpa10;
  const gpa4 = stats.gpa4;
  const totalEarnedCredits = stats.totalEarnedCredits;
  const validScores = stats.validScores;
  const completed = validScores.filter(c => c.status === 'PASSED' || c.status === 'FAILED');
  
  // Dynamic GPA target calculation
  let targetGPA = Math.min(10, Math.ceil(gpa * 10) / 10 + 0.5);
  if (gpa === 0) targetGPA = 7.5;
  const totalCurriculumCredits = 120; // Assume 120 credits for total program
  const remainingCredits = Math.max(10, totalCurriculumCredits - totalEarnedCredits);
  const currentPoints = gpa * totalEarnedCredits;
  const targetPoints = targetGPA * totalCurriculumCredits;
  let requiredGPA = remainingCredits > 0 ? ((targetPoints - currentPoints) / remainingCredits) : targetGPA;
  if (requiredGPA > 10) requiredGPA = 10;
  
  // Evaluate goal label
  let targetLabel = "Khá";
  if (targetGPA >= 8.0) targetLabel = "Giỏi";
  if (targetGPA >= 9.0) targetLabel = "Xuất sắc";

  // Strengths: top 3 highest academic scores
  const strengths = [...stats.academicScores].sort((a, b) => b.value - a.value).slice(0, 3);
  // Weaknesses: bottom 3 lowest predicted upcoming courses (Cảnh báo các môn sắp tới dựa trên tiên quyết)
  const weaknesses = predictions
    .filter(p => p.predictedScore < 6.5)
    .sort((a, b) => a.predictedScore - b.predictedScore)
    .map(p => ({
      courseId: p.course?.name || p.courseId,
      value: p.predictedScore,
      isPrediction: true
    }))
    .slice(0, 3);
  
  // At risk predictions
  const atRisk = predictions.filter(p => p.predictedScore < 5);
  const warning = predictions.filter(p => p.predictedScore >= 5 && p.predictedScore < 6.5);

  // Auto AI feedback text
  let aiFeedback = "Dựa trên điểm số quá khứ, bạn đang có phong độ học tập khá ổn định. Cần duy trì sự tập trung ở các môn chuyên ngành.";
  if (gpa >= 8.0) {
    aiFeedback = "Chúc mừng! Bạn có kết quả học tập xuất sắc (GPA ≥ 8.0). AI nhận thấy bạn có tư duy lập trình nhạy bén và khả năng tiếp thu kiến thức cốt lõi cực tốt. Hãy tiếp tục duy trì để săn học bổng học kỳ này!";
  } else if (gpa >= 6.5) {
    aiFeedback = "Học lực của bạn ở mức Khá. AI nhận thấy bạn hoàn thành tốt hầu hết các môn cơ sở. Bạn chỉ cách bằng Giỏi (GPA 8.0) một khoảng ngắn. Hãy tập trung cải thiện các môn đang học có trọng số tín chỉ cao để bứt phá.";
  } else if (gpa > 0) {
    aiFeedback = "AI cảnh báo phong độ hiện tại ở mức Trung bình. Bản đồ lỗ hổng cho thấy bạn gặp khó khăn ở các môn lập trình nền tảng. Bạn nên tham gia các buổi hướng dẫn phụ đạo hoặc hỏi ngay Cố vấn học vụ để tránh nguy cơ rủi ro.";
  }

  // Data for Charts
  const chartData = useMemo(() => {
    const sems = [
      { name: 'Kỳ 1', courses: curriculumCourses.slice(0, 7) },
      { name: 'Kỳ 2', courses: curriculumCourses.slice(7, 12) },
      { name: 'Kỳ 3', courses: curriculumCourses.slice(12, 20) },
      { name: 'Kỳ 4', courses: curriculumCourses.slice(20, 26) },
      { name: 'Kỳ 5', courses: curriculumCourses.slice(26, 32) },
      { name: 'Kỳ 6', courses: curriculumCourses.slice(32, curriculumCourses.length) }
    ];
    let cumTotal = 0;
    let cumCount = 0;

    return sems.map(sem => {
      const validC = sem.courses.filter(c => c.value !== null && !isConditionalCourse(c.courseId, c.courseId));
      let semAvg = null;
      if (validC.length > 0) {
        semAvg = validC.reduce((sum, c) => sum + c.value, 0) / validC.length;
        cumTotal += validC.reduce((sum, c) => sum + c.value, 0);
        cumCount += validC.length;
      }
      return {
        name: sem.name,
        'GPA Học kỳ': semAvg !== null ? Math.round(semAvg * 10) / 10 : null,
        'CPA Tích lũy': cumCount > 0 ? Math.round((cumTotal / cumCount) * 10) / 10 : null
      };
    }).filter(d => d['GPA Học kỳ'] !== null || d['CPA Tích lũy'] !== null);
  }, [curriculumCourses]);

  return (
    <div className="space-y-6">

      {/* GPA Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">GPA Tích lũy thực tế</p>
          {gpa !== null ? (
            <div>
              <div className="text-5xl font-black mt-2 mb-1 bg-white dark:bg-gradient-to-r from-white dark:to-slate-300 bg-clip-text text-transparent" style={{ color: scoreColor(gpa) }}>
                {gpa.toFixed(1)} <span className="text-xl text-slate-500">/10</span>
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Hệ 4: <span className="font-bold text-slate-900 dark:text-white">{gpa4.toFixed(2)}</span>
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full border shadow-sm ${scoreBg(gpa)}`}>
                {scoreLabel(gpa)}
              </span>
            </div>
          ) : (
            <div className="text-slate-500 text-sm mt-3">Chưa có dữ liệu học tập</div>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Tiến độ Hoàn thành</p>
          <div>
            <div className="text-4xl font-black text-slate-900 dark:text-white mt-3">{completed.length} môn</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Đã tích lũy: {totalEarnedCredits} tín chỉ</span>
            </p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Dự báo Học kỳ hiện tại</p>
          <div>
            <div className="flex items-end gap-2 mt-3">
              <span className="text-4xl font-black text-rose-400">{atRisk.length} môn</span>
              <span className="text-slate-500 text-xs mb-1">có nguy cơ trượt</span>
            </div>
            <p className="text-[11px] text-amber-400 mt-1.5 flex items-center gap-1">
              <AlertCircle size={10} />
              <span>{warning.length} môn đang ở vùng trung bình sát sao</span>
            </p>
          </div>
        </div>
      </div>

      {/* Auto AI Analytics Summary */}
      <div className="glass-card p-6 rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-gradient-to-br dark:from-blue-950/20 dark:to-indigo-950/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-blue-500/20"><Sparkles size={60} /></div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-blue-400 animate-pulse" />
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Hệ thống AI Phân tích Học vụ Cá nhân hóa</h4>
        </div>
        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{aiFeedback}</p>
      </div>

      {/* Performance Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Fluctuation Line Chart */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/10 relative overflow-hidden group">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">Dao động phong độ qua từng kỳ</h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Line type="monotone" name="GPA Học kỳ (Dao động)" dataKey="GPA Học kỳ" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="CPA (Tích lũy)" dataKey="CPA Tích lũy" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#0f172a' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranking Area Chart */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/10 relative overflow-hidden group">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4">Tiến trình CPA (Tích lũy)</h4>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorCpa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="CPA Tích lũy" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCpa)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="glass-card p-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-950/5 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-120 transition-transform" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-sm dark:shadow-emerald-500/5">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Điểm mạnh tự động</h3>
              <p className="text-[11px] text-slate-500">Môn học có phong độ xuất sắc nhất</p>
            </div>
          </div>
          {strengths.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Chưa đủ dữ liệu điểm số</p>
          ) : (
            <div className="space-y-4">
              {strengths.map((c, i) => (
                <div key={i} className="hover:bg-white/3 p-2 rounded-lg transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[80%]">{c.courseId}</span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">{c.value.toFixed(1)}</span>
                  </div>
                  <ScoreBar value={c.value} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weaknesses */}
        <div className="glass-card p-6 rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-950/5 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:scale-120 transition-transform" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center shadow-lg shadow-sm dark:shadow-rose-500/5">
              <TrendingDown size={18} className="text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Cần cải thiện học thuật</h3>
              <p className="text-[11px] text-slate-500">Môn học cần cải thiện hoặc đang có rủi ro</p>
            </div>
          </div>
          {weaknesses.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Tuyệt vời! Không có lỗ hổng học thuật nào đáng báo động.</p>
          ) : (
            <div className="space-y-4">
              {weaknesses.map((c, i) => (
                <div key={i} className="hover:bg-white/3 p-2 rounded-lg transition-colors">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[80%]">
                      {c.courseId} {c.isPrediction && <span className="text-[10px] text-rose-500 font-normal italic ml-1">(Dự báo)</span>}
                    </span>
                    <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">{c.value.toFixed(1)}</span>
                  </div>
                  <ScoreBar value={c.value} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Forecast for current semester */}
      {predictions.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center shadow-lg shadow-sm dark:shadow-blue-500/5">
              <BarChart2 size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Dự báo Học kỳ hiện tại (AI Dự toán)</h3>
              <p className="text-[11px] text-slate-500">AI giải thích chi tiết dựa trên liên kết học phần</p>
            </div>
          </div>
          <div className="space-y-3.5">
            {predictions.map((p, i) => {
              const s = p.predictedScore || 0;
              const isLow = s < 5;
              const isMed = s >= 5 && s < 6.5;
              return (
                <div key={i} className={`p-4 rounded-xl border transition-all ${
                  isLow ? 'bg-rose-500/5 border-rose-200 dark:border-rose-500/20 hover:bg-rose-500/10' :
                  isMed ? 'bg-amber-500/5 border-amber-200 dark:border-amber-500/20 hover:bg-amber-500/10' :
                  'bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/10 hover:bg-emerald-500/10'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: scoreColor(s) }} />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{p.courseId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.confidence && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-blue-300">
                          ĐỘ TIN CẬY: {(p.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                        p.risk === 'HIGH' ? 'bg-rose-500/20 border-rose-200 dark:border-rose-500/30 text-rose-400' :
                        p.risk === 'MEDIUM' ? 'bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-400' :
                        'bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-400'
                      }`}>
                        RỦI RO {p.risk === 'HIGH' ? 'CAO' : p.risk === 'MEDIUM' ? 'TRUNG BÌNH' : 'THẤP'}
                      </span>
                      <span className="text-sm font-black" style={{ color: scoreColor(s) }}>{s.toFixed(1)} <span className="text-[10px] text-slate-500">/10</span></span>
                    </div>
                  </div>

                  {/* Explainable AI details (XAI) */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Giải thích XAI (Explainable AI):</p>
                    
                    {p.explanation && (
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300">
                        {p.explanation}
                      </div>
                    )}
                  {p.reasons && Array.isArray(p.reasons) && p.reasons.length > 0 ? (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-white/5 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Giải thích nguyên nhân từ AI:</p>
                      {p.reasons.map((r, rIdx) => {
                        const isNegative = r.impact === 'negative';
                        return (
                          <div key={rIdx} className="flex items-start gap-1.5 text-xs">
                            {isNegative ? (
                              <TrendingDown size={12} className="text-rose-400 mt-0.5 shrink-0" />
                            ) : (
                              <TrendingUp size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                            )}
                            <span className="text-slate-600 dark:text-slate-400">
                              {isNegative ? 'Lỗ hổng từ môn:' : 'Điểm tựa từ môn:'} <span className="text-slate-800 dark:text-slate-200 font-medium">{r.subject}</span> ({r.score}đ) • {isNegative ? 'Làm giảm' : 'Tăng điểm'} dự báo
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-1 pt-1.5 border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-500 italic">
                      Dự báo dựa trên xu hướng học lực chung.
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────
//  Grades Tab
// ─────────────────────────────────────────────
function GradesTab({ curriculumCourses }) {
  const [filter, setFilter] = useState('all');

  const stats = calculateFptStats(curriculumCourses);

  const completed = curriculumCourses.filter(c => c.status === 'PASSED' || c.status === 'FAILED');
  const studying = curriculumCourses.filter(c => c.status === 'STUDYING' || c.isPredicted);
  const notStarted = curriculumCourses.filter(c => c.status === 'NOT_STARTED' && !c.isPredicted);

  const filteredCourses = filter === 'completed' ? completed
    : filter === 'studying' ? studying
    : filter === 'notStarted' ? notStarted
    : curriculumCourses;

  return (
    <div className="space-y-5">
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'Tất cả môn học', count: curriculumCourses.length, color: 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400' },
          { id: 'completed', label: '✅ Đã hoàn thành', count: completed.length, color: 'border-emerald-200 dark:border-emerald-500/20 text-emerald-400 bg-emerald-500/5' },
          { id: 'studying', label: '📊 Đang học (Dự báo)', count: studying.length, color: 'border-blue-200 dark:border-blue-500/20 text-blue-400 bg-blue-500/5' },
          { id: 'notStarted', label: '💤 Chưa học', count: notStarted.length, color: 'border-slate-700/50 text-slate-500 bg-white dark:bg-slate-900/10' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              filter === f.id
                ? 'bg-white text-slate-950 border-white shadow-md'
                : `${f.color} hover:text-white hover:border-white/20`
            }`}
          >
            {f.label} <span className="opacity-60 font-medium">({f.count})</span>
          </button>
        ))}
      </div>

      {/* Curriculum table list */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-12 px-6 py-4 border-b border-slate-200 dark:border-white/5 text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
          <span className="col-span-3">Môn học</span>
          <span className="col-span-2 text-center">Học kỳ</span>
          <span className="col-span-1 text-center">Tín chỉ</span>
          <span className="col-span-2 text-center">Điểm hệ 10</span>
          <span className="col-span-1 text-center">Điểm hệ 4</span>
          <span className="col-span-1 text-center">Điểm chữ</span>
          <span className="col-span-2 text-center">Trạng thái</span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-bold">Không tìm thấy môn học nào phù hợp</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredCourses.map((c, i) => (
              <div key={i} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-white/2 transition-colors">
                <div className="col-span-3 flex items-center gap-3">
                  {c.status === 'PASSED' && <CheckCircle size={15} className="text-emerald-500 shrink-0" />}
                  {c.status === 'FAILED' && <AlertCircle size={15} className="text-rose-500 shrink-0" />}
                  {c.status === 'STUDYING' && <Clock size={15} className="text-blue-400 shrink-0 animate-pulse" />}
                  {c.status === 'NOT_STARTED' && <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0" />}
                  
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{c.courseId}</span>
                </div>
                
                <div className="col-span-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {c.semester || '—'}
                </div>

                <div className="col-span-1 text-center text-xs font-bold text-slate-600 dark:text-slate-400">
                  {c.credits}
                </div>

                <div className="col-span-2 flex justify-center items-center gap-1.5">
                  {c.value !== null ? (
                    <>
                      <span className="text-sm font-black" style={{ color: scoreColor(c.value) }}>
                        {c.value.toFixed(1)}
                      </span>
                      {c.isPredicted && (
                        <span className="text-[8px] font-bold text-blue-400 bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-1 py-0.2 rounded uppercase shrink-0">AI</span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </div>

                <div className="col-span-1 text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  {c.value !== null ? get40Scale(c.value).toFixed(2) : '—'}
                </div>

                <div className="col-span-1 text-center text-xs font-black text-slate-900 dark:text-white">
                  {c.value !== null ? (
                    <span className="bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-0.5 inline-block min-w-[32px] text-center">
                      {getLetterGrade(c.value)}
                    </span>
                  ) : '—'}
                </div>

                <div className="col-span-2 flex justify-center">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${
                    c.status === 'PASSED' ? 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-400' :
                    c.status === 'FAILED' ? 'bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-400' :
                    c.status === 'STUDYING' ? 'bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-400' :
                    'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                  }`}>
                    {c.status === 'PASSED' ? 'Đã đỗ' :
                     c.status === 'FAILED' ? 'Học lại' :
                     c.status === 'STUDYING' ? 'Đang học' : 'Chưa học'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Footer & Statistics Block */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-6 shadow-xl bg-slate-950/10">
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <p>Hiển thị <span className="font-bold text-slate-900 dark:text-white">{filteredCourses.length}</span> môn học</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 bg-white/3 p-4 rounded-xl border border-slate-200 dark:border-white/5">
            <div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Điểm trung bình (Hệ 10)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{stats.gpa10.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Điểm trung bình (Hệ 4)</div>
              <div className="text-2xl font-black text-blue-400 mt-1">{stats.gpa4.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Tín chỉ tích lũy (Đạt / Tổng)</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{stats.totalEarnedCredits} / 100 <span className="text-xs text-slate-500 font-normal">tín</span></div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic mt-3">
            * Ghi chú: Giáo dục thể chất, Giáo dục quốc phòng, Thực tập tốt nghiệp là các môn điều kiện, không tính vào điểm trung bình toàn khóa.
          </p>
        </div>

        <hr className="border-slate-200 dark:border-white/5" />

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">Thống kê môn học</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-slate-600 dark:text-slate-400">{curriculumCourses.filter(c => c.status === 'NOT_STARTED').length}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Chưa học</div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-emerald-400">{curriculumCourses.filter(c => c.status === 'PASSED').length}</div>
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1">Đã môn đạt</div>
            </div>
            <div className="bg-rose-500/5 border border-rose-200 dark:border-rose-500/10 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-rose-400">{curriculumCourses.filter(c => c.status === 'FAILED').length}</div>
              <div className="text-[10px] text-rose-500 font-bold uppercase tracking-wider mt-1">Môn học lại</div>
            </div>
            <div className="bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 rounded-xl p-3 text-center">
              <div className="text-lg font-black text-blue-400">{curriculumCourses.filter(c => c.status === 'STUDYING').length}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Đang học</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────
//  Course Insight Modal (AI Level 2-6)
// ─────────────────────────────────────────────
function CourseInsightModal({ course, dependencies, onClose }) {
  if (!course) return null;
  const isWeak = course.value !== null && course.value < 6.5 && course.status !== 'NOT_STARTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-start justify-between bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={20} className="text-blue-500" />
              {course.courseId} - {course.course?.name || "Chi tiết môn học"}
            </h3>
            <div className="mt-2 flex items-center gap-4">
              <span className="text-sm font-bold bg-white/60 dark:bg-black/20 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
                {course.credits} Tín chỉ
              </span>
              {course.value !== null && (
                <span className="text-sm font-bold flex items-center gap-1" style={{ color: scoreColor(course.value) }}>
                  Điểm: {course.value.toFixed(1)} {course.isPredicted ? '(Dự báo AI)' : ''}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/50 hover:bg-white dark:bg-black/20 dark:hover:bg-white/10 text-slate-500 transition-colors">
            X
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6 custom-scrollbar">
          {!dependencies && course.courseId ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <p>Chưa có dữ liệu phân tích sâu (XAI) cho môn này.</p>
            </div>
          ) : (
            <>
              {/* Role & Careers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5">
                  <h4 className="text-xs font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle size={14}/> Vai trò cốt lõi</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{dependencies.role || 'Đang cập nhật'}</p>
                </div>
                <div className="glass-card p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5">
                  <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1"><Award size={14}/> Hỗ trợ nghề nghiệp</h4>
                  <div className="flex flex-wrap gap-2">
                    {(dependencies.careers || []).map((car, i) => (
                      <span key={i} className="text-[10px] font-bold bg-white dark:bg-black/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                        {car}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skills & Affects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Kỹ năng đạt được</h4>
                  <ul className="space-y-2">
                    {(dependencies.skills || []).map((skill, i) => (
                      <li key={i} className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {skill}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-white/5">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Ảnh hưởng môn sau</h4>
                  <div className="flex flex-wrap gap-2">
                    {(dependencies.affects || []).map((aff, i) => (
                      <span key={i} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                        <TrendingUp size={12} className="text-amber-500" /> {aff}
                      </span>
                    ))}
                    {(!dependencies.affects || dependencies.affects.length === 0) && (
                      <span className="text-sm text-slate-400">Không có môn học phụ thuộc trực tiếp.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Coaching Insight */}
              {isWeak && (
                <div className="p-5 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/20 flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                    <Bot size={20} className="text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-800 dark:text-rose-300">Nhận xét từ AI Cố vấn</h4>
                    <p className="text-sm text-rose-700 dark:text-rose-400 mt-1 font-medium leading-relaxed">
                      Bạn đã hoàn thành môn học nhưng với mức điểm <strong>{course.value.toFixed(1)}</strong>. Môn học này đóng vai trò quan trọng làm nền tảng cho {(dependencies.affects || []).join(', ')}. 
                      <br/>Để không gặp khó khăn ở các môn học sau, bạn nên củng cố lại kiến thức về: <span className="font-bold">{(dependencies.skills || []).slice(0, 2).join(', ')}</span>.
                    </p>
                  </div>
                </div>
              )}
              
              {/* What-If Simulation Simple Version */}
              {course.status === 'STUDYING' && course.isPredicted && (
                 <div className="p-5 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/20">
                   <h4 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                     <Activity size={16} /> Mô phỏng What-If
                   </h4>
                   <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                     Hiện tại AI dự báo bạn có thể đạt {course.value.toFixed(1)}. Nếu bạn tập trung ôn luyện để nâng cao mức điểm này, mức độ sẵn sàng cho các nghề {(dependencies.careers || []).slice(0,2).join(', ')} sẽ được cải thiện đáng kể.
                   </p>
                 </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Roadmap Tab (6 Semesters Curriculum Timeline)
// ─────────────────────────────────────────────
function RoadmapTab({ curriculumCourses, courseDependencies }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Let's divide curriculum courses into 6 semesters dynamically
  const totalCourses = curriculumCourses.length;
  const sem1 = curriculumCourses.slice(0, 7);
  const sem2 = curriculumCourses.slice(7, 12);
  const sem3 = curriculumCourses.slice(12, 20);
  const sem4 = curriculumCourses.slice(20, 26);
  const sem5 = curriculumCourses.slice(26, 32);
  const sem6 = curriculumCourses.slice(32, totalCourses);

  const semesters = [
    { name: 'Học kỳ 1 (Cơ bản)', courses: sem1 },
    { name: 'Học kỳ 2 (Cơ sở ngành)', courses: sem2 },
    { name: 'Học kỳ 3 (Chuyên ngành 1)', courses: sem3 },
    { name: 'Học kỳ 4 (Chuyên ngành 2)', courses: sem4 },
    { name: 'Học kỳ 5 (Nâng cao)', courses: sem5 },
    { name: 'Học kỳ 6 (Tốt nghiệp)', courses: sem6 }
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-gradient-to-br dark:from-blue-950/20 dark:to-indigo-950/10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-sm dark:shadow-blue-500/10">
          <Map size={20} className="text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Lộ trình học tập & Cải thiện học thuật</h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 leading-relaxed">
            Xem toàn bộ hành trình 6 học kỳ tại trường. Dựa trên <strong>khung chương trình chuẩn của FPT Polytechnic</strong>. Điểm số hoàn thành và dự báo AI sẽ chỉ ra lộ trình kiến thức của bạn.
          </p>
        </div>
      </div>

      {/* Timeline Semesters list */}
      <div className="space-y-8 relative before:absolute before:left-5 before:top-6 before:bottom-6 before:w-0.5 before:bg-slate-800">
        {semesters.map((sem, sIdx) => {
          const completedInSem = sem.courses.filter(c => c.status === 'PASSED' || c.status === 'FAILED');
          const isStudyingInSem = sem.courses.some(c => c.status === 'STUDYING' || c.isPredicted);
          
          let semStatus = 'NOT_STARTED'; // COMPLETED, STUDYING, NOT_STARTED
          if (completedInSem.length === sem.courses.length) {
            semStatus = 'COMPLETED';
          } else if (completedInSem.length > 0 || isStudyingInSem) {
            semStatus = 'STUDYING';
          }

          const semCredits = sem.courses.reduce((sum, c) => sum + c.credits, 0);

          return (
            <div key={sIdx} className="relative pl-12 group transition-all duration-300">
              {/* Semester Indicator Node */}
              <div className={`absolute left-2.5 top-1.5 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                semStatus === 'COMPLETED' ? 'bg-emerald-500 ring-4 ring-emerald-500/20 text-slate-900 dark:text-white' :
                semStatus === 'STUDYING' ? 'bg-blue-500 ring-4 ring-blue-500/20 text-slate-900 dark:text-white animate-pulse' :
                'bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 ring-2 ring-slate-950'
              }`}>
                {semStatus === 'COMPLETED' && <Check size={10} className="stroke-[4]" />}
                {semStatus === 'STUDYING' && <Activity size={10} />}
              </div>

              {/* Header */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{sem.name}</h4>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{semCredits} tín chỉ</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  semStatus === 'COMPLETED' ? 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-400' :
                  semStatus === 'STUDYING' ? 'bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-400' :
                  'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-500'
                }`}>
                  {semStatus === 'COMPLETED' ? 'Đã hoàn thành' :
                   semStatus === 'STUDYING' ? 'Đang học' : 'Dự kiến'}
                </span>
              </div>

              {/* Course grid in Semester */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sem.courses.map((c, cIdx) => (
                  <div 
                    key={cIdx} 
                    onClick={() => setSelectedCourse(c)}
                    className={`glass-card p-4 rounded-xl border transition-all hover:-translate-y-0.5 cursor-pointer ${
                      c.status === 'PASSED' ? 'border-emerald-200 dark:border-emerald-500/15 bg-emerald-500/2 hover:shadow-emerald-500/10' :
                      c.status === 'FAILED' ? 'border-rose-200 dark:border-rose-500/15 bg-rose-500/2 hover:shadow-rose-500/10' :
                      c.status === 'STUDYING' ? 'border-blue-200 dark:border-blue-500/30 bg-blue-500/5 hover:shadow-blue-500/10' :
                      'border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 flex-1">{c.courseId}</span>
                      <span className="text-[9px] text-slate-500 shrink-0 font-bold">{c.credits} tín</span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      {c.value !== null ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-black" style={{ color: scoreColor(c.value) }}>
                            {c.value.toFixed(1)}
                          </span>
                          {c.isPredicted && <span className="text-[8px] bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-400 font-bold px-1 rounded">AI</span>}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-medium">Chưa bắt đầu</span>
                      )}

                      <span className={`text-[9px] font-bold uppercase ${
                        c.status === 'PASSED' ? 'text-emerald-400' :
                        c.status === 'FAILED' ? 'text-rose-400' :
                        c.status === 'STUDYING' ? 'text-blue-400' : 'text-slate-600'
                      }`}>
                        {c.status === 'PASSED' ? 'Hoàn thành' :
                         c.status === 'FAILED' ? 'Cần thi lại' :
                         c.status === 'STUDYING' ? 'Đang học' : 'Dự kiến'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <CourseInsightModal 
        course={selectedCourse} 
        dependencies={selectedCourse ? (courseDependencies[selectedCourse.courseId] || courseDependencies[selectedCourse.courseId.replace(/\s+/g,'')]) : null}
        onClose={() => setSelectedCourse(null)} 
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  Integrated Dual Support Chat Tab (AI Bot & Advisor)
// ─────────────────────────────────────────────
function ChatTab({ currentUser, activeStudentData }) {
  const [chatMode, setChatMode] = useState('ai'); // 'ai' or 'advisor'

  // AI Chat states
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: `👋 Chào ${currentUser.name}! Mình là Gia sư AI học tập cá nhân của riêng bạn.\n\nMình đã kết nối trực tiếp với học bạ của bạn. Mình có thể hỗ trợ bạn tự đánh giá học lực, giải thích nguy cơ trượt môn và thiết lập lộ trình tự ôn luyện giúp bạn cải thiện GPA một cách tốt nhất.\n\nHãy nhắn cho mình bất kỳ câu hỏi nào nhé! ✨`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Advisor Messaging states
  const [conversations, setConversations] = useState([]);
  const [advisorMessages, setAdvisorMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [advisorInput, setAdvisorInput] = useState('');
  const [advisorSending, setAdvisorSending] = useState(false);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState(null);
  const [selectedAdvisorName, setSelectedAdvisorName] = useState('Thầy Trung Nguyễn');
  const [availableAdvisors, setAvailableAdvisors] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, advisorMessages, chatMode]);

  // Load AI Chat history
  useEffect(() => {
    if (chatMode === 'ai' && currentUser?.id) {
      const fetchHistory = async () => {
        try {
          const res = await api.get(`/chat/history/${currentUser.id}`);
          if (res.data && res.data.history) {
            setAiMessages(res.data.history);
          }
        } catch (e) {
          console.error('Lỗi lấy lịch sử AI:', e);
        }
      };
      fetchHistory();
    }
  }, [chatMode, currentUser]);

  // Load advisor accounts and messages
  useEffect(() => {
    if (chatMode === 'advisor') {
      fetchAdvisorsAndMessages();
      const interval = setInterval(() => {
        fetchAdvisorsAndMessages(false);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [chatMode, currentUser]);

  const fetchAdvisorsAndMessages = async (showLoading = true) => {
    if (showLoading) setLoadingConv(true);
    try {
      // 1. Fetch available advisors
      const advRes = await api.get('/comm/advisors');
      setAvailableAdvisors(advRes.data || []);

      // 2. Fetch conversations
      const res = await api.get(`/comm/messages/${currentUser.id}?role=STUDENT`);
      setConversations(res.data || []);
      
      let currentPartnerId = selectedAdvisorId;

      if (res.data && res.data.length > 0) {
        // Conversation already exists
        const firstConv = res.data[0];
        currentPartnerId = firstConv.partnerId;
        setSelectedAdvisorId(firstConv.partnerId);
        setSelectedAdvisorName(firstConv.partnerName);
        setAdvisorMessages((firstConv.messages || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      } else if (advRes.data && advRes.data.length > 0) {
        // No conversation, default to the first advisor found
        const firstAdv = advRes.data[0];
        setSelectedAdvisorId(firstAdv.id);
        setSelectedAdvisorName(firstAdv.name);
        setAdvisorMessages([]);
      }
    } catch (e) {
      console.error('Error fetching advisor messages:', e);
    } finally {
      if (showLoading) setLoadingConv(false);
    }
  };

  const handleSelectAdvisor = (adv) => {
    setSelectedAdvisorId(adv.id);
    setSelectedAdvisorName(adv.name);
    // Find if we have active conversation
    const existing = conversations.find(c => c.partnerId === adv.id);
    if (existing) {
      setAdvisorMessages((existing.messages || []).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } else {
      setAdvisorMessages([]);
    }
  };

  const handleSendAi = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { sender: 'user', text: userText, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    setAiLoading(true);

    try {
      const res = await api.post('/chat', {
        message: userText,
        mssv: currentUser.id,
        studentContext: activeStudentData
      });
      setAiMessages(prev => [...prev, { sender: 'ai', text: res.data.reply || 'Hệ thống AI không phản hồi câu trả lời.', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { sender: 'ai', text: 'Xin lỗi, tôi đang quá tải và không thể kết nối tới máy chủ AI lúc này. Vui lòng thử lại sau ít phút.', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendAdvisor = async (e) => {
    e.preventDefault();
    if (!advisorInput.trim() || !selectedAdvisorId) return;

    setAdvisorSending(true);
    const content = advisorInput;
    setAdvisorInput('');

    try {
      const formData = new FormData();
      formData.append('senderId', currentUser.id);
      formData.append('receiverId', selectedAdvisorId);
      formData.append('content', content);

      const res = await api.post('/comm/messages', formData);
      const newMsg = res.data;
      
      setAdvisorMessages(prev => [...prev, newMsg]);
      // refresh conversations list
      const convRes = await api.get(`/comm/messages/${currentUser.id}?role=STUDENT`);
      setConversations(convRes.data || []);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Không thể gửi tin nhắn: ' + err.message);
    } finally {
      setAdvisorSending(false);
    }
  };

  const parseInlineStyles = (text) => {
    if (!text) return '';
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={match.index} className="text-slate-900 dark:text-white font-extrabold">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  const formatText = (text) => {
    if (!text) return '';
    
    const lines = text.split('\n');
    const elements = [];
    let currentTable = null;
    let currentList = null;
    
    const flushList = (key) => {
      if (currentList && currentList.length > 0) {
        elements.push(
          <ul key={key} className="list-disc pl-6 mb-4 space-y-1.5 mt-1">
            {currentList}
          </ul>
        );
        currentList = null;
      }
    };
    
    const flushTable = (key) => {
      if (currentTable) {
        elements.push(
          <div key={key} className="overflow-x-auto my-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-950/40 shadow-xl max-w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-slate-200 dark:border-white/10">
                  {currentTable.headers.map((h, idx) => (
                    <th key={idx} className="p-3 font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">{parseInlineStyles(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentTable.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-slate-700 dark:text-slate-300 font-medium">{parseInlineStyles(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTable = null;
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 1. Detect and parse Markdown Tables
      if (line.startsWith('|')) {
        flushList(`list-${i}`);
        
        const cells = line.split('|')
          .map(c => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          
        const isSeparator = cells.every(c => c.startsWith('-') || c === '');
        
        if (isSeparator) {
          continue;
        }
        
        if (!currentTable) {
          currentTable = { headers: cells, rows: [] };
        } else {
          currentTable.rows.push(cells);
        }
        continue;
      } else {
        flushTable(`table-${i}`);
      }
      
      // 2. Detect and parse List items (bullets)
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        const cleanContent = line.replace(/^[•\-*]\s*/, '');
        const parsedContent = parseInlineStyles(cleanContent);
        
        if (!currentList) {
          currentList = [];
        }
        currentList.push(
          <li key={`li-${i}`} className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs font-medium">
            {parsedContent}
          </li>
        );
        continue;
      } else {
        flushList(`list-${i}`);
      }
      
      // 3. Regular text paragraph
      if (line === '') {
        continue;
      }
      
      const parsedContent = parseInlineStyles(line);
      elements.push(
        <p key={`p-${i}`} className="mb-3 text-slate-700 dark:text-slate-300 leading-relaxed text-xs font-medium">
          {parsedContent}
        </p>
      );
    }
    
    flushList('list-final');
    flushTable('table-final');
    
    return elements;
  };

  return (
    <div 
      className="glass-card rounded-[24px] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col h-[650px] shadow-2xl animate-fade-in w-full"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
    >
      {/* Selector Header */}
      <div className="flex border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 p-1.5 shrink-0">
        <button
          onClick={() => setChatMode('ai')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            chatMode === 'ai'
              ? 'bg-blue-600 text-slate-900 dark:text-white shadow shadow-sm dark:shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles size={14} />
          <span>🤖 Gia sư học tập AI</span>
        </button>
        <button
          onClick={() => setChatMode('advisor')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            chatMode === 'advisor'
              ? 'bg-purple-600 text-slate-900 dark:text-white shadow shadow-sm dark:shadow-purple-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <User size={14} />
          <span>👨‍🏫 Chat trực tiếp với Cố vấn</span>
        </button>
      </div>

      {/* Mode 1: AI Chat Assistant */}
      {chatMode === 'ai' && (
        <div className="flex-1 flex flex-col bg-slate-950/60 min-h-0">
          <div className="p-3 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950/50 flex items-center gap-2 text-xs text-blue-400 font-semibold uppercase tracking-wider shrink-0">
            <Sparkles size={12} className="animate-spin" /> Trò chuyện học tập cùng Gia sư AI cá nhân của bạn
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0 custom-scrollbar bg-slate-950/10">
            {aiMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3.5 max-w-[92%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-900 dark:text-white border flex-shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-white dark:bg-gradient-to-tr dark:from-blue-600 dark:to-indigo-600 border-blue-200 dark:border-blue-500/20 shadow-md'
                    : 'bg-white dark:bg-gradient-to-tr dark:from-purple-600 dark:to-indigo-600 border-purple-200 dark:border-purple-500/20 shadow-md'
                }`}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                <div className="space-y-1 max-w-[90%] flex-1">
                  <div className={
                    msg.sender === 'user'
                      ? 'p-3 px-4 rounded-3xl rounded-tr-none text-xs shadow-md border bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 text-slate-900 dark:text-white border-blue-200 dark:border-blue-500/25 ml-auto w-fit max-w-[85%] font-medium'
                      : 'p-0 bg-transparent border-none shadow-none text-slate-800 dark:text-slate-200 max-w-none text-xs leading-relaxed'
                  }>
                    {msg.sender === 'ai' ? (
                      <div className="prose prose-invert prose-xs max-w-none">
                        {formatText(msg.text)}
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-line text-slate-100 font-medium">{msg.text}</p>
                    )}
                  </div>
                  <div className={`text-[8px] text-slate-500 font-semibold px-1 flex items-center gap-1.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{msg.sender === 'user' ? 'Sinh viên' : 'Gia sư AI'}</span>
                    <span>•</span>
                    <span>{msg.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex gap-3.5 max-w-[92%] mr-auto animate-pulse">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gradient-to-tr dark:from-purple-600 dark:to-indigo-600 flex items-center justify-center text-slate-900 dark:text-white border border-purple-200 dark:border-purple-500/20 shadow-md flex-shrink-0">
                  <Bot size={14} />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="p-0 bg-transparent border-none shadow-none text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce delay-300"></span>
                    <span>AI đang phân tích học bạ...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendAi} className="p-3 border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950 shrink-0 flex gap-2">
            <input
              type="text"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Hỏi về điểm số môn PHP, cách tăng GPA, hay môn chưa học..."
              className="flex-1 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-xl px-4 text-xs text-slate-900 dark:text-white outline-none transition-all outline-none py-3"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiInput.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white rounded-xl transition-colors shadow shadow-sm dark:shadow-blue-500/20 disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Mode 2: Advisor Messaging */}
      {chatMode === 'advisor' && (
        <div className="flex-1 flex min-h-0">
          
          {/* Advisor Selector Sidebar */}
          <div className="w-56 border-r border-slate-200 dark:border-white/5 flex flex-col bg-white dark:bg-slate-900/30 shrink-0 min-h-0">
            <div className="p-3 border-b border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-500 uppercase shrink-0">Danh sách Cố vấn</div>
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              {availableAdvisors.length === 0 ? (
                <div className="p-4 text-center text-slate-600 text-xs italic">Không tìm thấy cố vấn.</div>
              ) : (
                availableAdvisors.map(adv => (
                  <button
                    key={adv.id}
                    onClick={() => handleSelectAdvisor(adv)}
                    className={`w-full p-3 text-left border-b border-slate-200 dark:border-white/5 flex flex-col transition-colors ${
                      selectedAdvisorId === adv.id ? 'bg-purple-500/10 border-l-2 border-l-purple-500' : 'hover:bg-white/3 border-l-2 border-l-transparent'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{adv.name}</span>
                    <span className="text-[9px] text-slate-500 truncate mt-0.5">{adv.email}</span>
                  </button>
                ))
              )}
            </div>

            {/* GPA TARGET & 90-DAY PLAN */}
            <div className="glass-card p-6 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-900/10">
              <h3 className="font-bold text-amber-600 dark:text-amber-400 text-sm mb-4 flex items-center gap-2">
                <Target size={18} /> Mục tiêu GPA & Kế hoạch 90 ngày
              </h3>
              <div className="space-y-4">
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Dựa trên năng lực hiện tại, để đạt <strong>GPA {targetGPA.toFixed(1)} ({targetLabel})</strong> khi ra trường, bạn cần đạt trung bình <strong>{requiredGPA.toFixed(1)}</strong> cho các môn còn lại.
                </p>
                <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-amber-100 dark:border-amber-500/10">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase mb-3">Kế hoạch 90 ngày tới</h4>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                      <span className="text-slate-700 dark:text-slate-300">Tập trung cải thiện 2 môn lập trình sắp tới bằng cách làm thêm 5 bài lab mỗi tuần.</span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                      <span className="text-slate-700 dark:text-slate-300">Hoàn thành đồ án chuyên ngành đúng hạn (đừng để dồn vào tuần cuối).</span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                      <span className="text-slate-700 dark:text-slate-300">Tham gia phụ đạo môn khó (Dự báo rủi ro cao).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Messaging Chat Pane */}
          <div className="flex-1 flex flex-col bg-slate-950/60 min-h-0">
            <div className="p-3 border-b border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950/50 flex items-center justify-between text-xs text-purple-400 font-bold uppercase tracking-wider shrink-0">
              <span>Đang kết nối: {selectedAdvisorName}</span>
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-black shrink-0">ONLINE</span>
            </div>

            {loadingConv ? (
              <div className="flex-1 flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs shrink-0">
                <Loader2 size={16} className="animate-spin mr-2" /> Đang tải lịch sử tin nhắn...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0 custom-scrollbar bg-slate-950/10">
                {advisorMessages.length === 0 ? (
                  <div className="py-12 text-center text-slate-600 text-xs italic">
                    Chưa có tin nhắn nào. Hãy gửi lời chào đến {selectedAdvisorName} để được cố vấn!
                  </div>
                ) : (
                  advisorMessages.map((msg, i) => {
                    const isMe = msg.senderId === currentUser.id;
                    const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    return (
                      <div key={i} className={`flex gap-3.5 max-w-[92%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                        {/* Avatar Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-900 dark:text-white border flex-shrink-0 ${
                          isMe
                            ? 'bg-white dark:bg-gradient-to-tr dark:from-purple-600 dark:to-indigo-600 border-purple-200 dark:border-purple-500/20 shadow-md'
                            : 'bg-white dark:bg-gradient-to-tr dark:from-blue-600 dark:to-indigo-600 border-blue-200 dark:border-blue-500/20 shadow-md'
                        }`}>
                          {isMe ? <User size={14} /> : <GraduationCap size={14} />}
                        </div>

                        <div className="space-y-1 max-w-[90%] flex-1">
                          <div className={
                            isMe
                              ? 'p-3 px-4 rounded-3xl rounded-tr-none text-xs shadow-md border bg-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-600 text-slate-900 dark:text-white border-purple-200 dark:border-purple-500/25 ml-auto w-fit max-w-[85%] font-medium'
                              : 'p-0 bg-transparent border-none shadow-none text-slate-800 dark:text-slate-200 max-w-none text-xs leading-relaxed whitespace-pre-wrap'
                          }>
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                          <div className={`text-[8px] text-slate-500 font-semibold px-1 flex items-center gap-1.5 ${
                            isMe ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>{isMe ? 'Sinh viên' : 'Cố vấn học vụ'}</span>
                            <span>•</span>
                            <span>{formattedTime}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            <form onSubmit={handleSendAdvisor} className="p-3 border-t border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950 shrink-0 flex gap-2">
              <input
                type="text"
                value={advisorInput}
                onChange={e => setAdvisorInput(e.target.value)}
                placeholder={`Nhập nội dung cần hỗ trợ học vụ để gửi tới ${selectedAdvisorName}...`}
                className="flex-1 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 focus:border-purple-500/50 rounded-xl px-4 text-xs text-slate-900 dark:text-white outline-none transition-all outline-none py-3"
              />
              <button
                type="submit"
                disabled={advisorSending || !advisorInput.trim() || !selectedAdvisorId}
                className="p-3 bg-purple-600 hover:bg-purple-500 text-slate-900 dark:text-white rounded-xl transition-colors shadow shadow-sm dark:shadow-purple-500/20 disabled:opacity-50"
              >
                {advisorSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function StudentDashboard() {
  const currentUser = useStore(state => state.currentUser);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };
  const [courseDependencies, setCourseDependencies] = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        // 1. Fetch student data
        const studentRes = await api.get(`/students/${currentUser.id}`);
        
        // 2. Fetch curriculum info
        const currRes = await api.get('/training-info');
        
        // 3. Fetch dependencies
        let depData = {};
        try {
          const depRes = await api.get('/knowledge/dependencies');
          depData = depRes.data.data || {};
        } catch(e) { console.warn("Failed to load dependencies"); }
        
        setData(studentRes.data);
        setCurriculum(currRes.data.curriculumOrder || []);
        setCourseDependencies(depData);
      } catch (err) {
        console.error('Error fetching student dashboard details:', err);
        // Fallback placeholder data
        setData({ scores: [], predictions: [], name: currentUser.name });
        setCurriculum([]);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.id) fetch();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-600 dark:text-slate-400 text-sm font-bold animate-pulse">Hệ thống đang đồng bộ dữ liệu học vụ...</p>
      </div>
    );
  }

  // Compile the status for every course in the curriculum dynamically
  const getSafeArray = (arr) => {
    if (Array.isArray(arr)) return arr;
    if (arr && typeof arr === 'object') return Object.values(arr);
    return [];
  };

  const studentScores = getSafeArray(data?.scores);
  const predictions = getSafeArray(data?.predictions);

  const scoreMap = {};
  studentScores.forEach(s => {
    scoreMap[s.courseId] = s;
  });

  const predictionMap = {};
  predictions.forEach(p => {
    predictionMap[p.courseId] = p;
  });

  const usedScoreIds = new Set();
  // Soft-matching helpers to handle suffixes like (TKTW) or - Vovinam
  const findMatchingScore = (currId) => {
    if (scoreMap[currId] && !usedScoreIds.has(scoreMap[currId].id || scoreMap[currId].courseId)) {
      usedScoreIds.add(scoreMap[currId].id || scoreMap[currId].courseId);
      return scoreMap[currId];
    }
    const cleanCurr = currId.toLowerCase().replace(/\s+/g, '');
    const found = studentScores.find(s => {
      if (usedScoreIds.has(s.id || s.courseId)) return false;
      const cleanS = s.courseId.toLowerCase().replace(/\s+/g, '');
      const cleanName = (s.course?.name || '').toLowerCase().replace(/\s+/g, '');
      return (
        cleanS.includes(cleanCurr) ||
        cleanCurr.includes(cleanS) ||
        cleanName === cleanCurr ||
        cleanName.includes(cleanCurr) ||
        cleanCurr.includes(cleanName) ||
        (cleanCurr.includes('thểchất') && (cleanS.includes('thểchất') || cleanName.includes('thểchất'))) ||
        (cleanCurr.includes('dựánmẫu') && (cleanS.includes('dựánmẫu') || cleanName.includes('dựánmẫu')))
      );
    });
    if (found) usedScoreIds.add(found.id || found.courseId);
    return found;
  };

  const findMatchingPrediction = (currId) => {
    if (predictionMap[currId]) return predictionMap[currId];
    const cleanCurr = currId.toLowerCase().replace(/\s+/g, '');
    return predictions.find(p => {
      const cleanP = p.courseId.toLowerCase().replace(/\s+/g, '');
      const cleanName = (p.course?.name || '').toLowerCase().replace(/\s+/g, '');
      return (
        cleanP.includes(cleanCurr) ||
        cleanCurr.includes(cleanP) ||
        cleanName === cleanCurr ||
        cleanName.includes(cleanCurr) ||
        cleanCurr.includes(cleanName) ||
        (cleanCurr.includes('thểchất') && (cleanP.includes('thểchất') || cleanName.includes('thểchất'))) ||
        (cleanCurr.includes('dựánmẫu') && (cleanP.includes('dựánmẫu') || cleanName.includes('dựánmẫu')))
      );
    });
  };

  // Dynamic mapping
  const curriculumCourses = curriculum.map(courseId => {
    const scoreObj = findMatchingScore(courseId);
    const predObj = findMatchingPrediction(courseId);
    
    let status = 'NOT_STARTED'; // NOT_STARTED, STUDYING, PASSED, FAILED
    let value = null;
    let isPredicted = false;
    let credits = getCourseCredits(courseId);
    let semester = '';

    if (scoreObj) {
      value = scoreObj.value;
      status = scoreObj.status; // 'PASSED', 'FAILED', 'STUDYING'
      credits = getCourseCredits(scoreObj.courseId || courseId);
      semester = scoreObj.semester;
    }

    if (predObj) {
      status = 'STUDYING';
      value = predObj.predictedScore;
      isPredicted = true;
    }

    if (value === null && status === 'STUDYING') {
      if (predObj) {
        value = predObj.predictedScore;
        isPredicted = true;
      }
    }

    return {
      courseId,
      value,
      status,
      credits,
      isPredicted,
      prediction: predObj,
      semester: semester || (predObj ? 'Kỳ hiện tại' : '')
    };
  });

  // Append any courses that the student took but are not in the curriculumOrder list
  const matchedCourseIds = curriculumCourses.map(c => c.courseId);
  studentScores.forEach(s => {
    // Check if this student score was matched by findMatchingScore
    // We can do this by checking if s.courseId is not mapped?
    // Actually, findMatchingScore maps using soft-match. Let's just find if s.courseId or s.course.name is in the matched ones.
    const isMatched = curriculumCourses.some(c => {
      const cleanC = c.courseId.toLowerCase().replace(/\s+/g, '');
      const cleanS = s.courseId.toLowerCase().replace(/\s+/g, '');
      const cleanName = (s.course?.name || '').toLowerCase().replace(/\s+/g, '');
      return cleanC === cleanS || cleanC === cleanName || cleanC.includes(cleanS) || cleanS.includes(cleanC);
    });

    if (!isMatched) {
      const predObj = predictionMap[s.courseId];
      curriculumCourses.push({
        courseId: s.course?.name || s.courseId,
        value: s.value,
        status: s.status,
        credits: getCourseCredits(s.courseId),
        isPredicted: false,
        prediction: predObj,
        semester: s.semester || 'Tự chọn/Học lại'
      });
    }
  });

  // Calculate actual completed GPA using unified FPT Polytechnic logic on raw scores
  const stats = calculateFptStats(studentScores);
  const gpa = stats.gpa10;
  const gpa4 = stats.gpa4;
  const totalEarnedCredits = stats.totalEarnedCredits;
  const validScoresCount = stats.totalScoresCount;

  const tabs = [
    { id: 'overview', icon: <LayoutDashboard size={15} />, label: 'Tổng quan Học tập' },
    { id: 'grades',   icon: <BookOpen size={15} />,        label: 'Bảng điểm Chi tiết' },
    { id: 'roadmap',  icon: <Map size={15} />,             label: 'Lộ trình Cải thiện' },
    { id: 'chat',     icon: <MessageSquare size={15} />,   label: 'Hỏi đáp Cố vấn' },
  ];

  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in">

      {/* ── Visual Profile Hero Header ── */}
      <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden relative shadow-2xl">
        <div className="h-2 bg-white dark:bg-gradient-to-r dark:from-blue-500 dark:via-purple-600 dark:via-indigo-600 dark:to-pink-500" />
        <div className="p-8 flex flex-col md:flex-row items-center gap-6 relative">
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none"><GraduationCap size={150} /></div>

          {/* Avatar with luxury border */}
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-blue-500 dark:via-indigo-600 dark:to-purple-600 flex items-center justify-center text-slate-900 dark:text-white text-3xl font-black shrink-0 shadow-xl shadow-sm dark:shadow-blue-500/20 border-2 border-slate-200 dark:border-white/15">
            {(data?.name || currentUser.name || 'S')[0].toUpperCase()}
          </div>

          {/* Student detail text */}
          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{data?.name || currentUser.name}</h2>
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded-full uppercase">Sinh viên</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1">
              <span>MSSV: <span className="text-slate-800 dark:text-slate-200 font-bold">{currentUser.id}</span></span>
              <span>Lớp: <span className="text-slate-800 dark:text-slate-200 font-bold">{data?.classCode || 'WD18301'}</span></span>
              <span>Hệ đào tạo: <span className="text-slate-800 dark:text-slate-200 font-bold">Cao đẳng (FPT Poly)</span></span>
            </p>
          </div>

          {/* GPA Luxury circle */}
          {gpa !== null && (
            <div className="shrink-0 text-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 p-4 rounded-2xl w-44 shadow-inner">
              <div className="flex justify-around items-center">
                <div>
                  <div className="text-2xl font-black" style={{ color: scoreColor(gpa) }}>{gpa.toFixed(1)}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Hệ 10</div>
                </div>
                <div className="h-6 w-px bg-slate-50 dark:bg-slate-800" />
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{gpa4.toFixed(2)}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Hệ 4</div>
                </div>
              </div>
              <div className="text-[9px] text-slate-600 dark:text-slate-400 mt-2 font-bold uppercase tracking-wider">
                Tín chỉ: <span className="text-amber-400">{totalEarnedCredits} TC</span>
              </div>
              <div className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase mt-2 inline-block ${scoreBg(gpa)}`}>
                {scoreLabel(gpa)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sleek Premium Navigation Tabs ── */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-2 shadow-lg">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <TabBtn
              key={t.id}
              active={activeTab === t.id}
              onClick={() => handleTabChange(t.id)}
              icon={t.icon}
              label={t.label}
            />
          ))}
        </div>
      </div>

      {/* ── Dynamic Tab Content Render ── */}
      {activeTab === 'overview' && <OverviewTab data={data} curriculumCourses={curriculumCourses} stats={stats} />}
      {activeTab === 'grades'   && <GradesTab curriculumCourses={curriculumCourses} />}
      {activeTab === 'roadmap'  && <RoadmapTab curriculumCourses={curriculumCourses} courseDependencies={courseDependencies} />}
      {activeTab === 'chat'     && <ChatTab currentUser={currentUser} activeStudentData={data} />}

    </div>
  );
}
