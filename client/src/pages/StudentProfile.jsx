import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../lib/api';
import { 
  ArrowLeft, GraduationCap, Mail, Brain, CheckCircle2,
  AlertTriangle, Phone, Calendar, Send, HeartHandshake, Loader2, Sparkles, BookOpen, UserPlus, X, Copy
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const getCourseCredits = (courseNameOrId) => {
  const name = String(courseNameOrId || '').trim();
  const lower = name.toLowerCase();
  const code = name.toUpperCase();

  if (lower.includes('thể chất') || lower.includes('vovinam') || code.includes('VIE103')) return 2;
  if (lower.includes('quốc phòng') || lower.includes('gdqp') || code.includes('VIE104')) return 4;
  if (lower.includes('thực tập tốt nghiệp') || code.includes('PRO115') || code.includes('PRO110') || code.includes('PRO116')) return 5;
  if (lower.includes('chính trị') || code.includes('VIE108')) return 5;
  if (lower.includes('dự án tốt nghiệp') || code.includes('PRO2201') || code.includes('PRO220')) return 5;

  if (
    lower.includes('tiếng anh 1.1') || code.includes('ENT112') || code.includes('ENT111') ||
    lower.includes('tiếng anh 1.2') || code.includes('ENT123') ||
    lower.includes('tiếng anh 2.1') || code.includes('ENT213') ||
    lower.includes('tiếng anh 2.2') || code.includes('ENT223') ||
    lower.includes('kỹ năng học tập') || code.includes('PDP102') ||
    lower.includes('kỹ năng phát triển bản thân') || code.includes('PDP103') ||
    lower.includes('kỹ năng làm việc') || code.includes('PDP104') ||
    lower.includes('pháp luật') || code.includes('VIE1028') || code.includes('VIE102')
  ) {
    return 2;
  }

  return 3;
};

const isConditionalCourse = (courseName, courseId) => {
  const name = (courseName || '').toLowerCase();
  const cid = (courseId || '').toUpperCase();
  return (
    name.includes('thể chất') ||
    name.includes('quốc phòng') ||
    name.includes('thực tập tốt nghiệp') ||
    name.includes('vovinam') ||
    name.includes('gdqp') ||
    cid.includes('VIE103') ||
    cid.includes('VIE104') ||
    cid.includes('PRO110') ||
    cid.includes('PRO115') ||
    cid.includes('PRO116')
  );
};

const get40Scale = (val) => {
  if (val === null || val === undefined) return 0.0;
  if (val >= 9.0) return 4.0;
  if (val >= 8.5) return 3.75;
  if (val >= 8.0) return 3.5;
  if (val >= 7.5) return 3.25;
  if (val >= 7.0) return 3.0;
  if (val >= 6.5) return 2.75;
  if (val >= 6.0) return 2.5;
  if (val >= 5.5) return 2.0;
  if (val >= 5.0) return 1.5;
  if (val >= 4.0) return 1.0;
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

export default function StudentProfile() {
  const { mssv } = useParams();
  const navigate = useNavigate();
  const { setActiveStudent } = useStore();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [interventionNote, setInterventionNote] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [workflowContent, setWorkflowContent] = useState('');

  const fetchStudentProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${mssv}`);
      setStudent(res.data);
      setActiveStudent(res.data);
      setError(null);
      
      if (res.data.scores && res.data.scores.length > 0) {
        const warningSub = (Array.isArray(res.data.scores) ? res.data.scores : Object.values(res.data.scores || {})).find(s => s.value < 5 || s.status === 'FAILED');
        setSelectedCourse(warningSub ? warningSub.courseId : (Array.isArray(res.data.scores) ? res.data.scores : Object.values(res.data.scores || {}))[0].courseId);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Không thể lấy thông tin sinh viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
    return () => { setActiveStudent(null); };
  }, [mssv]);

  const handleFlagIntervention = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return alert('Vui lòng chọn môn học!');
    setUpdating(true);
    try {
      await api.post(`/students/${mssv}/flag`, {
        courseId: selectedCourse,
        action: interventionNote || 'Cần can thiệp sư phạm đặc biệt - Cảnh báo CVHT'
      });
      alert('Đã thiết lập cắm cờ can thiệp thành công!');
      setInterventionNote('');
      await fetchStudentProfile();
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenWorkflow = (type, p) => {
    let content = '';
    const causes = p.explanation ? p.explanation.toLowerCase() : 'các môn học tiên quyết bị hổng';
    
    if (type === 'email') {
      content = `Tiêu đề: [EduGuard] Cảnh báo Học vụ - Cần cải thiện môn ${p.courseId}

Chào em ${student.name},
Cô/Thầy là Cố vấn học tập của em.

Qua phân tích dữ liệu học tập trên hệ thống EduGuard AI, cô/thầy nhận thấy em đang có rủi ro cao gặp khó khăn ở môn ${p.courseId} (Mức rủi ro: ${p.risk}). 
Nguyên nhân cốt lõi mà AI chẩn đoán là do: ${causes}.

Để đảm bảo tiến độ học tập không bị ảnh hưởng, cô/thầy yêu cầu em:
1. Xem lại ngay các bài giảng cơ bản của phần kiến thức bị hổng này.
2. Chủ động liên hệ giảng viên bộ môn hoặc tham gia lớp Tutor để được giải đáp thắc mắc.

Em vui lòng phản hồi lại email này để cô/thầy biết em đã nhận được thông tin và trao đổi kế hoạch khắc phục nhé.

Trân trọng,
Phòng Công tác Sinh viên.`;
    } else if (type === 'tutor') {
      content = `LỚP TUTOR ĐỀ XUẤT CHO MÔN ${p.courseId}
--------------------------------------------------
Dựa trên phân tích lỗ hổng kiến thức của sinh viên ${student.name}, hệ thống EduGuard AI tự động tìm kiếm các lớp Tutor phù hợp để bù đắp:

1. Lớp Tutor bổ trợ nền tảng môn ${p.courseId}
- Giảng viên: Thầy Nguyễn Văn A
- Thời gian: Tối thứ 3, thứ 5 (19:00 - 21:00)
- Hình thức: Online (Google Meet)
- Trọng tâm: Ôn tập cấp tốc kiến thức phần: ${causes}

2. Lớp học nhóm Mentorship (1 Kèm 1)
- Mentor: SV Giỏi Khóa trên (GPA > 8.5)
- Thời gian: Linh hoạt theo lịch rảnh của sinh viên
- Phí tham gia: Miễn phí (Hỗ trợ từ nhà trường)

=> HÀNH ĐỘNG TỰ ĐỘNG: Đã thêm sinh viên ${student.name} vào danh sách chờ xếp lớp Mentorship tự động. Hệ thống sẽ tự gửi Notification qua app FAP khi xếp lớp thành công.`;
    } else if (type === 'call') {
      content = `KỊCH BẢN GỌI ĐIỆN CHO PHỤ HUYNH SINH VIÊN ${student.name}
--------------------------------------------------
- Người nhận: Phụ huynh em ${student.name}
- Tình trạng: Nguy cơ rớt môn ${p.courseId} (${p.risk})

Nội dung gợi ý (AI):
"Dạ chào anh/chị, em là Cố vấn học tập của cháu ${student.name} tại trường. 
Hôm nay em gọi điện để trao đổi về tình hình học tập của cháu hiện tại đang có dấu hiệu đi xuống ở môn ${p.courseId}. 
Hệ thống AI của trường phát hiện cháu đang bị hổng kiến thức từ ${causes}. 
Em mong gia đình cùng phối hợp với nhà trường động viên cháu tham gia đầy đủ các buổi học Tutor bổ trợ vào buổi tối để theo kịp chương trình ạ..."`;
    }
    
    setWorkflowContent(content);
    setActiveWorkflow({ type, p });
  };

  const copyWorkflowToClipboard = () => {
    navigator.clipboard.writeText(workflowContent);
    alert('Đã copy nội dung vào khay nhớ tạm!');
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse p-8">
      <div className="glass-card p-6 rounded-3xl h-48 bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col gap-4">
        <div className="flex gap-6 items-center">
          <div className="w-24 h-24 rounded-full bg-white/10"></div>
          <div className="space-y-3 flex-1">
            <div className="h-8 bg-white/10 rounded-lg w-1/3"></div>
            <div className="h-4 bg-white/5 rounded-lg w-1/4"></div>
            <div className="flex gap-2 mt-2">
              <div className="h-6 w-20 bg-white/10 rounded-full"></div>
              <div className="h-6 w-20 bg-white/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card h-[400px] rounded-3xl bg-white/5 border border-slate-200 dark:border-white/5"></div>
        <div className="glass-card h-[400px] lg:col-span-2 rounded-3xl bg-white/5 border border-slate-200 dark:border-white/5"></div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-rose-500/5 text-rose-300 max-w-2xl mx-auto mt-12">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-rose-500" /> Lỗi Hồ Sơ
        </h3>
        <p className="mb-6">{error}</p>
        <button onClick={() => navigate('/predict')} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
      </div>
    );
  }

  // HÀM HỖ TRỢ PHÂN TÍCH GPA VÀ TÍN CHỈ CHUẨN FPT POLYTECHNIC
  const calculateFptStats = (scores) => {
    const validScores = (scores || []).filter(s => s.value !== null);
    const academicScores = validScores.filter(s => !isConditionalCourse(s.course?.name || s.courseId, s.courseId));

    let totalScoreWeight10 = 0;
    let totalScoreWeight4 = 0;
    let totalAcademicCredits = 0;

    academicScores.forEach(s => {
      const credits = getCourseCredits(s.courseId || s.course?.name);
      totalScoreWeight10 += (s.value * credits);
      totalScoreWeight4 += (get40Scale(s.value) * credits);
      totalAcademicCredits += credits;
    });

    let totalEarnedCredits = 0;
    validScores.forEach(s => {
      if (s.value >= 5.0 || s.status === 'PASSED') {
        totalEarnedCredits += getCourseCredits(s.courseId || s.course?.name);
      }
    });

    const gpa10 = totalAcademicCredits === 0 ? '0.0' : (Math.round(((totalScoreWeight10 / totalAcademicCredits) + 1e-9) * 10) / 10).toFixed(1);
    const gpa4 = totalAcademicCredits === 0 ? '0.00' : (Math.round(((totalScoreWeight4 / totalAcademicCredits) + 1e-9) * 100) / 100).toFixed(2);

    return {
      gpa10,
      gpa4,
      totalEarnedCredits,
      academicScoresCount: academicScores.length,
      totalScoresCount: validScores.length
    };
  };

  // Calculate statistics from actual scores
  const scoreEntries = Array.isArray(student.scores) ? student.scores : Object.values(student.scores || {});
  const passedScores = scoreEntries.filter(s => s.status === 'PASSED' && s.value !== null);
  const failedScores = scoreEntries.filter(s => s.status === 'FAILED' && s.value !== null);
  
  const fptStats = calculateFptStats(scoreEntries);
  const currentGPA = fptStats.gpa10;
  
  // Format chart data (only passed/completed courses)
  const chartData = scoreEntries
    .filter(s => s.value !== null)
    .map(s => ({
      name: s.courseId,
      score: s.value
    }));

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/predict')} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-white rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/5 transition-all">
          <ArrowLeft size={18} /> Quay lại danh sách
        </button>
        <div className="flex items-center gap-3">
          <Link to={`/inbox?mssv=${student.mssv}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all">
            <Send size={16} /> Nhắn tin cho Sinh viên
          </Link>
          <span className="px-3.5 py-1.5 text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full flex items-center gap-1.5 animate-pulse">
            <Brain size={14}/> Hệ thống đang phân tích
          </span>
        </div>
      </div>

      {/* Main Student Header Card */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden bg-white dark:bg-gradient-to-r dark:from-slate-900/60 dark:to-slate-800/60 border border-slate-200 dark:border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gradient-to-tr dark:from-blue-500 dark:to-indigo-600 flex items-center justify-center text-slate-900 dark:text-white font-bold text-2xl shadow-xl shadow-sm dark:shadow-blue-500/20 border border-slate-200 dark:border-white/10">
              {student.name ? student.name.split(' ').pop().substring(0, 2).toUpperCase() : 'SV'}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{student.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                <span>MSSV: <strong className="text-slate-800 dark:text-slate-200">{student.mssv}</strong></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hidden sm:inline-block"></span>
                <span>Lớp: <strong className="text-slate-800 dark:text-slate-200">{student.classCode || 'WD18301'}</strong></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hidden sm:inline-block"></span>
                <span>Chuyên ngành: <strong className="text-blue-400">Thiết kế & Lập trình Web</strong></span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center min-w-[100px]">
              <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 font-mono">GPA Hệ 10</span>
              <span className="text-2xl font-black text-emerald-400 text-glow-green">{fptStats.gpa10}</span>
            </div>
            <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center min-w-[100px]">
              <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 font-mono">GPA Hệ 4</span>
              <span className="text-2xl font-black text-blue-400 text-glow-blue">{fptStats.gpa4}</span>
            </div>
            <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center min-w-[100px]">
              <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 font-mono">Tích Lũy Tín Chỉ</span>
              <span className="text-2xl font-black text-purple-400">{fptStats.totalEarnedCredits} tín</span>
            </div>
            <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center min-w-[100px]">
              <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 font-mono">Môn Trượt</span>
              <span className="text-2xl font-black text-rose-500">{failedScores.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left column: Score history & Charts */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Chart Section */}
          {chartData.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-400" /> Biểu đồ Tiến độ Điểm số Môn học
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                    <YAxis domain={[0, 10]} tick={{fill: '#94a3b8', fontSize: 11}} stroke="#334155" />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                      itemStyle={{color: '#fff'}}
                    />
                    <Bar dataKey="score" name="Điểm môn" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score >= 8 ? '#10b981' : entry.score >= 5 ? '#3b82f6' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Academic Transcripts */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-purple-400"/> Lịch sử Điểm số Học thuật Chi Tiết
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                    <th className="p-4 font-semibold">Mã môn</th>
                    <th className="p-4 font-semibold">Tên Môn học</th>
                    <th className="p-4 font-semibold">Tín chỉ</th>
                    <th className="p-4 font-semibold">Kỳ học</th>
                    <th className="p-4 font-semibold">Điểm hệ 10</th>
                    <th className="p-4 font-semibold">Điểm hệ 4</th>
                    <th className="p-4 font-semibold">Điểm chữ</th>
                    <th className="p-4 font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {scoreEntries.map((score, i) => (
                    <tr key={i} className="border-b border-slate-200 dark:border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{score.courseId}</td>
                      <td className="p-4 text-slate-900 dark:text-white font-medium">{score.course?.name || score.courseId}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{getCourseCredits(score.courseId)} TC</td>
                      <td className="p-4 text-slate-500">{score.semester || 'Summer 2025'}</td>
                      <td className="p-4">
                        <span className={`text-base font-black ${score.value >= 8 ? 'text-emerald-400' : score.value >= 5 ? 'text-blue-400' : 'text-rose-500'}`}>
                          {score.value !== null ? score.value.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300 font-bold">
                        {score.value !== null ? get40Scale(score.value).toFixed(2) : '—'}
                      </td>
                      <td className="p-4">
                        {score.value !== null ? (
                          <span className="bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-0.5 inline-block text-xs font-black text-slate-900 dark:text-white">
                            {getLetterGrade(score.value)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-4">
                        {score.status === 'PASSED' ? (
                          <span className="bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 size={12}/> Đạt</span>
                        ) : score.status === 'FAILED' ? (
                          <span className="bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-400 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1"><XCircle size={12}/> Không đạt</span>
                        ) : (
                          <span className="bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1"><Clock size={12}/> Đang học</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Action panel & History & AI Forecast */}
        <div className="space-y-8">
          
          {/* AI Forecast / XAI Panel */}
          {student.predictions && student.predictions.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-gradient-to-b dark:from-blue-950/20 dark:to-slate-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Brain className="text-blue-400" size={20} /> Hệ thống Giải thích (XAI)
              </h3>
              <div className="space-y-4">
                {student.predictions.map((p, i) => {
                  const isHigh = p.risk === 'HIGH';
                  return (
                    <div key={i} className={`p-4 rounded-xl border bg-slate-200 dark:bg-black/40 ${isHigh ? 'border-rose-200 dark:border-rose-500/30' : 'border-slate-200 dark:border-white/10'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.courseId}</span>
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                            p.risk === 'HIGH' ? 'bg-rose-500/20 border-rose-200 dark:border-rose-500/30 text-rose-400' :
                            p.risk === 'MEDIUM' ? 'bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-400' :
                            'bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-400'
                          }`}>
                            {p.risk}
                          </span>
                          <span className={`font-black ${isHigh ? 'text-rose-400' : 'text-blue-400'}`}>{p.predictedScore.toFixed(1)}% Rủi ro</span>
                        </div>
                      </div>
                      
                      {p.confidence && (
                        <div className="mb-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-blue-300">
                            ĐỘ TIN CẬY: {(p.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}

                      {p.explanation && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Giải thích nguyên nhân:</span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {p.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rule-based Recommendation Layer */}
          {student.predictions && student.predictions.some(p => p.risk === 'CRITICAL' || p.risk === 'HIGH') && (
            <div className="glass-card p-6 rounded-3xl border border-amber-200 dark:border-amber-500/20 bg-white dark:bg-gradient-to-b dark:from-amber-950/20 dark:to-slate-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                <HeartHandshake className="text-amber-400" size={20} /> Hệ thống Đề Xuất Hành Động Can Thiệp (AI Prescriptive)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 relative z-10">
                EduGuard AI không chỉ chẩn đoán nguyên nhân, mà còn tự động khởi tạo các luồng công việc can thiệp cá nhân hóa để giúp bạn giải quyết triệt để vấn đề:
              </p>
              
              <div className="space-y-4 relative z-10">
                {student.predictions.map((p, i) => {
                  if (p.risk !== 'CRITICAL' && p.risk !== 'HIGH') return null;
                  
                  return (
                    <div key={i} className="p-5 bg-slate-200 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/5 hover:border-amber-500/50 transition-all shadow-sm">
                      <div className="text-xs font-black text-amber-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={14} /> Kế hoạch can thiệp: Môn {p.courseId} ({p.risk})
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button 
                          onClick={() => handleOpenWorkflow('email', p)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Mail size={18} />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Soạn Email Nhắc nhở</span>
                          <span className="text-[10px] text-slate-500 text-center mt-1">Cá nhân hóa theo lý do hổng kiến thức</span>
                        </button>
                        
                        <button 
                          onClick={() => handleOpenWorkflow('tutor', p)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <BookOpen size={18} />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Đề xuất Lớp Tutor</span>
                          <span className="text-[10px] text-slate-500 text-center mt-1">Tìm lớp kèm phù hợp với điểm yếu</span>
                        </button>

                        <button 
                          onClick={() => handleOpenWorkflow('call', p)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/30 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Phone size={18} />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Kịch bản Gọi Phụ huynh</span>
                          <span className="text-[10px] text-slate-500 text-center mt-1">AI soạn kịch bản nói chuyện tinh tế</span>
                        </button>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex justify-end">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedCourse(p.courseId);
                            setInterventionNote(`Đã thiết lập luồng can thiệp tự động cho môn ${p.courseId} qua AI.`);
                          }}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold rounded-lg transition-colors border border-amber-200 dark:border-amber-500/20"
                        >
                          Ghi log can thiệp nhanh
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Workflow Modal Overlay */}
          {activeWorkflow && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                <div className={`p-4 border-b flex justify-between items-center ${
                  activeWorkflow.type === 'email' ? 'bg-blue-500/10 border-blue-500/20' : 
                  activeWorkflow.type === 'tutor' ? 'bg-emerald-500/10 border-emerald-500/20' : 
                  'bg-rose-500/10 border-rose-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    {activeWorkflow.type === 'email' && <Mail className="text-blue-500" size={24} />}
                    {activeWorkflow.type === 'tutor' && <BookOpen className="text-emerald-500" size={24} />}
                    {activeWorkflow.type === 'call' && <Phone className="text-rose-500" size={24} />}
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {activeWorkflow.type === 'email' ? 'AI Draft Email - ' : 
                         activeWorkflow.type === 'tutor' ? 'AI Smart Match Tutor - ' : 
                         'AI Call Script - '} 
                        Môn {activeWorkflow.p.courseId}
                      </h3>
                      <p className="text-xs text-slate-500">Tự động khởi tạo dựa trên dữ liệu chẩn đoán của EduGuard XAI</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveWorkflow(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="bg-slate-50 dark:bg-black/30 p-4 rounded-xl border border-slate-200 dark:border-white/5 font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
                    {workflowContent}
                  </div>
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <button onClick={copyWorkflowToClipboard} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <Copy size={16} /> Copy nội dung
                  </button>
                  <button 
                    onClick={() => {
                      alert(activeWorkflow.type === 'tutor' ? 'Đã tự động gửi link Tutor cho sinh viên!' : 'Hành động đã được thực thi thông qua API hệ thống!');
                      setActiveWorkflow(null);
                    }}
                    className={`px-6 py-2 rounded-xl text-white font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-105 ${
                      activeWorkflow.type === 'email' ? 'bg-blue-500 shadow-blue-500/20 hover:bg-blue-400' : 
                      activeWorkflow.type === 'tutor' ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-400' : 
                      'bg-rose-500 shadow-rose-500/20 hover:bg-rose-400'
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    {activeWorkflow.type === 'email' ? 'Gửi Email ngay' : 
                     activeWorkflow.type === 'tutor' ? 'Duyệt Đăng ký Tutor' : 
                     'Đã Gọi xong'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action: Send Warning / Intervention Flag */}
          <div className="glass-card p-6 rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-white dark:bg-gradient-to-b dark:from-rose-950/20 dark:to-slate-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="text-rose-400" size={20} /> Can Thiệp Học Vụ Chủ Động
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Phát hiện môn học nguy cơ trượt cao? Đánh dấu can thiệp sư phạm để gửi cảnh báo trực tiếp tới Cố vấn học tập (CVHT).
            </p>
            
            <form onSubmit={handleFlagIntervention} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Chọn môn học cần can thiệp</label>
                <select 
                  value={selectedCourse}
                  onChange={e => setSelectedCourse(e.target.value)}
                  className="w-full p-3.5 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 focus:border-rose-500/50 outline-none rounded-xl text-slate-900 dark:text-white text-sm transition-colors"
                >
                  {scoreEntries.map(s => (
                    <option key={s.courseId} value={s.courseId} className="bg-white dark:bg-slate-900">
                      {s.courseId} — {s.course?.name || s.courseId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Ghi chú hành động sư phạm</label>
                <textarea 
                  value={interventionNote}
                  onChange={e => setInterventionNote(e.target.value)}
                  placeholder="Ghi chú can thiệp (ví dụ: Kèm 1-1, gọi nhắc nhở nộp ASS1 gấp, đề xuất lớp bổ trợ...)"
                  rows={4}
                  className="w-full p-3.5 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 focus:border-rose-500/50 outline-none rounded-xl text-slate-900 dark:text-white text-sm transition-colors placeholder-slate-600 resize-none"
                />
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold">
                  {successMsg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={submittingFlag || !selectedCourse}
                className="w-full bg-white dark:bg-gradient-to-r dark:from-rose-600 dark:to-orange-600 hover:dark:from-rose-500 hover:dark:to-orange-500 text-slate-900 dark:text-white font-bold p-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {submittingFlag ? 'Đang gửi thông báo...' : <><HeartHandshake size={16}/> Đưa vào diện Chú ý</>}
              </button>
            </form>
          </div>

          {/* Intervention Logs History */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-slate-600 dark:text-slate-400"/> Nhật ký Can Thiệp ({student.interventions?.length || 0})
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {(!student.interventions || student.interventions.length === 0) ? (
                <p className="text-xs text-slate-500 text-center py-6">Chưa có lịch sử can thiệp cho sinh viên này.</p>
              ) : (
                student.interventions.map((int, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">{int.courseId}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{new Date(int.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">"{int.action || int.note}"</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Người can thiệp: <strong className="text-slate-600 dark:text-slate-400">{int.advisor?.name || 'Cố vấn học vụ'}</strong></span>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-md uppercase font-bold text-[8px]">{int.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
