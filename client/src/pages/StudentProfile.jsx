import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../lib/api';
import { 
  ArrowLeft, GraduationCap, Mail, Brain, CheckCircle2,
  AlertTriangle, Phone, Calendar, Send, HeartHandshake, Loader2, Sparkles, BookOpen, UserPlus, X, Copy,
  TrendingUp, XCircle, Clock, ShieldAlert, Wand2, Activity, Layers, AlertCircle, Flame, Target, Briefcase, Repeat
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DEFAULT_CURRICULUM, getCourseCredits, isConditionalCourse, isEnglishCourse } from '../lib/curriculum';


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

const scrollToCourse = (shortCode) => {
  const cleanShort = String(shortCode || '').trim().toUpperCase();
  const elements = document.querySelectorAll('[id^="course-row-"]');
  let targetEl = null;
  
  for (const el of elements) {
    const id = el.id.replace('course-row-', '').toUpperCase();
    if (id === cleanShort || id.includes(cleanShort) || cleanShort.includes(id)) {
      targetEl = el;
      break;
    }
  }
  
  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Flash background
    targetEl.classList.add('bg-blue-500/20', 'dark:bg-blue-500/30');
    setTimeout(() => {
      targetEl.classList.remove('bg-blue-500/20', 'dark:bg-blue-500/30');
    }, 2000);
  }
};

const getCurriculumSemester = (courseId, courseName) => {
  const cid = String(courseId || '').toUpperCase().trim();
  const name = String(courseName || '').toLowerCase().trim();

  if (cid.includes('COM107') || name.includes('tin học')) return 1;
  if (cid.includes('ITI101') || name.includes('nhập môn công nghệ thông tin') || name.includes('nhập môn cntt')) return 1;
  if (cid.includes('COM108') || name.includes('nhập môn lập trình')) return 1;
  if (cid.includes('PDP102') || name.includes('kỹ năng học tập') || name.includes('phát triển cá nhân 1')) return 1;
  if (cid.includes('VIE103') || name.includes('thể chất') || name.includes('vovinam')) return 1;
  if (cid.includes('ENT112') || name.includes('tiếng anh 1.1')) return 1;

  if (cid.includes('WEB101') || name.includes('xây dựng trang web')) return 2;
  if (cid.includes('COM201') || name.includes('cơ sở dữ liệu') || name.includes('csdl')) return 2;
  if (cid.includes('ENT12') || name.includes('tiếng anh 1.2')) return 2;
  if (cid.includes('WEB108') || name.includes('lập trình php cơ bản') || name.includes('php cơ bản')) return 2;
  if (cid.includes('WEB104') || name.includes('lập trình cơ sở với javascript') || name.includes('javascript cơ bản')) return 2;
  if (cid.includes('VIE1016') || cid.includes('VIE108') || name.includes('chính trị')) return 2;

  if (cid.includes('WEB302') || name.includes('html5 & css3') || name.includes('thiết kế web với html5')) return 3;
  if (cid.includes('WEB204') || name.includes('dự án mẫu')) return 3;
  if (cid.includes('WEB201') || name.includes('lập trình php 1') || name.includes('php 1')) return 3;
  if (cid.includes('WEB105') || name.includes('thiết kế ui/ux') || name.includes('ui/ux')) return 3;
  if (cid.includes('ENT21') || name.includes('tiếng anh 2.1')) return 3;
  if (cid.includes('PDP103') || name.includes('phát triển bản thân') || name.includes('phát triển cá nhân 2')) return 3;

  if (cid.includes('WEB206') || name.includes('javascript nâng cao') || name.includes('js nâng cao')) return 4;
  if (cid.includes('ENT22') || name.includes('tiếng anh 2.2')) return 4;
  if (cid.includes('WEB102') || name.includes('quản trị website')) return 4;
  if (cid.includes('WEB501') || name.includes('ecmascript')) return 4;
  if (cid.includes('PRO101') || name.includes('dự án 1')) return 4;
  if (cid.includes('WEB205') || name.includes('marketing trên internet') || name.includes('marketing online')) return 4;

  if (cid.includes('WEB503') || name.includes('nodejs') || name.includes('restful')) return 5;
  if (cid.includes('WEB502') || name.includes('typescript')) return 5;
  if (cid.includes('WEB209') || name.includes('front-end framework 2') || name.includes('framework 2')) return 5;
  if (cid.includes('PDP104') || name.includes('kỹ năng làm việc') || name.includes('phát triển cá nhân 3')) return 5;
  if (cid.includes('WEB208') || name.includes('front-end framework 1') || name.includes('framework 1')) return 5;
  if (cid.includes('SYB301') || name.includes('khởi sự doanh nghiệp')) return 5;

  if (cid.includes('VIE104') || name.includes('quốc phòng') || name.includes('gdqp')) return 6;
  if (cid.includes('PRO11') || name.includes('thực tập tốt nghiệp') || name.includes('thực tập doanh nghiệp')) return 6;
  if (cid.includes('PRO22') || name.includes('dự án tốt nghiệp') || name.includes('đồ án tốt nghiệp')) return 6;
  if (cid.includes('VIE102') || name.includes('pháp luật')) return 6;

  return 1;
};

const detectStudentSemester = (courses) => {
  if (!courses || courses.length === 0) return 1;
  const studiedSems = courses
    .filter(c => c.status !== 'NOT_STARTED')
    .map(c => getCurriculumSemester(c.courseId, c.courseName));
  
  if (studiedSems.length === 0) return 1;
  const maxStudied = Math.max(...studiedSems);
  
  const coursesInMaxSem = courses.filter(c => getCurriculumSemester(c.courseId, c.courseName) === maxStudied);
  const completedInMaxSem = coursesInMaxSem.filter(c => c.status === 'PASSED' || c.status === 'FAILED');
  
  if (completedInMaxSem.length === coursesInMaxSem.length && maxStudied < 6) {
    return maxStudied + 1;
  }
  return maxStudied;
};

