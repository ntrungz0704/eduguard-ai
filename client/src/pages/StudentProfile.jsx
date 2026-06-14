import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../lib/api';
import { 
  ArrowLeft, GraduationCap, Mail, Brain, CheckCircle2,
  AlertTriangle, Phone, Calendar, Send, HeartHandshake, Loader2, Sparkles, BookOpen, UserPlus, X, Copy,
  TrendingUp, XCircle, Clock, ShieldAlert, Wand2, Activity, Layers
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
  const { mssv } = useParams();
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
  
  // Chỉ hiện môn có rủi ro trong dropdown can thiệp:
  // - Đã trượt (FAILED)
  // - Điểm < 6 (nguy cơ cao)
  // - Có AI prediction HIGH/CRITICAL
  // - Đang học (chưa có điểm) và có prediction bất kỳ
  // Bỏ qua môn điều kiện (Thể chất, Quốc phòng, Vovinam)
  const riskyCourses = scoreEntries.filter(s => {
    if (isConditionalCourse(s.course?.name || s.courseId, s.courseId)) return false;
    const pred = student.predictions?.find(p => p.courseId === s.courseId);
    const isFailed = s.status === 'FAILED';
    const isLowScore = s.value !== null && s.value < 6;
    const isHighRisk = pred && (pred.risk === 'HIGH' || pred.risk === 'CRITICAL');
    const isMediumRisk = pred && pred.risk === 'MEDIUM';
    const isInProgress = s.status !== 'PASSED' && s.status !== 'FAILED';
    return isFailed || isLowScore || isHighRisk || (isInProgress && (isHighRisk || isMediumRisk || pred));
  });
  
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
      programLevelComparison
    } = dssReport;

    return (
      <div className="space-y-8">
        
        {/* 1. Academic Health Score */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="text-emerald-400 animate-pulse" size={20} /> 1. Chỉ số Sức khỏe Học tập (Academic Health Score)
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-slate-200 dark:border-white/15 bg-white/5 shadow-inner">
              <span className={`text-3xl font-black ${
                academicHealth.score === 'N/A' ? 'text-slate-400' :
                academicHealth.score >= 75 ? 'text-emerald-400' : 
                academicHealth.score >= 50 ? 'text-amber-400' : 
                'text-rose-500'}`}>
                {academicHealth.score}
              </span>
              <span className="text-[10px] text-slate-500 font-bold absolute bottom-4 uppercase font-mono">/ 100đ</span>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">Phân loại:</span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                  academicHealth.score === 'N/A' ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' :
                  academicHealth.score >= 75 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  academicHealth.score >= 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-rose-500/10 border-rose-500/20 text-rose-500'
                }`}>
                  {academicHealth.rating}
                </span>
                {academicHealth.score !== 'N/A' && academicHealth.cohortPercentile !== undefined && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400">
                    Xếp hạng: Top {academicHealth.cohortPercentile}% ({academicHealth.cohortRank}/{academicHealth.totalCohort} SV)
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-350 font-medium leading-relaxed font-sans">
                {academicHealth.description}
              </p>
            </div>
          </div>

          {/* System Brand Disclaimer */}
          <div className="mt-6 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-305 dark:text-blue-300/90 text-xs leading-relaxed font-medium">
            <strong>Tuyên bố giới hạn hệ thống:</strong> EduGuard không cam kết dự đoán chính xác điểm tuyệt đối. EduGuard giúp phát hiện sớm rủi ro học tập, giải thích nguyên nhân học thuật và đề xuất lộ trình cải thiện dựa trên cấu trúc chương trình đào tạo.
          </div>
        </div>

        {/* 2. Trend Analysis */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <TrendingUp className="text-blue-400" size={20} /> 2. Phân tích Xu hướng Học thuật (Trend Analysis)
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Theo dõi sự biến thiên GPA hệ 10 qua các học kỳ đào tạo</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-56 w-full">
              {trendAnalysis.trendData && trendAnalysis.trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendAnalysis.trendData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <XAxis dataKey="semester" tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                    <YAxis domain={[0, 10]} tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                    />
                    <Bar dataKey="gpa" name="GPA học kỳ" radius={[4, 4, 0, 0]}>
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
            
            <div className="bg-slate-100 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-center">
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2 font-mono">Trạng thái xu hướng:</span>
              <span className="text-lg font-black text-white block mb-3">{trendAnalysis.status}</span>
              <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                {trendAnalysis.explanation}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Knowledge Dependency Analysis */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Layers className="text-purple-400" size={20} /> 3. Phân tích Chuỗi Môn bị chặn (Knowledge Dependency)
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Bản đồ các môn chuyên ngành phía sau bị khóa tiến độ do sinh viên chưa vượt qua môn gốc</p>

          {knowledgeDependency.blockedCourses && knowledgeDependency.blockedCourses.length > 0 ? (
            <div className="space-y-4">
              {knowledgeDependency.blockedCourses.map((bc, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 rounded-2xl transition-all">
                  <div className="text-center min-w-[100px]">
                    <span className="block text-[10px] text-rose-400 font-bold uppercase font-mono">Trượt môn gốc</span>
                    <span className="text-xs font-bold text-white block bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/30 mt-1">{bc.failedCourse}</span>
                  </div>
                  
                  <div className="flex-1 flex justify-center text-slate-500 dark:text-slate-400 font-mono text-lg">
                    <span>↓</span>
                  </div>

                  <div className="text-center min-w-[120px] max-w-[200px]">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase font-mono">Bị chặn học phần</span>
                    <span className="text-xs font-bold text-slate-300 block bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 mt-1 truncate" title={bc.blockedCourseName}>
                      {bc.blockedCourse}
                    </span>
                  </div>
                  
                  <div className="hidden md:block flex-[2] text-xs text-slate-605 dark:text-slate-400 leading-relaxed font-medium">
                    Sinh viên cần đăng ký học lại gấp môn <b>{bc.failedCourse}</b> để hệ thống mở khóa lớp học môn <b>{bc.blockedCourse} ({bc.blockedCourseName})</b>.
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} /> Không có môn học nào bị chặn tiến độ do nợ môn.
            </div>
          )}
        </div>

        {/* 4. Root Cause Analysis */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} /> 4. Phân tích Nguyên nhân Gốc rễ (Root Cause Analysis)
          </h3>

          {rootCauseAnalysis ? (
            <div className="p-6 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl h-fit">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-lg text-amber-400">
                    {rootCauseAnalysis.courseId} - {rootCauseAnalysis.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Tầm ảnh hưởng:</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      rootCauseAnalysis.academicImportanceLevel === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                      rootCauseAnalysis.academicImportanceLevel === 'HIGH' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                      rootCauseAnalysis.academicImportanceLevel === 'MEDIUM' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                      'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}>
                      {rootCauseAnalysis.academicImportanceLevel === 'CRITICAL' ? 'NGUY CẤP' :
                       rootCauseAnalysis.academicImportanceLevel === 'HIGH' ? 'CAO' :
                       rootCauseAnalysis.academicImportanceLevel === 'MEDIUM' ? 'TRUNG BÌNH' : 'THẤP'}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-slate-500/10 border-white/5 text-slate-300">
                      Trọng số nghẽn: {rootCauseAnalysis.bottleneckWeight}/5
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-amber-500/10 border-amber-500/20 text-amber-400">
                      Ưu tiên can thiệp: {rootCauseAnalysis.academicImportanceLevel === 'CRITICAL' ? 'RẤT CAO (CRITICAL)' :
                                         rootCauseAnalysis.academicImportanceLevel === 'HIGH' ? 'CAO (HIGH)' :
                                         rootCauseAnalysis.academicImportanceLevel === 'MEDIUM' ? 'TRUNG BÌNH (MEDIUM)' : 'THẤP (LOW)'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-700 dark:text-slate-350 font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                {rootCauseAnalysis.explanation}
              </p>

              {/* Failure Chain Visual Graph */}
              {rootCauseAnalysis.path && rootCauseAnalysis.path.length > 0 && (
                <div className="bg-slate-50 dark:bg-black/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Sơ đồ Truy vết Chuỗi Thất bại học thuật (Academic Root Cause Failure Chain):
                  </span>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-start gap-4 flex-wrap">
                    {rootCauseAnalysis.path.map((node, nIdx) => (
                      <React.Fragment key={nIdx}>
                        <div className="flex-1 min-w-[200px] max-w-[280px] p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between">
                          {nIdx === rootCauseAnalysis.path.length - 1 && (
                            <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full blur-md"></div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white font-mono">{node.courseId}</span>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                                node.status === 'FAILED' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                node.status === 'WEAK' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              }`}>
                                {node.status === 'FAILED' ? 'TRƯỢT' : node.status === 'WEAK' ? 'YẾU' : 'ĐẠT'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-700 dark:text-slate-350 block font-medium truncate" title={node.name}>{node.name}</span>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-2">
                            <span className="text-[10px] text-slate-400 font-bold font-mono">
                              Điểm: {node.grade !== null ? `${node.grade.toFixed(1)}/10` : '—'}
                            </span>
                            {nIdx === rootCauseAnalysis.path.length - 1 ? (
                              <span className="text-[9px] font-black uppercase text-amber-500 dark:text-amber-400 flex items-center gap-0.5 animate-pulse">
                                🌟 Nguyên nhân gốc rễ
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">
                                Môn kế thừa #{nIdx + 1}
                              </span>
                            )}
                          </div>
                        </div>
                        {nIdx < rootCauseAnalysis.path.length - 1 && (
                          <div className="flex items-center justify-center text-slate-400 dark:text-slate-600 font-black text-xl select-none py-1 md:py-0">
                            <span className="hidden md:inline">➔</span>
                            <span className="inline md:hidden">↓</span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Explainable Graphs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-white/5">
                {/* 1. Course -> Skill Graph */}
                <div className="bg-slate-50 dark:bg-black/30 p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <Brain size={14} /> Course ➔ Skill Graph
                  </div>
                  <p className="text-[11px] text-slate-500">Mối quan hệ giữa môn học gốc rễ và bộ kỹ năng cốt lõi bị gián đoạn</p>
                  
                  <div className="bg-white dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-center font-bold text-xs text-slate-900 dark:text-white font-mono">
                    {rootCauseAnalysis.courseId}
                  </div>
                  <div className="text-center text-slate-500 font-mono text-sm leading-none">↓</div>
                  <div className="flex flex-col gap-1.5">
                    {rootCauseAnalysis.missingSkills && rootCauseAnalysis.missingSkills.length > 0 ? (
                      rootCauseAnalysis.missingSkills.map((sk, sIdx) => (
                        <div key={sIdx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-[10px] text-rose-300 font-medium">
                          <span>{sk}</span>
                          <span className="text-[8px] bg-rose-500/20 px-1 py-0.2 rounded border border-rose-500/20 font-black">MISSING</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Không có dữ liệu</span>
                    )}
                  </div>
                </div>

                {/* 2. Course -> CLO Graph */}
                <div className="bg-slate-50 dark:bg-black/30 p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <Layers size={14} /> Course ➔ CLO Graph
                  </div>
                  <p className="text-[11px] text-slate-500">Chuẩn đầu ra (CLOs) của môn gốc rễ bị ảnh học hưởng nghiêm trọng</p>
                  
                  <div className="bg-white dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-center font-bold text-xs text-slate-900 dark:text-white font-mono">
                    {rootCauseAnalysis.courseId}
                  </div>
                  <div className="text-center text-slate-500 font-mono text-sm leading-none">↓</div>
                  <div className="space-y-1.5">
                    {rootCauseAnalysis.learningOutcomes && rootCauseAnalysis.learningOutcomes.length > 0 ? (
                      rootCauseAnalysis.learningOutcomes.map((clo, cIdx) => (
                        <div key={cIdx} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-350 leading-relaxed font-semibold" title={clo}>
                          {clo}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Không có dữ liệu</span>
                    )}
                  </div>
                </div>

                {/* 3. Skill -> Career Graph */}
                <div className="bg-slate-50 dark:bg-black/30 p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
                    <GraduationCap size={14} /> Skill ➔ Career Graph
                  </div>
                  <p className="text-[11px] text-slate-500">Các vị trí nghề nghiệp mục tiêu bị đe dọa trực tiếp do thiếu hụt kỹ năng</p>
                  
                  <div className="flex flex-wrap gap-1">
                    {rootCauseAnalysis.missingSkills && rootCauseAnalysis.missingSkills.length > 0 ? (
                      rootCauseAnalysis.missingSkills.map((sk, sIdx) => (
                        <span key={skIdx} className="text-[9px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/10 text-rose-300 font-semibold">{sk}</span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-550">N/A</span>
                    )}
                  </div>
                  <div className="text-center text-slate-500 font-mono text-sm leading-none">↓</div>
                  <div className="flex flex-col gap-1.5">
                    {rootCauseAnalysis.careerRelevance && rootCauseAnalysis.careerRelevance.length > 0 ? (
                      rootCauseAnalysis.careerRelevance.map((cr, crIdx) => (
                        <div key={crIdx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/50 border border-white/5 text-[10px] text-slate-350 font-bold">
                          <span>{cr}</span>
                          <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1 py-0.2 rounded border border-rose-500/20 font-black">RISK</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">Không có dữ liệu</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Kỹ năng đang thiếu:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rootCauseAnalysis.missingSkills && rootCauseAnalysis.missingSkills.length > 0 ? (
                      rootCauseAnalysis.missingSkills.map((sk, sIdx) => (
                        <span key={sIdx} className="text-[10px] px-2.5 py-1 rounded bg-slate-500/10 hover:bg-slate-500/20 text-slate-300 border border-white/5 transition-all">
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Không tìm thấy</span>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Nguyên nhân thường gặp:</span>
                  <ul className="list-disc list-inside text-xs text-slate-350 space-y-1 pt-1 font-medium pl-1">
                    {rootCauseAnalysis.commonFailureReasons && rootCauseAnalysis.commonFailureReasons.length > 0 ? (
                      rootCauseAnalysis.commonFailureReasons.map((fr, frIdx) => (
                        <li key={frIdx} className="leading-relaxed text-slate-300">{fr}</li>
                      ))
                    ) : (
                      <li className="text-slate-500 list-none">Không có dữ liệu</li>
                    )}
                  </ul>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="block text-[10px] text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Nghề nghiệp bị ảnh hưởng:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rootCauseAnalysis.careerRelevance && rootCauseAnalysis.careerRelevance.length > 0 ? (
                      rootCauseAnalysis.careerRelevance.map((cr, crIdx) => (
                        <span key={crIdx} className="text-[10px] px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/10 text-rose-300">
                          {cr}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">Không có dữ liệu</span>
                    )}
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="block text-[10px] text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Khuyến nghị hành động:</span>
                  <ul className="list-decimal list-inside text-xs text-slate-350 space-y-1 pt-1 font-semibold pl-1">
                    {rootCauseAnalysis.remediationRecommendations && rootCauseAnalysis.remediationRecommendations.length > 0 ? (
                      rootCauseAnalysis.remediationRecommendations.map((rec, recIdx) => (
                        <li key={recIdx} className="leading-relaxed text-emerald-400">{rec}</li>
                      ))
                    ) : (
                      <li className="text-slate-500 list-none">Không có dữ liệu</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} /> Chưa phát hiện điểm gãy học thuật nghiêm trọng. Phong độ nền tảng được đảm bảo.
            </div>
          )}
        </div>

        
{/* 5. Risk Contributors */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <ShieldAlert className="text-orange-400" size={20} /> 5. Tác nhân Đóng góp Rủi ro (Risk Contributors Detail)
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Tỷ lệ % tác động của từng nhân tố học vụ dẫn đến kết quả cảnh báo rủi ro</p>

          <div className="space-y-4">
            {riskContributors && riskContributors.length > 0 ? (
              riskContributors.map((c, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-800 dark:text-slate-200">{c.label}</span>
                    <span className="font-mono text-rose-400">{c.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/5 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" 
                      style={{ width: `${c.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">Không ghi nhận tác nhân rủi ro hoạt động.</p>
            )}
          </div>
        </div>

        {/* 6. Future Course Impact */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Brain className="text-blue-400" size={20} /> 6. Ảnh hưởng Môn học Tương lai (Future Course Impact)
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Dự báo mức độ rủi ro đối với các môn học sắp tới dựa trên nền tảng hiện tại</p>

          {futureCourseImpact && futureCourseImpact.length > 0 ? (
            <div className="space-y-3">
              {futureCourseImpact.map((fc, idx) => (
                <div key={idx} className="p-4 bg-slate-200 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{fc.courseId}</span>
                      <span className="text-slate-600 dark:text-slate-400 text-xs font-medium">— {fc.name}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{fc.warning}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border w-fit h-fit ${
                    fc.risk === 'CRITICAL' ? 'bg-rose-500/20 border-rose-500/20 text-rose-500' : 'bg-orange-500/20 border-orange-500/20 text-orange-400'
                  }`}>
                    {fc.risk === 'CRITICAL' ? 'NGUY CẤP' : 'RỦI RO CAO'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} /> Chưa ghi nhận rủi ro đối với các môn học tương lai.
            </div>
          )}
        </div>

        {/* 7. Graduation Risk */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <GraduationCap className="text-blue-400" size={20} /> 7. Nguy cơ Chậm Tốt nghiệp (Graduation Risk)
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Ước tính khả năng chậm tiến độ nhận bằng cử nhân</p>

          <div className="p-5 bg-slate-200 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider font-mono">Mức rủi ro tốt nghiệp:</span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  graduationRisk.level === 'HIGH' ? 'bg-rose-500/20 border-rose-500/20 text-rose-500' :
                  graduationRisk.level === 'MEDIUM' ? 'bg-amber-500/20 border-amber-500/20 text-amber-400' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {graduationRisk.level === 'HIGH' ? 'RỦI RO CAO' : graduationRisk.level === 'MEDIUM' ? 'TRUNG BÌNH' : 'AN TOÀN'}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed pt-1">
                {graduationRisk.description}
              </p>
            </div>
            
            {graduationRisk.delaySemesters > 0 && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center min-w-[130px]">
                <span className="block text-[9px] text-rose-400 font-bold uppercase font-mono">Thời gian trễ dự kiến</span>
                <span className="text-xl font-black text-rose-500">+{graduationRisk.delaySemesters} Kỳ</span>
              </div>
            )}
          </div>
        </div>

        {/* 8. Recovery Roadmap */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Sparkles className="text-amber-400" size={20} /> 8. Lộ trình Khôi phục Học lực 12 Tuần (Recovery Roadmap)
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">Kế hoạch cải thiện chia theo từng giai đoạn hỗ trợ sinh viên học tập hiệu quả</p>

          <div className="space-y-4">
            {recoveryRoadmap && recoveryRoadmap.length > 0 ? (
              recoveryRoadmap.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                      {idx + 1}
                    </div>
                    {idx < recoveryRoadmap.length - 1 && (
                      <div className="w-0.5 bg-blue-500/20 h-16 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 bg-slate-200 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest font-mono block mb-1">{step.phase}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">{step.title}</h4>
                    <p className="text-xs text-slate-705 dark:text-slate-350 leading-relaxed font-medium">
                      {step.focus}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">Chưa tạo lộ trình khôi phục.</p>
            )}
          </div>
        </div>

        {/* 9. Program-Level Comparison */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Layers className="text-indigo-400" size={20} /> 9. So sánh Đối sánh toàn Khóa (Program-Level Comparison)
          </h3>
          <p className="text-xs text-slate-500 mb-6 font-semibold">So sánh điểm số cá nhân của sinh viên với điểm trung bình lớp và tỷ lệ đạt toàn khóa</p>

          {programLevelComparison && programLevelComparison.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase">
                    <th className="pb-2 pl-2">Mã môn</th>
                    <th className="pb-2">Tên môn học</th>
                    <th className="pb-2 text-center">Điểm SV</th>
                    <th className="pb-2 text-center">TB Lớp</th>
                    <th className="pb-2 text-center">Chênh lệch</th>
                    <th className="pb-2 text-right pr-2">Tỷ lệ đậu toàn khóa</th>
                  </tr>
                </thead>
                <tbody>
                  {programLevelComparison.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-white/5 transition-colors font-medium">
                      <td className="py-3 pl-2 font-bold text-slate-800 dark:text-slate-300">{item.courseId}</td>
                      <td className="py-3 text-slate-900 dark:text-white truncate max-w-[150px]">{item.courseName}</td>
                      <td className="py-3 text-center">
                        <span className={`font-black ${item.studentGrade >= 5.0 ? 'text-blue-400' : 'text-rose-500'}`}>
                          {item.studentGrade.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 text-center font-semibold text-slate-600 dark:text-slate-400">{item.classAverage.toFixed(1)}</td>
                      <td className="py-3 text-center">
                        <span className={`font-mono font-bold ${item.difference >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {item.difference >= 0 ? `+${item.difference.toFixed(1)}` : `${item.difference.toFixed(1)}`}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-2 font-bold text-slate-800 dark:text-slate-300">{item.classPassRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-550 text-center py-4">Chưa có dữ liệu đối sánh học thuật.</p>
          )}
        </div>

        {/* 10. Phân tích Khoảng cách Kỹ năng (Skill Gap Analysis) */}
        {dssReport.skillsGapAnalysis && (
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={20} /> 10. Phân tích Khoảng cách Kỹ năng (Skill Gap Analysis)
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">Tự động đối chiếu lỗ hổng kỹ năng và các chuẩn đầu ra (CLOs) bị thiếu từ các môn học yếu hoặc trượt</p>
            
            <div className="space-y-6">
              {/* Tag Cloud of Missing Skills */}
              <div className="bg-slate-100 dark:bg-black/30 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-3 font-mono">Tổng hợp kỹ năng cốt lõi đang thiếu:</span>
                <div className="flex flex-wrap gap-2">
                  {dssReport.skillsGapAnalysis.allMissingSkills && dssReport.skillsGapAnalysis.allMissingSkills.length > 0 ? (
                    dssReport.skillsGapAnalysis.allMissingSkills.map((sk, idx) => (
                      <span key={idx} className="text-xs px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-300 font-bold">
                        {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold">✔ Không thiếu hụt kỹ năng cốt lõi nào.</span>
                  )}
                </div>
              </div>

              {/* Course-to-Skill Graph List */}
              <div className="space-y-3">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">Chi tiết khoảng cách theo học phần:</span>
                {dssReport.skillsGapAnalysis.failedOrWeakCourses && dssReport.skillsGapAnalysis.failedOrWeakCourses.length > 0 ? (
                  dssReport.skillsGapAnalysis.failedOrWeakCourses.map((c, idx) => (
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
        {dssReport.careerImpactAnalysis && (
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <GraduationCap className="text-emerald-400" size={20} /> 11. Ảnh hưởng Định hướng Nghề nghiệp (Career Impact)
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">Đánh giá mức độ rủi ro đối với 5 vị trí công việc chính trong ngành Thiết kế Web của FPT Polytechnic</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dssReport.careerImpactAnalysis.map((c, idx) => (
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
                    <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider font-mono">
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
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-white rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/5 transition-all">
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
