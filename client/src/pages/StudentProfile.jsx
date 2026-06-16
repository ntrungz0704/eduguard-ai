import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../lib/api';
import { 
  ArrowLeft, GraduationCap, Mail, Brain, CheckCircle2,
  AlertTriangle, Phone, Calendar, Send, HeartHandshake, Loader2, Sparkles, BookOpen, UserPlus, X, Copy,
  TrendingUp, XCircle, Clock, ShieldAlert, Wand2, Activity, Layers, AlertCircle, Flame
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DEFAULT_CURRICULUM = [
  { id: 'COM107', name: 'Tin học', credits: 3 },
  { id: 'VIE103', name: 'Giáo dục thể chất', credits: 3 },
  { id: 'PDP102', name: 'Kỹ năng học tập', credits: 2 },
  { id: 'COM108', name: 'Nhập môn lập trình', credits: 3 },
  { id: 'ITI101', name: 'Nhập môn Công nghệ thông tin', credits: 3 },
  { id: 'VIE104', name: 'Giáo dục quốc phòng', credits: 4 },
  { id: 'ENT112', name: 'Tiếng Anh 1.1', credits: 3 },
  { id: 'COM201', name: 'Cơ sở dữ liệu', credits: 3 },
  { id: 'WEB101', name: 'Xây dựng trang Web', credits: 3 },
  { id: 'ENT12', name: 'Tiếng Anh 1.2', credits: 3 },
  { id: 'WEB104', name: 'Lập trình cơ sở với JavaScript', credits: 3 },
  { id: 'WEB108', name: 'Lập trình PHP cơ bản', credits: 3 },
  { id: 'ENT21', name: 'Tiếng Anh 2.1', credits: 3 },
  { id: 'VIE108', name: 'Chính trị', credits: 5 },
  { id: 'WEB302', name: 'Thiết kế Web với HTML5 & CSS3', credits: 3 },
  { id: 'WEB201', name: 'Lập trình PHP 1', credits: 3 },
  { id: 'VIE102', name: 'Pháp luật', credits: 2 },
  { id: 'PDP103', name: 'Kỹ năng phát triển bản thân', credits: 2 },
  { id: 'WEB105', name: 'Thiết kế UI/UX', credits: 3 },
  { id: 'WEB204', name: 'Dự án mẫu', credits: 3 },
  { id: 'ENT22', name: 'Tiếng Anh 2.2', credits: 3 },
  { id: 'WEB102', name: 'Quản trị website', credits: 3 },
  { id: 'WEB205', name: 'Marketing trên Internet', credits: 3 },
  { id: 'WEB501', name: 'Lập trình ECMAScript', credits: 3 },
  { id: 'WEB206', name: 'Lập trình Javascript nâng cao', credits: 3 },
  { id: 'PRO101', name: 'Dự án 1', credits: 3 },
  { id: 'WEB503', name: 'NodeJS & Restful Web Service', credits: 3 },
  { id: 'WEB502', name: 'Lập trình TypeScript', credits: 3 },
  { id: 'PDP104', name: 'Kỹ năng làm việc', credits: 2 },
  { id: 'SYB301', name: 'Khởi sự doanh nghiệp', credits: 3 },
  { id: 'WEB208', name: 'Lập trình Front-End Framework 1', credits: 3 },
  { id: 'WEB209', name: 'Lập trình Front-End Framework 2', credits: 3 },
  { id: 'PRO11', name: 'Thực tập tốt nghiệp', credits: 5 },
  { id: 'PRO22', name: 'Dự án tốt nghiệp', credits: 5 }
];

const getCourseCredits = (courseNameOrId) => {
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

  // Tự động chọn môn rủi ro cao nhất làm mặc định sau khi load xong
  useEffect(() => {
    if (!student?.scores || student.scores.length === 0) return;
    const entries = Array.isArray(student.scores) ? student.scores : Object.values(student.scores || {});
    const predictions = student.predictions || [];
    const highRisk = entries.find(s => {
      if (isConditionalCourse(s.course?.name || s.courseId, s.courseId)) return false;
      const pred = predictions.find(p => p.courseId === s.courseId);
      return pred && (pred.risk === 'HIGH' || pred.risk === 'CRITICAL');
    });
    const failed = entries.find(s => s.status === 'FAILED' && !isConditionalCourse(s.course?.name || s.courseId, s.courseId));
    const lowScore = entries.find(s => s.value !== null && s.value < 6 && !isConditionalCourse(s.course?.name || s.courseId, s.courseId));
    const inProgressRisk = entries.find(s => {
      if (isConditionalCourse(s.course?.name || s.courseId, s.courseId)) return false;
      const pred = predictions.find(p => p.courseId === s.courseId);
      return s.status !== 'PASSED' && s.status !== 'FAILED' && pred;
    });
    const picked = highRisk || failed || lowScore || inProgressRisk;
    if (picked) setSelectedCourse(picked.courseId);
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
  
  // Chỉ hiện môn có rủi ro trong dropdown can thiệp (chỉ cho môn đang học, sắp học, dự đoán rủi ro):
  // Quyết định: Bỏ qua các môn đã có điểm cuối cùng (PASSED hoặc FAILED) để tuân thủ luật SSOT & DSS.


  const riskyCourses = [];
  scoreEntries.forEach(s => {
    if (isConditionalCourse(s.course?.name || s.courseId, s.courseId)) return;
    if (s.status === 'PASSED') return;
    if (s.status === 'FAILED') {
      const isRecovered = scoreEntries.some(other => other.courseId === s.courseId && other.status === 'PASSED');
      const isRetaking = scoreEntries.some(other => other.courseId === s.courseId && (other.status === 'STUDYING' || other.status === 'NOT_STARTED'));
      if (isRecovered || isRetaking) return;
      
      riskyCourses.push({
        courseId: s.courseId,
        status: 'FAILED',
        course: { name: s.course?.name || s.courseId }
      });
      return;
    }
    
    const pred = student.predictions?.find(p => p.courseId === s.courseId);
    const isHighRisk = pred && (pred.risk === 'HIGH' || pred.risk === 'CRITICAL');
    const isMediumRisk = pred && pred.risk === 'MEDIUM';
    const isInProgress = s.status === 'STUDYING' || s.status === 'NOT_STARTED';
    
    if (isHighRisk || isMediumRisk || isInProgress) {
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
    .filter(s => s.value !== null)
    .map(s => ({
      name: s.courseId,
      score: s.value
    }));

  // ── Build allCourses: merge curriculum (34 courses) + student scores ──
  const buildAllCourses = () => {
    return DEFAULT_CURRICULUM.map(currCourse => {
      // Find matching score entry from database
      const scoreObj = scoreEntries.find(s => {
        const cleanCurrId = String(currCourse.id || '').toUpperCase().trim();
        const cleanDbId = String(s.courseId || '').toUpperCase().trim();
        
        if (cleanDbId.startsWith(cleanCurrId)) {
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
        
        if (cleanDbId.startsWith(cleanCurrId)) {
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
      graduationRisk,
      recoveryRoadmap,
      programLevelComparison,
      skillsGapAnalysis,
      careerImpactAnalysis,
      dependencyHeatmap
    } = dssReport;

    const weakPassedCourses = scoreEntries.filter(s => s.status === 'PASSED' && s.value !== null && s.value < 7.0);

    const unrecoveredFailedCourses = scoreEntries.filter(s => {
      if (s.status !== 'FAILED') return false;
      const isRecovered = scoreEntries.some(other => other.courseId === s.courseId && other.status === 'PASSED');
      const isRetaking = scoreEntries.some(other => other.courseId === s.courseId && (other.status === 'STUDYING' || other.status === 'NOT_STARTED'));
      return !isRecovered && !isRetaking;
    });

    const currentStudyingCourses = scoreEntries.filter(s => s.status === 'STUDYING');

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
            ✓ Three-Layer Architecture v2
          </span>
        </div>

        {/* ============================================================ */}
        {/* LAYER 1: HISTORICAL EVIDENCE (BẰNG CHỨNG HỌC TẬP - QUÁ KHỨ) */}
        {/* ============================================================ */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/5 pb-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-black text-sm">L1</span>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                LAYER 1 — HISTORICAL EVIDENCE (Quá khứ &amp; Bằng chứng)
              </h3>
              <p className="text-xs text-slate-500 font-semibold">Kết quả học tập đã hoàn thành, chỉ số sức khỏe và cảnh báo hổng kiến thức nền tảng</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic Health Score */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <Activity className="text-emerald-400 animate-pulse" size={16} /> Chỉ số Sức khỏe Học tập (Academic Health Score)
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
                          Top {academicHealth.cohortPercentile}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                      {academicHealth.description}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-blue-300 text-[10px] leading-relaxed font-medium mt-3">
                <strong>Tuyên bố hệ thống:</strong> Dự đoán dựa trên cấu trúc chương trình đào tạo &amp; điểm quá khứ, không cam kết điểm số tuyệt đối.
              </div>
            </div>

            {/* Trend Analysis Chart */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <TrendingUp className="text-blue-400" size={16} /> Phân tích Xu hướng Học thuật (GPA Trend)
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

          {/* Weak Passed Courses with Foundation Warnings */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
              <AlertCircle className="text-amber-400" size={16} /> Cảnh báo nền tảng yếu từ môn học đã đạt (Weak Foundation Warnings)
            </h4>
            <p className="text-xs text-slate-550">Các học phần đã hoàn thành (GPA &ge; 5.0) nhưng đạt điểm thấp (&lt; 7.0), tạo nguy cơ cho môn học kế thừa.</p>
            
            {weakPassedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weakPassedCourses.map((wc, wIdx) => {
                  const dep = findDependency(wc.courseId);
                  const affects = dep?.affects || [];
                  return (
                    <div key={wIdx} className="p-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-xl transition-all space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-amber-400 font-mono">{wc.courseId} — {wc.courseName || wc.courseId}</span>
                        <span className="text-[10px] font-black bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 text-amber-400">
                          ĐẠT YẾU: {wc.value?.toFixed(1)}/10
                        </span>
                      </div>
                      {affects.length > 0 ? (
                        <div className="text-[11px] text-slate-300 space-y-1">
                          <span className="text-slate-500 font-semibold block">⚠️ Nguy cơ khi học các môn kế thừa phụ thuộc:</span>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {affects.map((aff, aIdx) => (
                              <span key={aIdx} className="text-[9px] font-bold bg-slate-800/80 px-1.5 py-0.5 rounded border border-white/5 text-slate-300">{aff}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Không có môn chuyên ngành tiếp theo phụ thuộc trực tiếp trong syllabus.</p>
                      )}
                      <div className="text-[9px] text-slate-500 border-t border-white/5 pt-1.5 flex justify-between items-center">
                        <span>Trạng thái: <b>Đã kết thúc &amp; Khóa điểm</b></span>
                        <span className="text-slate-400 italic">Không can thiệp học vụ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={14} /> Không ghi nhận học phần nào có nền tảng yếu (Tất cả môn đã đạt đều &ge; 7.0).
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">So sánh đối sánh học thuật toàn khóa:</h5>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-white/5 rounded-2xl bg-white/5 p-4 custom-scrollbar">
                {programLevelComparison && programLevelComparison.length > 0 ? (
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase font-mono">
                        <th className="pb-2">Mã môn</th>
                        <th className="pb-2 text-center">SV</th>
                        <th className="pb-2 text-center">Lớp</th>
                        <th className="pb-2 text-right">Chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programLevelComparison.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-white/5 transition-colors font-medium">
                          <td className="py-2 font-bold text-slate-700 dark:text-slate-300 font-mono">{item.courseId}</td>
                          <td className="py-2 text-center font-bold text-slate-800 dark:text-white">{item.studentGrade.toFixed(1)}</td>
                          <td className="py-2 text-center text-slate-500">{item.classAverage.toFixed(1)}</td>
                          <td className="py-2 text-right">
                            <span className={`font-mono font-bold ${item.difference >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {item.difference >= 0 ? `+${item.difference.toFixed(1)}` : `${item.difference.toFixed(1)}`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Chưa có dữ liệu đối sánh.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">Định hướng nghề nghiệp &amp; Minh chứng:</h5>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-white/5 rounded-2xl bg-white/5 p-4 custom-scrollbar space-y-3">
                {careerImpactAnalysis && careerImpactAnalysis.length > 0 ? (
                  careerImpactAnalysis.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-900/40 rounded-lg border border-white/5">
                      <span className="font-bold text-slate-300">{c.careerName}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                        c.color === 'rose' ? 'bg-rose-500/20 border-rose-500/20 text-rose-500' :
                        c.color === 'orange' ? 'bg-orange-500/20 border-orange-500/20 text-orange-400' :
                        c.color === 'amber' ? 'bg-amber-500/20 border-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                      }`}>
                        {c.riskLabel.toUpperCase()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Chưa có đánh giá định hướng nghề nghiệp.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LAYER 2: CURRENT RISK (CAN THIỆP RỦI RO HIỆN TẠI - HIỆN TẠI) */}
        {/* ============================================================ */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/5 pb-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 font-black text-sm">L2</span>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                LAYER 2 — CURRENT RISK (Nguy cơ hiện tại &amp; Can thiệp)
              </h3>
              <p className="text-xs text-slate-500 font-semibold">Các học phần đang học bị rủi ro và các môn trượt chưa được khắc phục</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recovery Intervention Queue (Failed Courses) */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                <XCircle className="text-rose-500" size={16} /> Hàng đợi Phục hồi Học vụ (Recovery Intervention Queue)
              </h4>
              <p className="text-xs text-slate-500">Môn học đã trượt trong quá khứ và chưa hoàn thành học lại/đạt điểm. Cần ưu tiên phục hồi gấp.</p>
              
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {unrecoveredFailedCourses.length > 0 ? (
                  unrecoveredFailedCourses.map((fc, idx) => (
                    <div key={idx} className="p-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition-all space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-rose-400 font-mono">{fc.courseId} — {fc.courseName || fc.courseId}</span>
                        <span className="text-[10px] font-black bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 text-rose-500">
                          TRƯỢT GỐC: {fc.value !== null ? `${fc.value.toFixed(1)}/10` : '—'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-350 leading-relaxed font-semibold">
                        ⚠️ Môn học này làm gián đoạn tiến độ tốt nghiệp và chặn các môn kế thừa. Đề xuất: Liên hệ Cố vấn học thuật đăng ký học lại sớm nhất.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} /> Trống (Không có môn trượt nào cần phục hồi).
                  </div>
                )}
              </div>
            </div>

            {/* Active Intervention Queue (Studying Courses) */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                <Clock className="text-amber-400" size={16} /> Hàng đợi Can thiệp Chủ động (Active Intervention Queue)
              </h4>
              <p className="text-xs text-slate-500">Các môn học đang học trong kỳ này. Cần theo dõi rủi ro và can thiệp trước kỳ thi.</p>
              
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {currentStudyingCourses.length > 0 ? (
                  currentStudyingCourses.map((sc, idx) => {
                    const pred = student.predictions?.find(p => p.courseId === sc.courseId);
                    const risk = pred?.risk || 'LOW';
                    const scoreVal = pred?.predictedScore ? `${pred.predictedScore.toFixed(0)}% Rủi ro` : 'Bình thường';
                    
                    return (
                      <div key={idx} className={`p-4 rounded-xl border transition-all space-y-2 ${
                        risk === 'HIGH' || risk === 'CRITICAL' ? 'bg-orange-500/5 border-orange-500/20 text-orange-400' : 'bg-white/5 border-white/10 text-slate-300'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-xs font-mono">{sc.courseId} — {sc.courseName || sc.courseId}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${
                            risk === 'HIGH' || risk === 'CRITICAL' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400 animate-pulse' :
                            risk === 'MEDIUM' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                            'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                          }`}>
                            {risk === 'HIGH' || risk === 'CRITICAL' ? `CẢNH BÁO: ${scoreVal}` : `AN TOÀN`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                          {pred?.explanation || `Học phần đang được theo dõi định kỳ. Duy trì tham gia lớp đầy đủ.`}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 bg-slate-900/50 border border-white/5 text-slate-500 rounded-xl text-xs font-bold text-center">
                    Không có học phần nào đang học trong học kỳ hiện tại.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-white/5">
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={16} /> Phân tích Nguyên nhân Gốc rễ (Academic Root Cause)
              </h4>
              {rootCauseAnalysis ? (
                <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-black text-sm text-amber-400 font-mono">
                        {rootCauseAnalysis.courseId} - {rootCauseAnalysis.name}
                      </h5>
                      <div className="flex flex-wrap gap-1 text-[8px] font-black uppercase text-slate-400">
                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">Tác động: {rootCauseAnalysis.academicImportanceLevel}</span>
                        <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Nghẽn: {rootCauseAnalysis.bottleneckWeight}/5</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-wrap bg-black/20 p-3 rounded-lg border border-white/5 font-medium">
                    {rootCauseAnalysis.explanation}
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={14} /> Chưa phát hiện điểm gãy học thuật nghiêm trọng.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-amber-400" size={16} /> Lộ trình Khôi phục Học lực 12 Tuần
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {recoveryRoadmap && recoveryRoadmap.length > 0 ? (
                  recoveryRoadmap.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] border border-blue-500/30">
                          {idx + 1}
                        </div>
                        {idx < recoveryRoadmap.length - 1 && <div className="w-0.5 bg-blue-500/20 flex-1 my-1"></div>}
                      </div>
                      <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] font-black text-blue-400 font-mono block uppercase font-mono">{step.phase}</span>
                        <h5 className="font-bold text-slate-200 mt-0.5">{step.title}</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1 font-medium">{step.focus}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Chưa tạo lộ trình khôi phục.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LAYER 3: FUTURE RISK (DỰ BÁO NGUY CƠ TƯƠNG LAI - TƯƠNG LAI) */}
        {/* ============================================================ */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-white/5 pb-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 font-black text-sm">L3</span>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                LAYER 3 — FUTURE RISK (Dự báo nguy cơ tương lai)
              </h3>
              <p className="text-xs text-slate-500 font-semibold">Dự báo nguy cơ cho các môn học sắp tới và rủi ro chậm ra trường</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Future Course Impact & Prerequisite Weakness Propagation */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                <Flame className="text-rose-500 animate-pulse" size={16} /> Dự báo Nguy cơ Môn học Tương lai (Syllabus DAG Propagation)
              </h4>
              <p className="text-xs text-slate-500">Dự đoán rủi ro đối với các môn học sắp tới do lỗ hổng kiến thức tiên quyết truyền dẫn qua Syllabus.</p>
              
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {futureCourseImpact && futureCourseImpact.length > 0 ? (
                  futureCourseImpact.map((fc, idx) => (
                    <div key={idx} className="p-4 bg-slate-900/40 rounded-xl border border-white/5 flex justify-between items-center gap-4 animate-fade-in">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-200 text-xs font-mono">{fc.courseId}</span>
                          <span className="text-slate-500 text-[10px]">— {fc.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">{fc.warning}</p>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${
                        fc.risk === 'CRITICAL' ? 'bg-rose-500/20 border-rose-500/30 text-rose-500 animate-pulse' : 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                      }`}>
                        {fc.risk === 'CRITICAL' ? 'NGUY CẤP' : 'RỦI RO CAO'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} /> Chưa ghi nhận rủi ro đối với các môn học tương lai.
                  </div>
                )}
              </div>
            </div>

            {/* Knowledge Dependency & Blocked Chains */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250 flex items-center gap-2">
                <Layers className="text-purple-400" size={16} /> Chuỗi Môn chuyên ngành bị chặn (Blocked Chains)
              </h4>
              <p className="text-xs text-slate-500">Các môn học phía sau bị khóa lớp, không thể đăng ký do nợ môn tiên quyết hiện tại.</p>
              
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {knowledgeDependency.blockedCourses && knowledgeDependency.blockedCourses.length > 0 ? (
                  knowledgeDependency.blockedCourses.map((bc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                      <div className="text-center min-w-[70px]">
                        <span className="text-[8px] text-rose-400 font-extrabold uppercase font-mono block">Chưa đạt</span>
                        <span className="text-[10px] font-bold text-rose-300 block bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/20 font-mono mt-0.5">{bc.failedCourse}</span>
                      </div>
                      <span className="text-slate-600 font-bold font-mono">&rarr;</span>
                      <div className="flex-1">
                        <span className="text-[8px] text-slate-500 font-extrabold uppercase font-mono block">Bị khóa lớp chuyên ngành</span>
                        <span className="text-[10px] font-bold text-slate-200 truncate block mt-0.5" title={bc.blockedCourseName}>
                          {bc.blockedCourse} — {bc.blockedCourseName}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={14} /> Không có môn học nào bị chặn tiến độ đăng ký.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Chỉ số rủi ro chậm tốt nghiệp (Delay Index):</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                  graduationRisk.level === 'CRITICAL' ? 'bg-rose-500/20 border-rose-500/20 text-rose-500' :
                  graduationRisk.level === 'HIGH' ? 'bg-rose-500/20 border-rose-500/20 text-rose-500' :
                  graduationRisk.level === 'MEDIUM' ? 'bg-amber-500/20 border-amber-500/20 text-amber-400' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {graduationRisk.level === 'CRITICAL' ? 'RẤT NGUY CẤP' : graduationRisk.level === 'HIGH' ? 'RỦI RO CAO' : graduationRisk.level === 'MEDIUM' ? 'CẦN CHÚ Ý' : 'AN TOÀN'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {graduationRisk.description}
              </p>
            </div>
            
            {graduationRisk.delaySemesters > 0 && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center min-w-[120px]">
                <span className="block text-[8px] text-rose-400 font-bold uppercase font-mono">Trễ dự kiến</span>
                <span className="text-lg font-black text-rose-500">+{graduationRisk.delaySemesters} Học kỳ</span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* DEPENDENCY HEATMAP: BẢN ĐỒ TÁC ĐỘNG SYLLABUS DECAY */}
        {/* ============================================================ */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-white/5">
            <Flame className="text-red-500 animate-pulse" size={20} />
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Bản đồ Tác động Syllabus (Syllabus Dependency Heatmap)
              </h3>
              <p className="text-xs text-slate-500 font-semibold">Xếp hạng các môn học yếu/trượt ảnh hưởng nghiêm trọng nhất đến tiến độ học tập (dựa trên điểm số, số môn bị chặn và độ trung tâm đồ thị)</p>
            </div>
          </div>

          {dependencyHeatmap && dependencyHeatmap.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase font-mono">
                    <th className="pb-2 pl-2">Thứ hạng</th>
                    <th className="pb-2">Mã môn &amp; Tên môn học</th>
                    <th className="pb-2 text-center">Điểm số</th>
                    <th className="pb-2 text-center">Số môn bị chặn (Syllabus Impact)</th>
                    <th className="pb-2 text-center">Độ trung tâm đồ thị (Centrality)</th>
                    <th className="pb-2 text-right pr-2">Điểm Tác động Rủi ro (Influence Score)</th>
                  </tr>
                </thead>
                <tbody>
                  {dependencyHeatmap.map((item, idx) => {
                    const score = item.riskInfluenceScore;
                    let rowBg = 'hover:bg-white/5';
                    let badgeColor = 'bg-slate-500/10 text-slate-400 border-white/5';
                    if (score >= 20) {
                      rowBg = 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10';
                      badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-black animate-pulse';
                    } else if (score >= 12) {
                      rowBg = 'bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/10';
                      badgeColor = 'bg-orange-500/20 text-orange-400 border-orange-500/30 font-bold';
                    } else if (score >= 6) {
                      rowBg = 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10';
                      badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold';
                    }
                    
                    return (
                      <tr key={idx} className={`border-b border-slate-100 dark:border-white/5 transition-colors font-medium ${rowBg}`}>
                        <td className="py-3 pl-3 font-bold text-slate-400 dark:text-slate-400 font-mono">#{idx + 1}</td>
                        <td className="py-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono block">{item.courseId}</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[200px]" title={item.name}>{item.name}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`font-black ${item.grade >= 5.0 ? 'text-blue-400' : 'text-rose-500 font-extrabold'}`}>
                            {item.grade.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-350 font-mono">{item.downstreamCount} môn</td>
                        <td className="py-3 text-center text-slate-550 font-semibold font-mono">{(item.centralityScore * 100).toFixed(0)}%</td>
                        <td className="py-3 text-right pr-2">
                          <span className={`text-[11px] font-mono font-black px-2.5 py-1 rounded-lg border ${badgeColor}`}>
                            {score.toFixed(1)}đ
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={14} /> Không có học phần yếu/trượt nào để xếp hạng tác động.
            </div>
          )}
        </div>

        {/* 10. Phân tích Khoảng cách Kỹ năng (Skill Gap Analysis) */}
        {skillsGapAnalysis && (
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={20} /> 10. Phân tích Khoảng cách Kỹ năng (Skill Gap Analysis)
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">Tự động đối chiếu lỗ hổng kỹ năng và các chuẩn đầu ra (CLOs) bị thiếu từ các môn học yếu hoặc trượt</p>
            
            <div className="space-y-6">
              <div className="bg-slate-100 dark:bg-black/30 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-3 font-mono">Tổng hợp kỹ năng cốt lõi đang thiếu:</span>
                <div className="flex flex-wrap gap-2">
                  {skillsGapAnalysis.allMissingSkills && skillsGapAnalysis.allMissingSkills.length > 0 ? (
                    skillsGapAnalysis.allMissingSkills.map((sk, idx) => (
                      <span key={idx} className="text-xs px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-300 font-bold">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold">✔ Không thiếu hụt kỹ năng cốt lõi nào.</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Chi tiết khoảng cách theo học phần:</span>
                {skillsGapAnalysis.failedOrWeakCourses && skillsGapAnalysis.failedOrWeakCourses.length > 0 ? (
                  skillsGapAnalysis.failedOrWeakCourses.map((c, idx) => (
                    <div key={idx} className="p-4 bg-slate-100 dark:bg-black/10 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                            {c.courseId} - {c.courseName}
                          </h5>
                          <span className="text-[10px] text-slate-500 font-medium">Điểm số: {c.grade ? c.grade.toFixed(1) : 'N/A'}</span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          c.status === 'FAILED' ? 'bg-rose-500/20 border-rose-500/20 text-rose-500' : 'bg-amber-500/20 border-amber-500/20 text-amber-400'
                        }`}>
                          {c.status === 'FAILED' ? 'TRƯỢT' : 'YẾU'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                        <div>
                          <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono mb-1">Kỹ năng mục tiêu:</span>
                          <div className="flex flex-wrap gap-1">
                            {c.skills.map((s, sIdx) => (
                              <span key={sIdx} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono mb-1">Chuẩn đầu ra (CLOs):</span>
                          <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5 font-medium pl-1">
                            {c.learningOutcomes.map((lo, lIdx) => (
                              <li key={lIdx} className="truncate" title={lo}>{lo}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-2">Không ghi nhận môn học yếu/trượt.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 11. Ảnh hưởng Định hướng Nghề nghiệp (Career Impact) */}
        {careerImpactAnalysis && (
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <GraduationCap className="text-emerald-400" size={20} /> 11. Ảnh hưởng Định hướng Nghề nghiệp (Career Impact)
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">Đánh giá mức độ rủi ro đối với 5 vị trí công việc chính trong ngành Thiết kế Web của FPT Polytechnic</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careerImpactAnalysis.map((c, idx) => (
                <div key={idx} className="p-4 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl space-y-4">
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

                  <div className="space-y-2">
                    <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                      Minh chứng học phần cốt lõi (Source Courses):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {c.requiredCourses && c.requiredCourses.map((rc, rcIdx) => {
                        const isPassed = rc.status === 'PASSED' && (rc.grade === null || rc.grade >= 7.0);
                        const isWeak = rc.status === 'PASSED' && rc.grade !== null && rc.grade < 7.0;
                        const isFailed = rc.status === 'FAILED';
                        
                        let badgeClass = 'bg-slate-500/5 border-slate-500/10 text-slate-400';
                        let statusText = 'Chưa học';
                        
                        if (isPassed) {
                          badgeClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
                          statusText = `Đạt (${rc.grade ? rc.grade.toFixed(1) : '—'})`;
                        } else if (isWeak) {
                          badgeClass = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                          statusText = `Yếu (${rc.grade ? rc.grade.toFixed(1) : '—'})`;
                        } else if (isFailed) {
                          badgeClass = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
                          statusText = `Trượt (${rc.grade ? rc.grade.toFixed(1) : '—'})`;
                        }
                        
                        return (
                          <span 
                            key={rcIdx} 
                            title={`${rc.courseId} - ${rc.courseName}\nTrạng thái: ${statusText}`}
                            className={`text-[9px] px-2 py-0.5 rounded border font-bold ${badgeClass}`}
                          >
                            {rc.courseId}: {statusText}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                      Kỹ năng cốt lõi bắt buộc (Di chuột để xem minh chứng học thuật):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {c.requiredSkills.map((skObj, skIdx) => {
                        const isMissing = !skObj.isPossessed;
                        const tooltipText = `Kỹ năng: ${skObj.skillName}\n` +
                          `Nguồn đào tạo: Môn ${skObj.teachingCourseId || 'N/A'} - ${skObj.teachingCourseName || 'N/A'}\n` +
                          `Trạng thái học vụ: ${skObj.status === 'NOT_STARTED' ? 'Chưa học' : `Điểm: ${skObj.grade !== null ? skObj.grade.toFixed(1) : '—'} (${skObj.status})`}\n` +
                          `Minh chứng giáo trình: ${skObj.syllabusSource || 'N/A'}\n` +
                          `Vị trí bài học: ${skObj.syllabusLocation || 'N/A'}\n` +
                          `Chuẩn đầu ra: ${skObj.syllabusCLO || 'N/A'}`;
                        
                        return (
                          <span 
                            key={skIdx} 
                            title={tooltipText}
                            className={`text-[9px] px-2 py-0.5 rounded cursor-help transition-all ${
                              isMissing 
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium line-through' 
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold'
                            }`}
                          >
                            {isMissing ? '✗' : '✓'} {skObj.skillName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <span>Xếp hạng khóa: <strong className="text-emerald-400">Top {dssReport.academicHealth.cohortPercentile}% ({dssReport.academicHealth.cohortRank}/{dssReport.academicHealth.totalCohort} SV)</strong></span>
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
                            <Cell key={`cell-${index}`} fill={entry.score >= 8 ? '#10b981' : entry.score >= 5 ? '#3b82f6' : '#ef4444'} />
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
                                  <tr key={`${semNum}-${idx}`} className={`border-b border-slate-200 dark:border-white/5 hover:bg-white/5 transition-colors ${isNotStarted ? 'opacity-50' : ''}`}>
                                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300 text-xs">{c.courseId}</td>
                                    <td className="p-3 text-slate-900 dark:text-white font-medium text-xs max-w-[160px] truncate" title={c.courseName}>{c.courseName}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400 text-center text-xs">{c.credits}</td>
                                    <td className="p-3 text-center">
                                      {processScore !== null ? (
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{processScore.toFixed(1)}</span>
                                      ) : <span className="text-xs text-slate-400 dark:text-slate-600 font-bold">0.0</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                      {examScore !== null ? (
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{examScore.toFixed(1)}</span>
                                      ) : <span className="text-xs text-slate-400 dark:text-slate-600 font-bold">0.0</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                      {c.value !== null ? (
                                        <span className={`text-sm font-black ${c.value >= 8 ? 'text-emerald-400' : c.value >= 5 ? 'text-blue-400' : 'text-rose-500'}`}>
                                          {c.value.toFixed(1)}
                                        </span>
                                      ) : <span className="text-xs text-slate-400 dark:text-slate-600 font-bold">0.0</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                      {c.value !== null ? (
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{getLetterGrade(c.value)}</span>
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
                                                  <span key={j} className="text-[9px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">{aff}</span>
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
                                                  <span key={j} className="text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">{aff}</span>
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
                <div className="mt-4 text-[10px] text-slate-500 italic flex items-center gap-2">
                  <span>Hiển thị {filteredAllCourses.length}/{allCourses.length} môn học</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span>Chưa có điểm: không tính vào GPA trung bình</span>
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
                <div className={`p-4 rounded-2xl border ${
                  dssReport.interventionRecommendation.colorClass === 'rose' ? 'bg-rose-500/10 border-rose-500/25 text-rose-300' :
                  dssReport.interventionRecommendation.colorClass === 'amber' ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' :
                  dssReport.interventionRecommendation.colorClass === 'blue' ? 'bg-blue-500/10 border-blue-500/25 text-blue-300' :
                  'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                }`}>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono opacity-80">Mức Can Thiệp:</span>
                  <span className="text-base font-black block mt-1">{dssReport.interventionRecommendation.actionTitle}</span>
                  <p className="text-xs mt-2 leading-relaxed opacity-95 text-slate-700 dark:text-slate-200">
                    {dssReport.interventionRecommendation.description}
                  </p>
                </div>
                
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
                    <option value="" disabled>Không có môn nào có rủi ro hiện tại</option>
                  ) : (
                    riskyCourses.map(s => {
                      const pred = student.predictions?.find(p => p.courseId === s.courseId);
                      const risk = pred?.risk;
                      const label = risk === 'HIGH' || risk === 'CRITICAL' ? ' 🔴 Cao' : risk === 'MEDIUM' ? ' 🟡 Trung bình' : s.status === 'FAILED' ? ' ❌ Trượt' : ' ⚠️ Rủi ro';
                      return (
                        <option key={s.courseId} value={s.courseId} className="bg-white dark:bg-slate-900">
                          {s.courseId} — {s.course?.name || s.courseId}{label}
                        </option>
                      );
                    })
                  )}
                </select>
                {riskyCourses.length > 0 && (
                  <p className="text-[10px] text-slate-500">{riskyCourses.length} môn có rủi ro — Chỉ hiện môn cần can thiệp, bỏ qua môn đã đạt tốt.</p>
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