export default function StudentProfile() {
  const { mssv: pathMssv } = useParams();
  const [searchParams] = useSearchParams();
  const mssv = pathMssv || searchParams.get('id');
  const navigate = useNavigate();
  const { setActiveStudent } = useStore();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [interventionNote, setInterventionNote] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [generatingNote, setGeneratingNote] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [workflowContent, setWorkflowContent] = useState('');

  const [dssReport, setDssReport] = useState(null);
  const [loadingDss, setLoadingDss] = useState(false);
  const [activeTab, setActiveTab] = useState('transcript');
  const [curriculum, setCurriculum] = useState([]);
  const [courseDependencies, setCourseDependencies] = useState({});
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchStudentProfile = async () => {
    setLoading(true);
    setLoadingDss(true);
    try {
      const res = await api.get(`/students/${mssv}`);
      setStudent(res.data);
      setActiveStudent(res.data);
      setError(null);
      
      // Fetch DSS report dynamically
      try {
        const dssRes = await api.get(`/students/${mssv}/dss-report`);
        setDssReport(dssRes.data);
      } catch (dssErr) {
        console.error('Failed to fetch DSS report:', dssErr);
      }
      // Fetch curriculum order & course dependencies for risk correlation
      try {
        const currRes = await api.get('/training-info');
        setCurriculum(currRes.data.curriculumOrder || []);
      } catch (_) { console.warn('Failed to fetch curriculum'); }
      try {
        const depRes = await api.get('/knowledge/dependencies');
        setCourseDependencies(depRes.data.data || {});
      } catch (_) { console.warn('Failed to fetch course dependencies'); }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Không thể lấy thông tin sinh viên');
    } finally {
      setLoading(false);
      setLoadingDss(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
    return () => { setActiveStudent(null); };
  }, [mssv]);

  // Tự động chọn môn rủi ro cao nhất làm mặc định sau khi load xong (chỉ chọn môn chưa hoàn thành)
  useEffect(() => {
    if (!student?.scores) return;
    const entries = Array.isArray(student.scores) ? student.scores : Object.values(student.scores || {});
    const predictions = student.predictions || [];
    
    let picked = null;
    
    // Tìm môn đang học hoặc chưa học có rủi ro cao
    const highRiskPred = predictions.find(p => {
      if (p.risk !== 'HIGH' && p.risk !== 'CRITICAL') return false;
      const scoreStat = entries.find(s => s.courseId === p.courseId);
      return !scoreStat || (scoreStat.status !== 'PASSED' && scoreStat.status !== 'FAILED');
    });
    
    if (highRiskPred) {
      picked = highRiskPred.courseId;
    } else {
      const medRiskPred = predictions.find(p => {
        if (p.risk !== 'MEDIUM') return false;
        const scoreStat = entries.find(s => s.courseId === p.courseId);
        return !scoreStat || (scoreStat.status !== 'PASSED' && scoreStat.status !== 'FAILED');
      });
      if (medRiskPred) picked = medRiskPred.courseId;
    }
    
    if (picked) setSelectedCourse(picked);
    else setSelectedCourse('');
  }, [student?.mssv]);

  // Tự động sinh ghi chú can thiệp bằng AI cho môn được chọn
  const handleGenerateNote = async () => {
    if (!selectedCourse || !student) return;
    setGeneratingNote(true);
    try {
      const courseScore = scoreEntries.find(s => s.courseId === selectedCourse);
      const prediction = student.predictions?.find(p => p.courseId === selectedCourse);
      const prompt = `Với vai trò là cố vấn học tập, hãy soạn NGẮN GỌN một ghi chú hành động can thiệp sư phạm cụ thể CHỈ cho môn ${selectedCourse} (${courseScore?.course?.name || selectedCourse}) của sinh viên ${student.name}. ` +
        (courseScore ? `Điểm hiện tại: ${courseScore.value !== null ? courseScore.value : 'chưa có'}/10, trạng thái: ${courseScore.status === 'FAILED' ? 'TRƯỢT' : courseScore.status === 'PASSED' ? 'Đạt' : 'Đang học'}. ` : '') +
        (prediction ? `AI dự báo mức rủi ro: ${prediction.risk} (${prediction.predictedScore?.toFixed(0)}%). Nguyên nhân: ${prediction.explanation || 'chưa rõ'}. ` : '') +
        `Ghi chú phải: (1) nêu rõ hành động cụ thể (kèm 1-1 / nhắc nộp bài / đăng ký tutor), (2) thời hạn ưu tiên, (3) kênh liên hệ đề xuất. Trả lời trong 2-3 câu, không dùng markdown.`;

      const res = await api.post('/chat', {
        message: prompt,
        studentContext: student,
        provider: 'gemini',
        history: []
      });
      const raw = res.data?.reply || '';
      // Strip markdown bold markers
      setInterventionNote(raw.replace(/\*\*/g, '').trim());
    } catch (err) {
      console.error('Lỗi AI sinh ghi chú:', err);
      // Fallback template
      const courseScore = scoreEntries.find(s => s.courseId === selectedCourse);
      const prediction = student.predictions?.find(p => p.courseId === selectedCourse);
      setInterventionNote(
        `Can thiệp khẩn môn ${selectedCourse}` +
        (courseScore?.value !== null ? ` (điểm ${courseScore.value}/10)` : '') +
        `: ` +
        (prediction?.risk === 'HIGH' || prediction?.risk === 'CRITICAL'
          ? `Mời SV gặp CVHT trong 48h, đề xuất đăng ký ngay lớp Tutor bổ trợ. Nhắc nhở kiểm tra giữa kỳ và nộp bài tập còn thiếu.`
          : `Theo dõi sát tiến độ, nhắc nhở SV hoàn thành bài tập, liên hệ qua Zalo nếu không phản hồi trong 24h.`)
      );
    } finally {
      setGeneratingNote(false);
    }
  };

  const handleFlagIntervention = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return alert('Vui lòng chọn môn học!');
    setUpdating(true);
    setSubmittingFlag(true);
    setSuccessMsg('');
    try {
      // 1. Đăng ký cắm cờ can thiệp
      await api.post(`/students/${mssv}/flag`, {
        courseId: selectedCourse,
        action: interventionNote || 'Cần can thiệp sư phạm đặc biệt - Cảnh báo CVHT'
      });

      // 2. Tự động xây dựng & gửi tin nhắn vào hộp thư SV
      const courseScore = scoreEntries.find(s => s.courseId === selectedCourse);
      const prediction = student.predictions?.find(p => p.courseId === selectedCourse);
      const courseName = courseScore?.course?.name || selectedCourse;

      // Xây dựng nội dung tin nhắn cảnh báo gửi SV
      let msgContent = '';
      try {
        const prompt = `Soạn một tin nhắn cảnh báo học vụ ngắn gọn, thân thiện gửi thẳng cho sinh viên ${student.name} về môn ${selectedCourse} (${courseName}). ` +
          `Tin nhắn phải gồm 3 phần RÕ RÀNG:\n` +
          `1. EM ĐANG BỊ GÌ: ${courseScore?.status === 'FAILED' ? `Môn này em đã bị trượt (điểm ${courseScore.value}/10).` : courseScore?.value !== null ? `Điểm hiện tại của em là ${courseScore.value}/10 - có nguy cơ rủi ro.` : 'Môn này đang có dấu hiệu rủi ro cao.'} ${prediction?.explanation ? `Nguyên nhân: ${prediction.explanation}` : ''}\n` +
          `2. ĐỀ XUẤT HỌC TẬP: (Ôn lại kiến thức syllabus cụ thể - chương nào, chủ đề nào cần nắm chắc)\n` +
          `3. HỔ TRỢ NGOAI KHOA: đề xuất những nguồn bên ngoài (Tutor, YouTube, khóa học online, nhóm học)\n\n` +
          `${interventionNote ? `Ghi chú thêm từ CVHT: ${interventionNote}\n\n` : ''}` +
          `Xưng hô là Anh/Chị, gọi SV là em. Giọng điệu động viên, không dỊa dẫm. Dùng emoji nhẹ nhàng. Không quá 3 đoạn.`;
        const res = await api.post('/chat', { message: prompt, studentContext: student, provider: 'gemini', history: [] });
        msgContent = (res.data?.reply || '').replace(/\*\*/g, '');
      } catch (_) {
        // Fallback nếu AI lỗi
        msgContent = `Chào em ${student.name},\n\n` +
          `Anh/Chị vừa rà soát tiến độ học tập và nhận thấy em đang có rủi ro ở môn ${selectedCourse} (${courseName}).\n\n` +
          (interventionNote ? `Nội dung can thiệp: ${interventionNote}\n\n` : '') +
          `Đề xuất: Em hãy nhìn lại kiến thức cơ bản của môn này, tham gia lớp Tutor bổ trợ nếu có, và chủ động liên hệ giảng viên bộ môn khi cần hỗ trợ nhé.\n\nAnh/Chị luôn sẵn sàng hỗ trợ em! 💪`;
      }

      // Gửi vào hộp thư SV
      const currentUser = JSON.parse(localStorage.getItem('eduguard_user') || '{}');
      await api.post('/comm/messages', {
        senderId: currentUser.id || 'advisor',
        receiverId: mssv,
        content: msgContent
      });

      setSuccessMsg(`✅ Đã đưa vào diện Chú ý và gửi thông báo vào Hộp thư của ${student.name}!`);
      setInterventionNote('');
      await fetchStudentProfile();
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
      setSubmittingFlag(false);
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
        <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>
      </div>
    );
  }

  // Unified statistics calculated centrally on backend. Client-side calculateFptStats removed.

  // Calculate statistics from actual scores
  const scoreEntries = Array.isArray(student.scores) ? student.scores : Object.values(student.scores || {});
  const passedScores = scoreEntries.filter(s => s.status === 'PASSED' && s.value !== null);
  const failedScores = scoreEntries.filter(s => s.status === 'FAILED' && s.value !== null);
  
  // Chỉ hiện môn có rủi ro trong danh sách can thiệp:
  // - CHỈ hiện môn có dự đoán rủi ro thực sự từ AI (HIGH / CRITICAL / MEDIUM).
  // - Không hiện môn đang học / chưa học mà chưa có dự đoán (tránh ⚠️ Rủi ro sai).
  // - Quy tắc SSOT: bỏ qua môn đã có điểm cuối cùng (PASSED / FAILED).
  //
  // Lý do: Nếu môn A ảnh hưởng đến môn B thì mô hình AI phải dự đoán rủi ro cho B
  // dựa trên điểm A. Chỉ khi có dự đoán rõ ràng thì mới hiện vào danh sách can thiệp.

  const riskyCourses = [];

  // PASS 1 — Môn đang có điểm/trạng thái nhưng chưa hoàn thành, chỉ lấy khi có dự đoán rủi ro
  scoreEntries.forEach(s => {
    if (isConditionalCourse(s.course?.name || s.courseId, s.courseId)) return;
    // Bỏ qua môn đã hoàn thành
    if (s.status === 'PASSED' || s.status === 'FAILED') return;

    const pred = student.predictions?.find(p => p.courseId === s.courseId);
    const isHighRisk = pred && (pred.risk === 'HIGH' || pred.risk === 'CRITICAL');
    const isMediumRisk = pred && pred.risk === 'MEDIUM';

    // Chỉ thêm vào nếu có dự đoán rủi ro thực sự — không thêm chỉ vì đang học/chưa học
    if (isHighRisk || isMediumRisk) {
      riskyCourses.push({
        courseId: s.courseId,
        status: s.status,
        course: { name: s.course?.name || s.courseId }
      });
    }
  });

  if (Array.isArray(student.predictions)) {
    student.predictions.forEach(p => {
      if (isConditionalCourse(p.course?.name || p.courseId, p.courseId)) return;
      const isCompleted = scoreEntries.some(s => s.courseId === p.courseId && (s.status === 'PASSED' || s.status === 'FAILED'));
      const alreadyAdded = riskyCourses.some(rc => rc.courseId === p.courseId);
      
      if (!isCompleted && !alreadyAdded && (p.risk === 'HIGH' || p.risk === 'CRITICAL' || p.risk === 'MEDIUM')) {
        riskyCourses.push({
          courseId: p.courseId,
          status: 'UPCOMING',
          course: { name: p.course?.name || p.courseId }
        });
      }
    });
  }

  // PASS 3: Thêm các môn rủi ro lan truyền từ DSS Report (nếu có) mà chưa có trong list
  if (dssReport && Array.isArray(dssReport.futureRiskWarnings)) {
    dssReport.futureRiskWarnings.forEach(w => {
      if (isConditionalCourse(w.targetCourseName || w.targetCourseId, w.targetCourseId)) return;
      const isCompleted = scoreEntries.some(s => s.courseId === w.targetCourseId && (s.status === 'PASSED' || s.status === 'FAILED'));
      const alreadyAdded = riskyCourses.some(rc => rc.courseId === w.targetCourseId);
      
      if (!isCompleted && !alreadyAdded && (w.severity === 'HIGH' || w.severity === 'CRITICAL' || w.severity === 'MEDIUM')) {
        riskyCourses.push({
          courseId: w.targetCourseId,
          status: 'UPCOMING',
          course: { name: w.targetCourseName || w.targetCourseId }
        });
      }
    });
  }
  
  const fptStats = {
    gpa10: student?.analytics?.gpa10 ?? 0.0,
    gpa4: student?.analytics?.gpa4 ?? 0.0,
    totalEarnedCredits: student?.analytics?.totalEarnedCredits ?? 0,
    academicScoresCount: student?.analytics?.academicScoresCount ?? 0,
    totalScoresCount: student?.analytics?.totalScoresCount ?? 0
  };
  const currentGPA = fptStats.gpa10;
  
  // Format chart data (only passed/completed courses)
  const chartData = scoreEntries
    .filter(s => s.value !== null && !(s.value === 1 && s.status === 'PASSED'))
    .map(s => ({
      name: s.courseId,
      score: s.value,
      status: s.status
    }));

  // ── Build allCourses: merge curriculum (34 courses) + student scores ──
  const buildAllCourses = () => {
    return DEFAULT_CURRICULUM.map(currCourse => {
      // Find matching score entry from database
      const scoreObj = scoreEntries.find(s => {
        const cleanCurrId = String(currCourse.id || '').toUpperCase().trim();
        const cleanDbId = String(s.courseId || '').toUpperCase().trim();
        
        if (cleanDbId === cleanCurrId) {
          return true;
        }
        
        const cleanCurrName = String(currCourse.name || '').toLowerCase().replace(/\s+/g, '');
        const cleanDbName = String(s.course?.name || s.courseId || '').toLowerCase().replace(/\s+/g, '');
        
        if (cleanCurrName && cleanDbName) {
          if (cleanCurrName === cleanDbName) return true;
          if (cleanCurrName.includes('thểchất') && cleanDbName.includes('thểchất')) return true;
          if (cleanCurrName.includes('vovinam') && cleanDbName.includes('vovinam')) return true;
          if (cleanCurrName.includes('dựánmẫu') && cleanDbName.includes('dựánmẫu')) return true;
        }
        return false;
      });

      // Find matching prediction entry from database
      const predObj = student.predictions?.find(p => {
        const cleanCurrId = String(currCourse.id || '').toUpperCase().trim();
        const cleanDbId = String(p.courseId || '').toUpperCase().trim();
        
        if (cleanDbId === cleanCurrId) {
          return true;
        }
        
        const cleanCurrName = String(currCourse.name || '').toLowerCase().replace(/\s+/g, '');
        const cleanDbName = String(p.course?.name || p.courseId || '').toLowerCase().replace(/\s+/g, '');
        
        if (cleanCurrName && cleanDbName) {
          if (cleanCurrName === cleanDbName) return true;
          if (cleanCurrName.includes('thểchất') && cleanDbName.includes('thểchất')) return true;
          if (cleanCurrName.includes('vovinam') && cleanDbName.includes('vovinam')) return true;
          if (cleanCurrName.includes('dựánmẫu') && cleanDbName.includes('dựánmẫu')) return true;
        }
        return false;
      });

      const displayCourseId = scoreObj?.courseId || predObj?.courseId || currCourse.id;
      const displayCourseName = scoreObj?.course?.name || currCourse.name;

      let status = 'NOT_STARTED'; // NOT_STARTED, STUDYING, PASSED, FAILED
      let value = null;
      let isPredicted = false;
      let credits = scoreObj?.course?.credits || currCourse.credits;
      let semester = scoreObj?.semester || '';

      if (scoreObj) {
        value = scoreObj.value;
        status = scoreObj.status; // 'PASSED', 'FAILED', 'STUDYING'
      } else if (predObj) {
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
        courseId: displayCourseId,
        courseName: displayCourseName,
        value,
        status,
        credits,
        isPredicted,
        prediction: predObj,
        semester: semester || (predObj ? 'Kỳ hiện tại' : ''),
        courseData: scoreObj?.course || null
      };
    });
  };
  const allCourses = buildAllCourses();

  // ── Helper: look up course dependency data for risk warnings ──
  const findDependency = (courseId) => {
    if (!courseDependencies || Object.keys(courseDependencies).length === 0) return null;
    const clean = courseId.toLowerCase().replace(/\s+/g, '');
    const entry = Object.entries(courseDependencies).find(([key]) => {
      const k = key.toLowerCase().replace(/\s+/g, '');
      return k === clean || clean.includes(k) || k.includes(clean);
    });
    return entry ? entry[1] : null;
  };

  // ── Filter & GPA computations based on curriculum semester ──
  const detectedSemester = detectStudentSemester(allCourses);
  
  const semesters = [
    { value: '1', label: 'Học kỳ 1' },
    { value: '2', label: 'Học kỳ 2' },
    { value: '3', label: 'Học kỳ 3' },
    { value: '4', label: 'Học kỳ 4' },
    { value: '5', label: 'Học kỳ 5' },
    { value: '6', label: 'Học kỳ 6' }
  ];
  const filteredAllCourses = allCourses.filter(c => {
    if (semesterFilter !== 'all' && getCurriculumSemester(c.courseId, c.courseName) !== parseInt(semesterFilter)) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const AcademicDependencyGraph = ({ scores }) => {
    const chain = [
      { id: 'COM108', name: 'Nhập môn Lập trình' },
      { id: 'WEB1013', name: 'Thiết kế Web (HTML5/CSS3)' },
      { id: 'WEB1043', name: 'Lập trình cơ sở với JS' },
      { id: 'WEB2063', name: 'Lập trình JS nâng cao' },
      { id: 'WEB503', name: 'Lập trình Node.js & CSDL' }
    ];

    return (
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-700/30">
        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 font-mono">Academic Dependency Graph (Sơ đồ Tiến trình Học tập)</h5>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 overflow-x-auto py-2">
          {chain.map((c, idx) => {
            const scoreObj = scores?.find(s => s.courseId === c.id || s.courseId.includes(c.id));
            const val = scoreObj ? scoreObj.value : null;
            const status = scoreObj ? scoreObj.status : 'NOT_STARTED';

            let color = 'bg-slate-800 text-slate-500 border-slate-700'; // Gray (Not started)
            let statusLabel = 'Chưa học';
            
            if (status === 'PASSED' && val >= 7.0) {
              color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
              statusLabel = `Đạt mạnh (${val.toFixed(1)})`;
            } else if (status === 'PASSED' && val < 7.0) {
              color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
              statusLabel = `Đạt TB (${val.toFixed(1)})`;
            } else if (status === 'FAILED' || (val !== null && val < 5.0 && status !== 'PASSED')) {
              color = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
              statusLabel = `Trượt (${val ? val.toFixed(1) : 'Yếu'})`;
            } else if (status === 'STUDYING') {
              color = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
              statusLabel = 'Đang học';
            }

            return (
              <React.Fragment key={c.id}>
                <div className={`flex flex-col items-center p-3 rounded-xl border min-w-[140px] text-center transition-all hover:scale-105 duration-300 ${color}`}>
                  <span className="text-[10px] font-black font-mono tracking-wider">{c.id}</span>
                  <span className="text-[10px] font-medium truncate w-[120px] block mt-0.5" title={c.name}>{c.name}</span>
                  <span className="text-[9px] font-bold mt-1.5 uppercase tracking-wide opacity-80">{statusLabel}</span>
                </div>
                {idx < chain.length - 1 && (
                  <div className="hidden md:flex items-center text-slate-600 font-bold text-lg px-1 animate-pulse">&rarr;</div>
                )}
                {idx < chain.length - 1 && (
                  <div className="flex md:hidden items-center text-slate-600 font-bold text-lg py-1 animate-pulse">&darr;</div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDssReport = () => {
    if (loadingDss || !dssReport) {
      return (
        <div className="flex flex-col gap-4 h-[400px] items-center justify-center text-slate-600 dark:text-slate-400">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-bold animate-pulse">Đang sinh báo cáo DSS chi tiết...</p>
        </div>
      );
    }

    const {
      academicHealth,
      trendAnalysis,
      knowledgeDependency,
      rootCauseAnalysis,
      riskContributors,
      futureCourseImpact,
      futureRiskWarnings,
      graduationRisk,
      recoveryRoadmap,
      programLevelComparison,
      skillsGapAnalysis,
      careerImpactAnalysis,
      dependencyHeatmap
    } = dssReport;

    return (
      <div className="space-y-10">
        {/* DSS Verification Badges */}
        <div className="flex flex-wrap gap-2 pb-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
            ✓ Evidence-based
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1">
            ✓ Derived from Syllabus
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center gap-1">
            ✓ Dynamic Dependency Analysis
          </span>
        </div>

        {/* SECTION 1: Academic Health */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-6">
          <h3 className="text-lg font-black text-slate-905 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 font-black text-sm">S1</span>
            SECTION 1 — Sức khỏe học lực &amp; Tiến độ (Academic Health)
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Score circle */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <Activity className="text-emerald-400 animate-pulse" size={16} /> Chỉ số Sức khỏe Học tập
                </h4>
                <div className="flex items-center gap-6 my-4">
                  <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-4 border-slate-200 dark:border-white/15 bg-white/5 shadow-inner">
                    <span className={`text-2xl font-black ${
                      academicHealth.score === 'N/A' ? 'text-slate-400' :
                      academicHealth.score >= 75 ? 'text-emerald-400' : 
                      academicHealth.score >= 50 ? 'text-amber-400' : 
                      'text-rose-500'}`}>
                      {academicHealth.score}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold absolute bottom-3 uppercase font-mono">/ 100đ</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        academicHealth.score === 'N/A' ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' :
                        academicHealth.score >= 75 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        academicHealth.score >= 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      }`}>
                        {academicHealth.rating}
                      </span>
                      {academicHealth.score !== 'N/A' && academicHealth.cohortPercentile !== undefined && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400">
                          {academicHealth.cohortPercentile <= 50.0 
                            ? `Top ${academicHealth.cohortPercentile}%`
                            : `Thứ ${academicHealth.cohortRank}/${academicHealth.totalCohort} SV`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                      {academicHealth.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* GPA Trend BarChart */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <TrendingUp className="text-blue-400" size={16} /> Phân tích Xu hướng GPA (GPA Trend)
              </h4>
              <div className="h-40 w-full mb-3">
                {trendAnalysis.trendData && trendAnalysis.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendAnalysis.trendData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                      <XAxis dataKey="semester" tick={{fill: '#94a3b8', fontSize: 9}} stroke="#334155" />
                      <YAxis domain={[0, 10]} tick={{fill: '#94a3b8', fontSize: 9}} stroke="#334155" />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', color: '#fff', fontSize: '11px'}}
                      />
                      <Bar dataKey="gpa" name="GPA" radius={[3, 3, 0, 0]}>
                        {trendAnalysis.trendData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.gpa >= 8.0 ? '#10b981' : entry.gpa >= 5.0 ? '#3b82f6' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">Chưa có đủ dữ liệu học kỳ</div>
                )}
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed bg-white/5 p-2 rounded border border-white/5">
                <span className="font-bold text-slate-300">Xu hướng:</span> {trendAnalysis.status} — {trendAnalysis.explanation}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Root Cause Analysis */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 font-black text-sm">S2</span>
            SECTION 2 — Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis)
          </h3>
          
          {rootCauseAnalysis ? (
            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <AlertTriangle size={18} />
                </div>
                <div className="space-y-1">
                  <h5 className="font-black text-base text-amber-400 font-mono">
                    {rootCauseAnalysis.courseId} - {rootCauseAnalysis.name}
                  </h5>
                  <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase text-slate-400">
                    <span className="bg-rose-500/10 border border-rose-500/20 text-rose-450 px-2 py-0.5 rounded">Tác động: {rootCauseAnalysis.academicImportanceLevel}</span>
                    <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Độ nghẽn: {rootCauseAnalysis.bottleneckWeight}/5</span>
                    <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Impact: {rootCauseAnalysis.impactTrack}</span>
                  </div>
                </div>
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Định nghĩa & Lý do (Definition &amp; Reason):</span>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                  Môn học gốc {rootCauseAnalysis.courseId} chặn đứng tiến độ của {rootCauseAnalysis.directDownstreamCount} môn kế thừa tiếp theo.
                </p>
                <div className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap font-medium">
                  {rootCauseAnalysis.explanation}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={14} /> Chưa phát hiện điểm gãy học thuật nghiêm trọng.
            </div>
          )}
        </div>

        {/* SECTION 3: Future Risk Warnings & Dependency Graph */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-500/10 text-red-400 font-black text-sm">S3</span>
            SECTION 3 — Nguy cơ Tương lai &amp; Đồ thị Ràng buộc (Future Risk Warnings)
          </h3>

          {/* Flowchart Dependency Graph */}
          <AcademicDependencyGraph scores={scoreEntries} />

          <div className="space-y-4 mt-4">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <AlertTriangle className="text-rose-550" size={16} /> Cảnh báo Rủi ro Lan truyền
            </h4>
            
            {futureRiskWarnings && futureRiskWarnings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {futureRiskWarnings.map((warning, idx) => (
                  <div key={idx} className="bg-slate-950/20 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-red-400">🔴 {warning.targetCourseId} is at risk</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                        warning.severity === 'HIGH' ? 'bg-red-500/20 text-red-350' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {warning.severity}
                      </span>
                    </div>
                    
                    <div className="text-xs space-y-1 text-slate-700 dark:text-slate-305 font-medium">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">Reason:</span> Weak foundation from {warning.sourceCourseId}
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">Impact:</span> {warning.impactTrack}
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">Confidence:</span> {warning.confidence}%
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">Priority:</span> {warning.priority}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={14} /> Chưa ghi nhận rủi ro đối với các môn học tương lai.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: Career Impact */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 font-black text-sm">S4</span>
            SECTION 4 — Ảnh hưởng Định hướng Nghề nghiệp (Career Impact)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {careerImpactAnalysis && careerImpactAnalysis.length > 0 ? (
              careerImpactAnalysis.map((c, idx) => (
                <div key={idx} className="p-4 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.careerName}</h4>
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${
                      c.color === 'rose' ? 'bg-rose-500/20 border-rose-500/20 text-rose-500' :
                      c.color === 'orange' ? 'bg-orange-500/20 border-orange-500/20 text-orange-400' :
                      c.color === 'amber' ? 'bg-amber-500/20 border-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {c.riskLabel.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Kỹ năng cốt lõi bắt buộc:</span>
                    <div className="flex flex-wrap gap-1">
                      {c.requiredSkills.map((skObj, skIdx) => (
                        <span 
                          key={skIdx} 
                          className={`text-[9px] px-2 py-0.5 rounded border ${
                            skObj.possessionState === 'POSSESSED' 
                              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-bold' 
                              : skObj.possessionState === 'UNKNOWN'
                                ? 'bg-slate-500/10 border-slate-500/25 text-slate-400 font-medium'
                                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium'
                          }`}
                        >
                          {skObj.possessionState === 'POSSESSED' ? '✓' : skObj.possessionState === 'UNKNOWN' ? '?' : '✗'} {skObj.skillName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-4 bg-slate-900/50 border border-white/5 text-slate-500 rounded-xl text-center text-xs font-bold">
                Chưa có đánh giá định hướng nghề nghiệp.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: Recovery Roadmap */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 font-black text-sm">S5</span>
            SECTION 5 — Lộ trình Phục hồi 12 Tuần (Recovery Roadmap)
          </h3>
          
          <div className="space-y-4">
            {recoveryRoadmap && recoveryRoadmap.length > 0 ? (
              recoveryRoadmap.map((step, idx) => (
                <div key={idx} className="flex gap-4 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                      {idx + 1}
                    </div>
                    {idx < recoveryRoadmap.length - 1 && <div className="w-0.5 bg-blue-500/20 flex-1 my-1"></div>}
                  </div>
                  <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] font-black text-blue-400 font-mono block uppercase">{step.phase}</span>
                    <h5 className="font-bold text-slate-200 text-sm">{step.title}</h5>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium mt-1">{step.focus}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-slate-900/50 border border-white/5 text-slate-500 rounded-xl text-center text-xs font-bold">
                Chưa có đề xuất lộ trình khôi phục chi tiết.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/search')} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-white rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/5 transition-all">
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
                {dssReport?.academicHealth?.score !== 'N/A' && dssReport?.academicHealth?.cohortPercentile !== undefined && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hidden sm:inline-block"></span>
                    <span>Xếp hạng khóa: <strong className="text-emerald-400">
                      {dssReport.academicHealth.cohortPercentile <= 50.0 
                        ? `Top ${dssReport.academicHealth.cohortPercentile}% (${dssReport.academicHealth.cohortRank}/${dssReport.academicHealth.totalCohort} SV)`
                        : `Thứ ${dssReport.academicHealth.cohortRank}/${dssReport.academicHealth.totalCohort} SV`
                      }
                    </strong></span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center min-w-[100px]">
              <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 font-mono">Học Kỳ Khung</span>
              <span className="text-2xl font-black text-amber-400">Kỳ {detectedSemester}</span>
            </div>
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
          
          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 dark:border-white/10 gap-6">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'transcript'
                  ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Bảng Điểm & Biểu Đồ
            </button>
            <button
              onClick={() => setActiveTab('dss')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'dss'
                  ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Báo Cáo AI DSS Chi Tiết
            </button>
          </div>

          {activeTab === 'transcript' ? (
            <>
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
                            <Cell key={`cell-${index}`} fill={entry.status === 'FAILED' ? '#ef4444' : entry.score >= 8 ? '#10b981' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Academic Transcripts - BẢNG ĐIỂM & CẢNH BÁO NGUY CƠ */}
              <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-purple-400"/> BẢNG ĐIỂM & CẢNH BÁO NGUY CƠ
                  </h3>
                  <div className="flex items-center gap-3">
                    <select value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none">
                      <option value="all">Tất cả các học kỳ</option>
                      {semesters.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none">
                      <option value="all">Tất cả trạng thái</option>
                      <option value="PASSED">Đạt</option>
                      <option value="FAILED">Không đạt</option>
                      <option value="STUDYING">Đang học</option>
                      <option value="NOT_STARTED">Chưa học</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                        <th className="p-3 font-semibold">Mã môn</th>
                        <th className="p-3 font-semibold">Tên Môn học</th>
                        <th className="p-3 font-semibold text-center">Số tín chỉ</th>
                        <th className="p-3 font-semibold text-center">Điểm quá trình</th>
                        <th className="p-3 font-semibold text-center">Điểm thi</th>
                        <th className="p-3 font-semibold text-center">Tổng kết</th>
                        <th className="p-3 font-semibold text-center">Hệ chữ (4)</th>
                        <th className="p-3 font-semibold text-center">Trạng thái</th>
                        <th className="p-3 font-semibold">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {(() => {
                        const semestersToRender = semesterFilter === 'all' ? [1, 2, 3, 4, 5, 6] : [parseInt(semesterFilter)];
                        
                        return semestersToRender.map(semNum => {
                          const coursesInSem = filteredAllCourses.filter(c => getCurriculumSemester(c.courseId, c.courseName) === semNum);
                          if (coursesInSem.length === 0) return null;
                          
                          return (
                            <>
                              {/* Subheading row representing the semester */}
                              <tr key={`sem-header-${semNum}`} className="bg-slate-100/50 dark:bg-white/5 text-slate-800 dark:text-slate-200 font-bold border-y border-slate-200 dark:border-white/10">
                                <td colSpan="9" className="p-3 text-xs tracking-wider uppercase">
                                  Học kỳ {semNum} ({coursesInSem.length} môn)
                                </td>
                              </tr>
                              {coursesInSem.map((c, idx) => {
                                const dep = findDependency(c.courseId);
                                const affects = dep?.affects || [];
                                const hasLowScore = c.value !== null && c.value < 7.0 && c.status !== 'NOT_STARTED';
                                const isFailed = c.status === 'FAILED';
                                const isNotStarted = c.status === 'NOT_STARTED';
                                
                                // Find corresponding score entry for quiz/assignment/final breakdown
                                const scoreObj = scoreEntries.find(s => {
                                  const cleanC = c.courseId.toLowerCase().replace(/\s+/g, '');
                                  const cleanS = s.courseId.toLowerCase().replace(/\s+/g, '');
                                  const cleanN = (s.course?.name || '').toLowerCase().replace(/\s+/g, '');
                                  return cleanS === cleanC || cleanS.includes(cleanC) || cleanC.includes(cleanS) || cleanN === cleanC;
                                });
                                const processScore = scoreObj ? (
                                  scoreObj.quiz != null ? scoreObj.quiz :
                                  scoreObj.assignment != null ? scoreObj.assignment :
                                  scoreObj.asm1 != null ? scoreObj.asm1 : null
                                ) : null;
                                const examScore = scoreObj?.final ?? null;
                                
                                return (
                                  <tr id={`course-row-${c.courseId}`} key={`${semNum}-${idx}`} className={`border-b border-slate-200 dark:border-white/5 hover:bg-white/5 transition-colors ${isNotStarted ? 'opacity-50' : ''}`}>
                                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300 text-xs">{c.courseId}</td>
                                    <td className="p-3 text-slate-900 dark:text-white font-medium text-xs max-w-[160px] truncate" title={c.courseName}>{c.courseName}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400 text-center text-xs">{c.credits}</td>
                                    <td className="p-3 text-center">
                                      {processScore !== null ? (
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{processScore.toFixed(1)}</span>
                                      ) : <span className="text-xs text-slate-400 dark:text-slate-600 font-bold">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                      {examScore !== null ? (
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{examScore.toFixed(1)}</span>
                                      ) : <span className="text-xs text-slate-400 dark:text-slate-600 font-bold">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                      {c.value !== null ? (
                                        c.value === 1.0 && c.status === 'PASSED' ? (
                                          <span className="text-xs font-semibold text-emerald-400">Đạt</span>
                                        ) : (
                                          <span className={`text-sm font-black ${c.value >= 8 ? 'text-emerald-400' : c.value >= 5 ? 'text-blue-400' : 'text-rose-500'}`}>
                                            {c.value.toFixed(1)}
                                          </span>
                                        )
                                      ) : <span className="text-xs text-slate-400 dark:text-slate-600 font-bold">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                      {c.value !== null ? (
                                        c.value === 1.0 && c.status === 'PASSED' ? (
                                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-600">—</span>
                                        ) : (
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{getLetterGrade(c.value)}</span>
                                        )
                                      ) : <span className="text-xs text-slate-400 dark:text-slate-600">—</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                      {c.status === 'PASSED' ? (
                                        <span className="bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle2 size={10}/> Đạt</span>
                                      ) : c.status === 'FAILED' ? (
                                        <span className="bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><XCircle size={10}/> Trượt</span>
                                      ) : c.status === 'NOT_STARTED' ? (
                                        <span className="bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">Chưa học</span>
                                      ) : (
                                        <span className="bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><Clock size={10}/> Đang học</span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {(() => {
                                        if (isNotStarted) {
                                          return affects.length > 0 ? (
                                            <span className="text-[9px] text-slate-500 italic">Tiên quyết cho: {affects.slice(0, 2).join(', ')}</span>
                                          ) : null;
                                        }
                                        if (isFailed && affects.length > 0) {
                                          return (
                                            <div className="space-y-1">
                                              <span className="text-[10px] font-black text-rose-400 flex items-center gap-1">
                                                <AlertTriangle size={11} /> Chặn tiến độ
                                              </span>
                                              <div className="flex flex-wrap gap-1">
                                                {affects.map((aff, j) => (
                                                  <button
                                                    key={j}
                                                    onClick={() => scrollToCourse(aff)}
                                                    className="text-[9px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded hover:bg-rose-500/20 transition-all cursor-pointer"
                                                    title={`Nhấp để di chuyển đến môn ${aff}`}
                                                  >
                                                    {aff}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        }
                                        if (hasLowScore && affects.length > 0) {
                                          return (
                                            <div className="space-y-1">
                                              <span className="text-[10px] font-black text-amber-400 flex items-center gap-1">
                                                <AlertTriangle size={11} /> Ảnh hưởng
                                              </span>
                                              <div className="flex flex-wrap gap-1">
                                                {affects.map((aff, j) => (
                                                  <button
                                                    key={j}
                                                    onClick={() => scrollToCourse(aff)}
                                                    className="text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded hover:bg-amber-500/20 transition-all cursor-pointer"
                                                    title={`Nhấp để di chuyển đến môn ${aff}`}
                                                  >
                                                    {aff}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        }
                                        if (c.value !== null && c.value >= 7.0) {
                                          return <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 size={11}/> An toàn</span>;
                                        }
                                        return null;
                                      })()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-[10px] text-slate-500 italic space-y-1">
                  <div className="flex items-center gap-2">
                    <span>Hiển thị {filteredAllCourses.length}/{allCourses.length} môn học</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                    <span>Chưa có điểm: không tính vào GPA trung bình</span>
                  </div>
                  <p>
                    * Ghi chú: Giáo dục thể chất, Giáo dục quốc phòng, Thực tập tốt nghiệp là các môn điều kiện, không tính vào điểm trung bình toàn khóa.
                  </p>
                </div>
              </div>
            </>
          ) : (
            renderDssReport()
          )}
        </div>

        {/* Right column: Action panel & History & AI Forecast */}
        <div className="space-y-8">
          
          {/* AI Decision Support - Prescription Intervention Recommendation Card */}
          {dssReport && dssReport.interventionRecommendation && (
            <div className={`glass-card p-6 rounded-3xl border ${
              dssReport.interventionRecommendation.colorClass === 'rose' ? 'border-rose-500/20 bg-rose-500/5' :
              dssReport.interventionRecommendation.colorClass === 'amber' ? 'border-amber-500/20 bg-amber-500/5' :
              dssReport.interventionRecommendation.colorClass === 'blue' ? 'border-blue-500/20 bg-blue-500/5' :
              'border-emerald-500/20 bg-emerald-500/5'
            } relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <HeartHandshake className={
                  dssReport.interventionRecommendation.colorClass === 'rose' ? 'text-rose-400' :
                  dssReport.interventionRecommendation.colorClass === 'amber' ? 'text-amber-400' :
                  dssReport.interventionRecommendation.colorClass === 'blue' ? 'text-blue-400' :
                  'text-emerald-400'
                } size={20} /> Đề Xuất Can Thiệp Học Vụ (Prescriptive Advisory)
              </h3>
              <p className="text-[10px] text-slate-500 mb-6 font-semibold">Khuyến nghị hành động tự động từ Động cơ DSS của EduGuard</p>
              
              <div className="space-y-4">
                {dssReport.interventionRecommendation.rootCauseCourseId ? (
                  <div className="space-y-4 text-slate-900 dark:text-white">
                    {/* 1. Root Cause */}
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">1. Nguyên nhân gốc rễ (Root Cause)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-rose-500 dark:text-rose-455">{dssReport.interventionRecommendation.rootCauseCourseId}</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">({dssReport.interventionRecommendation.rootCauseCourseName})</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-white/5">
                          Điểm: {dssReport.interventionRecommendation.currentScore?.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* 2. Why it matters */}
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">2. Tầm ảnh hưởng (Why it matters)</span>
                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        {dssReport.interventionRecommendation.whyItMatters}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {dssReport.interventionRecommendation.affectedCourses?.map(c => (
                          <span key={c.id} className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-355 border border-rose-500/20">
                            {c.id}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 3. Recommended Actions */}
                    <div className="bg-slate-100 dark:bg-slate-950/30 p-3.5 rounded-xl border border-slate-200 dark:border-white/5 space-y-2">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">3. Hành động khuyến nghị (Recommended Actions)</span>
                      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-bold">Review:</span> {dssReport.interventionRecommendation.recommendedActions?.review?.join(', ')}
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-bold">Practice:</span> {dssReport.interventionRecommendation.recommendedActions?.practice}
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 font-bold">Target:</span> {dssReport.interventionRecommendation.recommendedActions?.target}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl border ${
                    dssReport.interventionRecommendation.colorClass === 'rose' ? 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-300' :
                    dssReport.interventionRecommendation.colorClass === 'amber' ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-300' :
                    dssReport.interventionRecommendation.colorClass === 'blue' ? 'bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-300' :
                    'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-300'
                  }`}>
                    <span className="block text-[9px] font-bold uppercase tracking-wider font-mono opacity-80">Mức Can Thiệp:</span>
                    <span className="text-base font-black block mt-1">{dssReport.interventionRecommendation.actionTitle}</span>
                    <p className="text-xs mt-2 leading-relaxed opacity-95 text-slate-700 dark:text-slate-200">
                      {dssReport.interventionRecommendation.description}
                    </p>
                  </div>
                )}
                
                {/* Quick Action Button mapping to workflow */}
                {dssReport.interventionRecommendation.actionCode === 'EMAIL_ADVISOR' && (
                  <button 
                    onClick={() => handleOpenWorkflow('email', { courseId: dssReport.rootCauseAnalysis?.courseId || 'N/A', risk: 'CRITICAL', explanation: dssReport.rootCauseAnalysis?.explanation })}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={14} /> Gửi Email Cảnh báo Học vụ
                  </button>
                )}
                {dssReport.interventionRecommendation.actionCode === 'INVITE_TUTOR' && (
                  <button 
                    onClick={() => handleOpenWorkflow('tutor', { courseId: dssReport.rootCauseAnalysis?.courseId || 'N/A', risk: 'HIGH', explanation: dssReport.rootCauseAnalysis?.explanation })}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen size={14} /> Đăng ký Lớp Tutor phụ đạo 1 kèm 1
                  </button>
                )}
                {dssReport.interventionRecommendation.actionCode === 'SELF_STUDY_ROADMAP' && (
                  <button 
                    onClick={() => setActiveTab('dss')}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} /> Xem chi tiết lộ trình tự học 12 tuần
                  </button>
                )}
                {dssReport.interventionRecommendation.actionCode === 'WEAK_FOUNDATION_WARNING' && (
                  <button 
                    disabled={updating}
                    onClick={async () => {
                      if (!window.confirm('Hệ thống sẽ tự động tạo Lộ trình 30 ngày và gửi hộp thư cho SV. Bạn có chắc không?')) return;
                      setUpdating(true);
                      try {
                        await api.post('/intervention/send-roadmap', {
                          mssv: student.mssv,
                          targetCourseId: dssReport.interventionRecommendation.targetCourses?.[0],
                          riskLevel: 'HIGH',
                          missingSkills: dssReport.interventionRecommendation.missingSkills,
                          affectedCLOs: dssReport.interventionRecommendation.affectedCLOs
                        });
                        alert('✅ Đã tạo lộ trình và thông báo cho sinh viên thành công!');
                        fetchStudentProfile();
                      } catch (err) {
                        alert('Lỗi: ' + err.message);
                      } finally {
                        setUpdating(false);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Mail size={14} /> Gửi thư & Lộ trình chuẩn bị môn tiếp theo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Risk Contributors Card */}
          {dssReport && dssReport.riskContributors && dssReport.riskContributors.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-rose-200 dark:border-rose-500/20 bg-white dark:bg-gradient-to-b dark:from-rose-950/20 dark:to-slate-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="text-rose-550 animate-pulse" size={20} /> Tác nhân Đóng góp Rủi ro (Risk Contributors)
              </h3>
              <p className="text-[10px] text-slate-500 mb-6 font-semibold">Tỷ lệ tác động của các nhân tố đến rủi ro học tập của SV</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Điểm Rủi ro Tổng thể</span>
                  <span className="text-sm font-black text-rose-500">{dssReport.academicHealth && dssReport.academicHealth.score !== 'N/A' ? `${100 - dssReport.academicHealth.score}/100` : 'N/A'}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden mb-6">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full" 
                    style={{ width: `${dssReport.academicHealth && dssReport.academicHealth.score !== 'N/A' ? 100 - dssReport.academicHealth.score : 0}%` }}
                  ></div>
                </div>

                <div className="space-y-3.5 pt-2 border-t border-slate-200 dark:border-white/5">
                  {dssReport.riskContributors.map((c, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-700 dark:text-slate-300">{c.label}</span>
                        <span className="font-mono text-rose-400">{c.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500/80 rounded-full" 
                          style={{ width: `${c.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Forecast / XAI Panel */}
          {student.predictions && student.predictions.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-gradient-to-b dark:from-blue-950/20 dark:to-slate-900/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Brain className="text-blue-400" size={20} /> SECTION 3 — Nguy cơ Tương Lai (Top 5 Future Risk)
              </h3>
              <div className="space-y-4">
                {student.predictions
                  .sort((a,b) => b.predictedScore - a.predictedScore)
                  .slice(0, 5)
                  .map((p, i) => {
                  const isHigh = p.risk === 'CRITICAL' || p.risk === 'HIGH';
                  return (
                    <div key={i} className={`p-4 rounded-xl border bg-slate-200 dark:bg-black/40 ${isHigh ? 'border-rose-200 dark:border-rose-500/30' : 'border-slate-200 dark:border-white/10'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.courseId}</span>
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                            p.risk === 'CRITICAL' ? 'bg-rose-500/20 border-rose-200 dark:border-rose-500/30 text-rose-400' :
                            p.risk === 'HIGH' ? 'bg-orange-500/20 border-orange-200 dark:border-orange-500/30 text-orange-400' :
                            p.risk === 'MEDIUM' ? 'bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-400' :
                            'bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-400'
                          }`}>
                            {p.risk}
                          </span>
                        </div>
                      </div>
                      
                      {/* Risk Impact Indicators */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-slate-200 dark:border-white/5">
                          <span className="block text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Risk Impact</span>
                          <span className={`font-black text-xs ${isHigh ? 'text-rose-500' : 'text-blue-500'}`}>{p.predictedScore.toFixed(1)}%</span>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-slate-200 dark:border-white/5">
                          <span className="block text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Blocked Courses</span>
                          <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{(p.predictedScore > 70 ? Math.floor(p.predictedScore / 10) : 0)} môn</span>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-slate-200 dark:border-white/5">
                          <span className="block text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Career Impact</span>
                          <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 leading-tight block truncate" title="Lập trình viên">Lập trình viên</span>
                        </div>
                      </div>

                      {p.explanation && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Giải thích XAI:</span>
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
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href = '/retake-management';
                          }}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Repeat size={18} />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Đăng ký học lại</span>
                          <span className="text-[10px] text-slate-500 text-center mt-1">Đăng ký lớp rớt nhanh chóng</span>
                        </button>
                        
                        <button 
                          onClick={() => handleOpenWorkflow('call', p)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-slate-200 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-500/30 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Calendar size={18} />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Đặt lịch gặp cố vấn</span>
                          <span className="text-[10px] text-slate-500 text-center mt-1">Hẹn lịch tư vấn 1-1 với SV</span>
                        </button>

                        <button 
                          onClick={() => handleOpenWorkflow('email', p)}
                          className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Send size={18} />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Gửi KH học tập</span>
                          <span className="text-[10px] text-slate-500 text-center mt-1">Tạo và gửi lộ trình 12 tuần</span>
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
              Phát hiện môn học rủi ro? Nhấn “Đưa vào diện Chú ý” để <strong className="text-rose-400">đồng thời cắm cờ can thiệp</strong> và <strong className="text-blue-400">gửi tin nhắn phân tích + đề xuất cải thiện vào Hộp thư sinh viên</strong> ngay lập tức.
            </p>
            
            <form onSubmit={handleFlagIntervention} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Chọn môn học cần can thiệp</label>
                <select 
                  value={selectedCourse || ''}
                  onChange={e => { setSelectedCourse(e.target.value); setInterventionNote(''); }}
                  className="w-full p-3.5 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 focus:border-rose-500/50 outline-none rounded-xl text-slate-900 dark:text-white text-sm transition-colors"
                >
                  {riskyCourses.length === 0 ? (
                    <option value="" disabled>Không có môn nào có dự đoán rủi ro (HIGH/MEDIUM/CRITICAL)</option>
                  ) : (
                    riskyCourses.map(s => {
                      const pred = student.predictions?.find(p => p.courseId === s.courseId);
                      const dssWarn = dssReport?.futureRiskWarnings?.find(w => w.targetCourseId === s.courseId);
                      const risk = pred?.risk || dssWarn?.severity;
                      // Vì tất cả môn trong list đều có dự đoán, label phản ánh đúng mức rủi ro AI
                      const label = risk === 'CRITICAL' ? ' 🔴 Nguy cấp' : risk === 'HIGH' ? ' 🔴 Cao' : risk === 'MEDIUM' ? ' 🟡 Trung bình' : ' 🟠 Rủi ro thấp';
                      return (
                        <option key={s.courseId} value={s.courseId} className="bg-white dark:bg-slate-900">
                          {s.courseId} — {s.course?.name || s.courseId}{label}
                        </option>
                      );
                    })
                  )}
                </select>
                {riskyCourses.length > 0 && (
                  <p className="text-[10px] text-slate-500">{riskyCourses.length} môn có dự đoán rủi ro — Chỉ hiện môn được AI xác định cần can thiệp (dựa trên quan hệ tiên quyết).</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Ghi chú hành động sư phạm</label>
                  <button
                    type="button"
                    onClick={handleGenerateNote}
                    disabled={generatingNote || !selectedCourse}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="AI tự động soạn ghi chú can thiệp cho môn đã chọn"
                  >
                    {generatingNote
                      ? <><Loader2 size={11} className="animate-spin" /> Đang soạn...</>
                      : <><Wand2 size={11} /> AI Soạn nhanh</>}
                  </button>
                </div>
                <textarea 
                  value={interventionNote}
                  onChange={e => setInterventionNote(e.target.value)}
                  placeholder={`Nhấn "AI Soạn nhanh" để tự động tạo ghi chú theo môn ${selectedCourse || 'đã chọn'}, hoặc nhập tay...`}
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
