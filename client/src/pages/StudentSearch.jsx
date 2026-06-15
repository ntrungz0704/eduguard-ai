import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../lib/api';
import { 
  Search, User, Hash, AlertTriangle, CheckCircle, Info, 
  MessageSquare, Send, Sparkles, TrendingUp, ArrowRight, 
  Flag, Award, BookOpen, GraduationCap, Clock,
  ChevronDown, ChevronUp, ChevronRight, Check, Plus, Trash2, Play, Pause, RotateCcw,
  Activity, CheckCircle2, ShieldAlert, Brain, Layers, Mail, Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Cell
} from 'recharts';
import { courseNameToCode } from '../courseMap';

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
    .map(c => getCurriculumSemester(c.courseId, c.course?.name || c.courseName || c.courseId));
  
  if (studiedSems.length === 0) return 1;
  const maxStudied = Math.max(...studiedSems);
  
  const coursesInMaxSem = courses.filter(c => getCurriculumSemester(c.courseId, c.course?.name || c.courseName || c.courseId) === maxStudied);
  const completedInMaxSem = coursesInMaxSem.filter(c => c.status === 'PASSED' || c.status === 'FAILED');
  
  if (completedInMaxSem.length === coursesInMaxSem.length && maxStudied < 6) {
    return maxStudied + 1;
  }
  return maxStudied;
};


const getScoresArray = (student) => {
  if (!student) return [];
  const scores = student.scores;
  if (!scores) return [];
  if (Array.isArray(scores)) return scores;
  if (typeof scores === 'object') {
    return Object.entries(scores).map(([courseId, val]) => ({
      courseId,
      value: val,
      status: val === null ? 'STUDYING' : (val >= 5 ? 'PASSED' : 'FAILED'),
      course: { id: courseId, name: courseId, credits: getCourseCredits(courseId) }
    }));
  }
  return [];
};

const getLocalRiskLevel = (student) => {
  if (!student) return 'LOW';
  const scoresArray = Object.values(student.scores || {});
  const failedCount = scoresArray.filter(v => v !== null && v < 5.0).length;
  const lowGradesCount = scoresArray.filter(v => v !== null && v < 6.5).length;
  
  if (failedCount >= 3) return 'CRITICAL';
  if (failedCount > 0) return 'HIGH';
  if (lowGradesCount > 0) return 'MEDIUM';
  return 'LOW';
};

const calculateLocalFptGPA = (scores) => {
  if (!scores) return 0.0;
  
  let totalScoreWeight = 0;
  let gpaCredits = 0;

  Object.entries(scores).forEach(([courseId, val]) => {
    if (val === null || val === undefined || val === '') return;
    const score = parseFloat(val);
    const isCond = isConditionalCourse(courseId, courseId);
    const isEng = isEnglishCourse(courseId, courseId);
    const credits = getCourseCredits(courseId);

    if (!isCond && !isEng && score > 1.0) {
      totalScoreWeight += score * credits;
      gpaCredits += credits;
    }
  });

  return gpaCredits === 0 ? 0.0 : Math.floor(((totalScoreWeight / gpaCredits) + 1e-9) * 100) / 100;
};

export default function StudentSearch() {
  const navigate = useNavigate();
  const activeStudent = useStore(state => state.activeStudent);
  const setActiveStudent = useStore(state => state.setActiveStudent);

  const query = useStore(state => state.searchQuery);
  const setQuery = useStore(state => state.setSearchQuery);
  const sortType = useStore(state => state.sortType);
  const setSortType = useStore(state => state.setSortType);
  const onlyShowAtRisk = useStore(state => state.onlyShowAtRisk);
  const setOnlyShowAtRisk = useStore(state => state.setOnlyShowAtRisk);
  const riskFilter = useStore(state => state.riskFilter);
  const setRiskFilter = useStore(state => state.setRiskFilter);

  const [results, setResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dssReport, setDssReport] = useState(null);
  const [loadingDss, setLoadingDss] = useState(false);
  
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    if (!selectedStudent) {
      api.get('/students-search?q=').then(res => setAllStudents(res.data)).catch(console.error);
    }
  }, [selectedStudent]);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) {
      navigate(`/student/${urlId}`, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (activeStudent) {
      setSearchParams({ id: activeStudent.mssv || activeStudent.id }, { replace: true });
      if (!selectedStudent || (selectedStudent.mssv !== activeStudent.mssv && selectedStudent.id !== activeStudent.id)) {
        setSelectedStudent(activeStudent);
      }
      
      const studentId = activeStudent.mssv || activeStudent.id;
      // Chat box nhỏ chỉ lưu tạm thời trong session, không persist — reset mỗi lần chọn SV mới
      setChatHistory([
        {
          role: 'ai',
          text: `👋 Tôi đã sẵn sàng hỗ trợ! Tôi vừa nạp toàn bộ học bạ và phân tích rủi ro của sinh viên **${activeStudent.name}** (${studentId}). Bạn có thể hỏi tôi về:\n\n- *Tại sao sinh viên này có nguy cơ trượt môn nào đó?*\n- *Gợi ý lộ trình can thiệp và cải thiện điểm số.*\n- *Phân tích chi tiết lỗ hổng kiến thức tiên quyết.*`
        }
      ]);
    } else {
      setSearchParams({}, { replace: true });
      setSelectedStudent(null);
    }
  }, [activeStudent?.mssv, activeStudent?.id, setSearchParams]);

  useEffect(() => {
    const studentId = selectedStudent?.mssv || selectedStudent?.id;
    if (studentId) {
      setLoadingDss(true);
      api.get(`/students/${studentId}/dss-report`)
        .then(res => {
          setDssReport(res.data);
        })
        .catch(err => {
          console.error('Failed to fetch DSS report in search page:', err);
          setDssReport(null);
        })
        .finally(() => {
          setLoadingDss(false);
        });
    } else {
      setDssReport(null);
    }
  }, [selectedStudent?.mssv, selectedStudent?.id]);

  // Chatbot State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Inline Grade Editor State
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Personal Assistant Tabs State
  const [activeTab, setActiveTab] = useState('gpa'); // 'gpa', 'roadmap', 'tools'

  // Filter States for detailed score sheet
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('Tất cả các học kỳ');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Tất cả trạng thái');

  // Accordion State for Weak Subjects
  const [expandedWeakSubject, setExpandedWeakSubject] = useState(0);

  // Challenges/Checklist State
  const [challenges, setChallenges] = useState([]);

  const handleToggleChallenge = (id) => {
    setChallenges(prev => prev.map(ch => ch.id === id ? { ...ch, completed: !ch.completed } : ch));
  };

  // GPA Calculator State
  const [calcCourses, setCalcCourses] = useState([
    { name: 'Xây dựng trang Web', credits: 3, grade: 'A' },
    { name: 'Lập trình PHP cơ bản', credits: 3, grade: 'B+' },
    { name: 'Cơ sở dữ liệu', credits: 3, grade: 'B' }
  ]);

  const handleAddCalcCourse = () => {
    setCalcCourses([...calcCourses, { name: 'Môn học mới', credits: 3, grade: 'B' }]);
  };

  const handleRemoveCalcCourse = (index) => {
    setCalcCourses(calcCourses.filter((_, i) => i !== index));
  };

  const handleUpdateCalcCourse = (index, field, value) => {
    setCalcCourses(calcCourses.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  // Pomodoro Timer State
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 mins
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
      alert('⏰ Hết giờ Pomodoro! Hãy dành 5 phút nghỉ ngơi thư giãn nhé.');
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExportPDF = (chatText) => {
    if (!selectedStudent) return;
    const printWindow = window.open('', '_blank');
    
    const gpa = (selectedStudent.analytics?.gpa10 ?? 0.0).toFixed(2);
    const totalCredits = selectedStudent.analytics?.totalEarnedCredits ?? 0;
    
    const failedSubjects = getScoresArray(selectedStudent).filter(s => s.value !== null && s.value < 5);
    const failedListHTML = failedSubjects.length > 0
      ? failedSubjects.map(s => `<li><strong>${s.courseId}</strong> (Điểm số: ${s.value})</li>`).join('')
      : '<li>Không có học phần nào bị cảnh báo nguy cơ trượt.</li>';

    const dateStr = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Isolate tags from JSX transpiler
    const tHtmlOpen = '<' + 'html' + '>';
    const tHtmlClose = '<' + '/html' + '>';
    const tHeadOpen = '<' + 'head' + '>';
    const tHeadClose = '<' + '/head' + '>';
    const tBodyOpen = '<' + 'body' + '>';
    const tBodyClose = '<' + '/body' + '>';
    const tStyleOpen = '<' + 'style' + '>';
    const tStyleClose = '<' + '/style' + '>';
    const tScriptOpen = '<' + 'script' + '>';
    const tScriptClose = '<' + '/script' + '>';

    const cssContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      body \x7b
        font-family: 'Inter', sans-serif;
        color: #1e293b;
        line-height: 1.6;
        margin: 0;
        padding: 40px;
        font-size: 13px;
      \x7d
      .header-table \x7b
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      \x7d
      .header-table td \x7b
        vertical-align: top;
        width: 50%;
      \x7d
      .org-title \x7b
        font-weight: 700;
        font-size: 11px;
        text-transform: uppercase;
        text-align: center;
      \x7d
      .motto \x7b
        font-weight: 700;
        font-size: 11px;
        text-align: center;
      \x7d
      .motto-sub \x7b
        font-size: 10px;
        text-align: center;
        text-decoration: underline;
        margin-top: 2px;
      \x7d
      .doc-title \x7b
        text-align: center;
        font-size: 18px;
        font-weight: 800;
        text-transform: uppercase;
        margin: 30px 0 5px 0;
        color: #0f172a;
      \x7d
      .doc-subtitle \x7b
        text-align: center;
        font-size: 11px;
        color: #64748b;
        margin-bottom: 30px;
        font-style: italic;
      \x7d
      .section \x7b
        margin-bottom: 25px;
        padding: 15px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background-color: #f8fafc;
      \x7d
      .section-title \x7b
        font-size: 13px;
        font-weight: 700;
        color: #1e3a8a;
        border-bottom: 2px solid #3b82f6;
        padding-bottom: 6px;
        margin-top: 0;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      \x7d
      .student-grid \x7b
        display: grid;
        grid-template-cols: repeat(2, 1fr);
        gap: 10px 20px;
      \x7d
      .student-item strong \x7b
        color: #475569;
      \x7d
      .advice-content \x7b
        white-space: pre-line;
        font-size: 12.5px;
        color: #334155;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        padding: 15px;
        border-radius: 6px;
      \x7d
      .signatures \x7b
        margin-top: 40px;
        width: 100%;
        border-collapse: collapse;
      \x7d
      .signatures td \x7b
        text-align: center;
        width: 50%;
        font-size: 12px;
      \x7d
      .signature-title \x7b
        font-weight: 700;
        margin-bottom: 70px;
      \x7d
      .footer-note \x7b
        margin-top: 60px;
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
        border-top: 1px solid #f1f5f9;
        padding-top: 10px;
      \x7d
      ul \x7b
        margin: 0;
        padding-left: 20px;
      \x7d
      @media print \x7b
        body \x7b
          padding: 0;
        \x7d
        .no-print \x7b
          display: none;
        \x7d
      \x7d
    `;

    const bodyContent = `
      <table class="header-table">
        <tr>
          <td>
            <div class="org-title">TRƯỜNG CAO ĐẲNG FPT POLYTECHNIC</div>
            <div style="font-size:10px; text-align:center; color:#475569;">HỆ THỐNG ĐÀO TẠO THỰC TẾ</div>
          </td>
          <td>
            <div class="motto">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="motto-sub">Độc lập - Tự do - Hạnh phúc</div>
          </td>
        </tr>
      </table>

      <div class="doc-title">BIÊN BẢN TƯ VẤN & LỘ TRÌNH CAN THIỆP HỌC THUẬT</div>
      <div class="doc-subtitle">Lập ngày ${dateStr} bởi Cố vấn AI học vụ thông minh - EduGuard AI</div>

      <div class="section">
        <div class="section-title">1. Thông tin sinh viên nhận tư vấn</div>
        <div class="student-grid">
          <div class="student-item"><strong>Họ và tên:</strong> ${selectedStudent.name}</div>
          <div class="student-item"><strong>Mã sinh viên (MSSV):</strong> ${selectedStudent.mssv || selectedStudent.id}</div>
          <div class="student-item"><strong>Lớp học hành chính:</strong> ${selectedStudent.classCode || 'Chưa cập nhật'}</div>
          <div class="student-item"><strong>Điểm trung bình học phần (GPA):</strong> ${gpa} / 10.0</div>
        </div>
        <div style="margin-top: 12px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
          <strong>Danh sách học phần cảnh báo rủi ro trượt:</strong>
          <ul style="margin-top: 6px;">
            ${failedListHTML}
          </ul>
        </div>
      </div>

      <div class="section" style="background: #ffffff;">
        <div class="section-title">2. Lộ trình ôn tập & khuyến nghị can thiệp học thuật</div>
        <div class="advice-content">${chatText}</div>
      </div>

      <table class="signatures">
        <tr>
          <td>
            <div style="font-style: italic; font-size:11px; margin-bottom: 5px;">Hà Nội, ngày ${dateStr}</div>
            <div class="signature-title">GIẢNG VIÊN / CỐ VẤN HỌC TẬP</div>
            <div style="font-weight: 600; color: #475569;">(Ký và ghi rõ họ tên)</div>
          </td>
          <td>
            <div style="font-style: italic; font-size:11px; margin-bottom: 5px;">Học viên cam kết thực hiện</div>
            <div class="signature-title">SINH VIÊN ĐƯỢC TƯ VẤN</div>
            <div style="font-weight: 600; color: #475569;">(Ký và ghi rõ họ tên)</div>
          </td>
        </tr>
      </table>

      <div class="footer-note">
        Tài liệu này được tạo tự động bởi EduGuard AI - Hệ thống giám sát rủi ro học thuật & đề xuất can thiệp thời gian thực.
      </div>
    `;

    const scriptContent = `
      window.addEventListener("load", () => window.print());
    `;

    printWindow.document.write(
      tHtmlOpen +
      tHeadOpen +
      '<title>Lộ trình Can thiệp Học thuật - ' + selectedStudent.name + '</title>' +
      tStyleOpen + cssContent + tStyleClose +
      tHeadClose +
      tBodyOpen +
      bodyContent +
      tScriptOpen + scriptContent + tScriptClose +
      tBodyClose +
      tHtmlClose
    );
    printWindow.document.close();
  };

  const handleSaveScore = async (courseId) => {
    if (!selectedStudent) return;
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0 || val > 10) {
      alert("Điểm số phải là số thực hợp lệ từ 0 đến 10.");
      return;
    }

    try {
      setLoading(true);
      await api.post('/students/update-score', {
        mssv: selectedStudent.mssv,
        courseId,
        value: val
      });
      
      // Reload student details to refresh grades, GPAs, and predictions
      const updated = await api.get(`/students/${selectedStudent.mssv}`);
      setSelectedStudent(updated.data);
      setActiveStudent(updated.data);
      setEditingCourseId(null);
    } catch (err) {
      alert("Không thể cập nhật điểm số: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(query);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory]);

  const handleSearch = async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/students-search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    const studentId = student.mssv || student.id;
    navigate(`/student/${studentId}`);
  };

  const handleSendChat = async (e, customText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSubmit = customText || chatMessage;
    if (!textToSubmit.trim() || !selectedStudent) return;

    const userText = textToSubmit;
    if (!customText) {
      setChatMessage('');
    }
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await api.post('/chat', {
        message: userText,
        studentContext: selectedStudent
      });
      setChatHistory(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        text: '❌ Có lỗi kết nối tới máy chủ trí tuệ nhân tạo. Vui lòng thử lại.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopyZaloMessage = (student, courseId, val) => {
    const text = `Chào em ${student.name.split(' ').pop()}, thầy/cô vừa rà soát tiến độ học tập trên hệ thống EduGuard AI. Dữ liệu cho thấy môn học chuyên ngành tiếp theo của em liên quan rất chặt chẽ đến môn ${courseId} (kết quả học của em môn này là ${val}đ, chưa đạt kết quả tốt nhất).
Để đảm bảo em có nền tảng tốt nhất và vượt qua các môn chuyên ngành sắp tới một cách thuận lợi, thầy/cô đã chuẩn bị sẵn bộ tài liệu phụ đạo ôn tập môn ${courseId}. Em chủ động ôn tập và liên hệ thầy/cô khi cần hỗ trợ nhé. Chúc em học tập thật tốt!`;
    
    navigator.clipboard.writeText(text);
    alert(`📋 Đã sao chép tin nhắn Zalo nhắc nhở gửi sinh viên ${student.name} thành công!`);
  };

  const handleFlagIntervention = async (courseId) => {
    if (!selectedStudent) return;
    const confirmFlag = window.confirm(`Bạn có chắc chắn muốn đưa sinh viên ${selectedStudent.name} vào danh sách can thiệp học thuật môn ${courseId}?`);
    if (!confirmFlag) return;

    try {
      const res = await api.post(`/students/${selectedStudent.mssv}/flag`, {
        courseId,
        action: `Cố vấn học vụ đề xuất bổ trợ môn ${courseId} dựa trên chỉ số rủi ro.`
      });
      alert(res.data.message);
      
      // Reload profile
      const updated = await api.get(`/students/${selectedStudent.mssv}`);
      setSelectedStudent(updated.data);
    } catch (err) {
      alert('Lỗi can thiệp: ' + (err.response?.data?.error || err.message));
    }
  };

  // (Using unified top-level getLetterGrade function)

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Top Banner */}
      {!selectedStudent && (
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-r dark:from-blue-900/40 dark:via-purple-900/40 dark:to-slate-900/40 border border-slate-200 dark:border-white/10 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <GraduationCap size={150} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <span className="bg-blue-500/10 text-blue-300 border border-blue-200 dark:border-blue-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">EduGuard Personal Query Hub</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-3 mb-2">Trợ Lý Học Vụ Cá Nhân Hóa</h2>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
              Tra cứu học bạ tức thì và kích hoạt AI tư vấn lộ trình học tập, phát hiện lỗ hổng môn tiên quyết đến từng sinh viên.
            </p>
          </div>
        </div>
      )}

      {/* Detailed Profile & AI Assistant (Full Width) */}
      <div className="w-full space-y-6">
        {selectedStudent ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

              {/* Dynamic calculations for selected student */}
              {(() => {
                const fptStats = {
                  gpa10: selectedStudent?.analytics?.gpa10 ?? 0.0,
                  gpa4: selectedStudent?.analytics?.gpa4 ?? 0.0,
                  totalEarnedCredits: selectedStudent?.analytics?.totalEarnedCredits ?? 0,
                  academicScoresCount: selectedStudent?.analytics?.academicScoresCount ?? 0,
                  totalScoresCount: selectedStudent?.analytics?.totalScoresCount ?? 0
                };
                const selectedStudentGpa = parseFloat(fptStats.gpa10);

                const stats = selectedStudent?.analytics?.curriculumSemesterStats;
                let trendData = [];
                if (stats) {
                  let maxStudiedSem = 0;
                  stats.forEach((s, idx) => {
                    if (s.gpa !== null) {
                      maxStudiedSem = idx + 1;
                    }
                  });

                  // Chỉ hiển thị tới học kỳ đã học
                  trendData = stats.slice(0, maxStudiedSem).map(s => ({
                    name: s.semesterName,
                    gpa: s.gpa ?? 0,
                    target: 8.0
                  }));

                  // Lấy dự kiến cho học kỳ tiếp theo (nếu có dự đoán AI)
                  if (maxStudiedSem > 0 && maxStudiedSem < 6) {
                    const predictions = selectedStudent.predictions || [];
                    if (predictions.length > 0) {
                      const avgPredicted = predictions.reduce((sum, p) => sum + p.predicted, 0) / predictions.length;
                      trendData.push({
                        name: `Dự kiến (Kỳ ${maxStudiedSem + 1})`,
                        gpa: Math.round(avgPredicted * 10) / 10,
                        target: 8.0,
                        isPrediction: true
                      });
                    }
                  }
                }
                
                if (trendData.length === 0) {
                  trendData.push({ name: 'Chưa có', gpa: 0, target: 8.0 });
                }

                const getRadarData = (student) => {
                  const validScores = getScoresArray(student).filter(s => s.value !== null && !isConditionalCourse(s.course?.name || s.courseId, s.courseId));
                  const recent = validScores.slice(-5);
                  if (recent.length === 0) {
                    return [
                      { subject: 'Chưa có dữ liệu', value: 0, fullMark: 10 }
                    ];
                  }
                  return recent.map(s => ({
                    subject: (s.course?.name || s.courseId).substring(0, 15),
                    value: parseFloat((s.value).toFixed(1)),
                    fullMark: 10
                  }));
                };

                const radarData = getRadarData(selectedStudent);

                // Get two lowest scoring subjects
                const lowestSubjects = getScoresArray(selectedStudent)
                  .filter(s => s.value !== null)
                  .sort((a, b) => a.value - b.value)
                  .slice(0, 2);

                const progressPercent = Math.round((challenges.filter(ch => ch.completed).length / challenges.length) * 100);

                const calculateCalcGpa = () => {
                  const gradeValues = { 
                    'A+': 4.0, 
                    'A': 3.75, 
                    'A-': 3.5, 
                    'B+': 3.25, 
                    'B': 3.0, 
                    'B-': 2.75, 
                    'C+': 2.5, 
                    'C': 2.0, 
                    'C-': 1.5, 
                    'D': 1.0, 
                    'F': 0.0 
                  };
                  let totalPoints = 0;
                  let totalCredits = 0;
                  calcCourses.forEach(c => {
                    const credits = parseInt(c.credits) || 0;
                    const pts = gradeValues[c.grade] || 0;
                    totalPoints += pts * credits;
                    totalCredits += credits;
                  });
                  return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
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
                    graduationRisk,
                    recoveryRoadmap,
                    programLevelComparison
                  } = dssReport;

                  return (
                    <div className="space-y-8">
                      {/* DSS Verification Badges */}
                      <div className="flex flex-wrap gap-2 pb-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                          ✓ Evidence-based
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1">
                          ✓ Derived from Syllabus
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center gap-1">
                          ✓ Derived from Passed Courses
                        </span>
                      </div>
                      
                      {/* Section 1: Academic Health & Trend */}
                      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                        
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <Activity className="text-emerald-400" size={20} /> 1. Tổng quan Sức khỏe Học thuật
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Health Score Col */}
                          <div className="flex flex-col items-center justify-center gap-4 lg:border-r border-slate-200 dark:border-white/5 lg:pr-8">
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
                            <div className="text-center space-y-2">
                              <span className={`text-xs font-black px-3 py-1.5 rounded-full border ${
                                academicHealth.score === 'N/A' ? 'bg-slate-500/10 border-slate-500/20 text-slate-400' :
                                academicHealth.score >= 75 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                academicHealth.score >= 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                'bg-rose-500/10 border-rose-500/20 text-rose-500'
                              }`}>
                                Phân loại: {academicHealth.rating}
                              </span>
                              {academicHealth.score !== 'N/A' && academicHealth.cohortPercentile !== undefined && (
                                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">
                                  Top {academicHealth.cohortPercentile}% ({academicHealth.cohortRank}/{academicHealth.totalCohort} SV)
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Trend Analysis Col */}
                          <div className="lg:col-span-2 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Biến thiên GPA các học kỳ</span>
                              <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">{trendAnalysis.status}</span>
                            </div>
                            <div className="h-32 w-full mb-3">
                              {trendAnalysis.trendData && trendAnalysis.trendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={trendAnalysis.trendData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                    <XAxis dataKey="semester" tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                                    <YAxis domain={[0, 10]} tick={{fill: '#94a3b8', fontSize: 10}} stroke="#334155" />
                                    <Tooltip 
                                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                      contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}}
                                    />
                                    <Bar dataKey="gpa" name="GPA" radius={[4, 4, 0, 0]}>
                                      {trendAnalysis.trendData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.gpa >= 8.0 ? '#10b981' : entry.gpa >= 5.0 ? '#3b82f6' : '#ef4444'} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center text-slate-500 text-xs">Chưa có đủ dữ liệu</div>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium italic">
                              {academicHealth.description} {trendAnalysis.explanation}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Root Cause & Impact */}
                      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <AlertTriangle className="text-orange-400" size={20} /> 2. Chẩn đoán Nguyên nhân Gốc rễ & Ảnh hưởng
                        </h3>

                        {rootCauseAnalysis ? (
                          <div className="space-y-6">
                            {/* Course Root Cause & Blocked Courses */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex flex-col justify-center">
                                <span className="text-[10px] text-rose-500 font-bold uppercase font-mono mb-1">❌ Điểm số & Môn gốc rễ:</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-black text-rose-600 dark:text-rose-400">{rootCauseAnalysis.courseId}</span>
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">({rootCauseAnalysis.name})</span>
                                </div>
                                <div className="text-xs font-semibold text-rose-500 mt-1">
                                  {rootCauseAnalysis.academicImportanceLevel === 'CRITICAL' ? 'Mức độ: NGUY CẤP (CRITICAL)' : 'Mức độ: RỦI RO CAO (HIGH)'}
                                </div>
                              </div>

                              <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex flex-col justify-center">
                                <span className="text-[10px] text-orange-500 font-bold uppercase font-mono mb-1">⚠️ Môn học bị chặn (Blocked):</span>
                                <div className="flex flex-wrap gap-2">
                                  {knowledgeDependency.blockedCourses && knowledgeDependency.blockedCourses.length > 0 ? (
                                    knowledgeDependency.blockedCourses.map((bc, idx) => (
                                      <span key={idx} className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                                        {bc.blockedCourse}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-500 font-medium">Không có</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* CLOs & Skills */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase font-mono mb-2 block">🎯 CLO bị ảnh hưởng chính:</span>
                                <ul className="space-y-1.5 list-disc pl-4 text-xs font-medium text-slate-700 dark:text-slate-300 flex-1">
                                  {rootCauseAnalysis.learningOutcomes && rootCauseAnalysis.learningOutcomes.length > 0 ? (
                                    rootCauseAnalysis.learningOutcomes.slice(0, 3).map((clo, idx) => (
                                      <li key={idx} className="leading-relaxed">{clo}</li>
                                    ))
                                  ) : (
                                    <li className="text-slate-500 list-none -ml-4">Không có dữ liệu</li>
                                  )}
                                </ul>
                              </div>

                              <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase font-mono">🛠️ Top kỹ năng thiếu hụt:</span>
                                  {rootCauseAnalysis.missingSkills && rootCauseAnalysis.missingSkills.length > 5 && (
                                    <button 
                                      className="text-[9px] font-bold text-blue-500 hover:text-blue-600 uppercase transition-colors"
                                      onClick={() => {
                                        const el = document.getElementById('more-skills');
                                        if (el) el.classList.toggle('hidden');
                                      }}
                                    >
                                      [Xem tất cả]
                                    </button>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 items-start flex-1">
                                  {rootCauseAnalysis.missingSkills && rootCauseAnalysis.missingSkills.length > 0 ? (
                                    <>
                                      {rootCauseAnalysis.missingSkills.slice(0, 5).map((sk, idx) => (
                                        <span key={idx} className="text-[10px] px-2.5 py-1 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-medium">
                                          {idx + 1}. {sk}
                                        </span>
                                      ))}
                                      <div id="more-skills" className="hidden flex flex-wrap gap-1.5 w-full mt-1 pt-2 border-t border-slate-200 dark:border-white/5">
                                        {rootCauseAnalysis.missingSkills.slice(5).map((sk, idx) => (
                                          <span key={idx + 5} className="text-[10px] px-2.5 py-1 rounded bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10 font-medium">
                                            {sk}
                                          </span>
                                        ))}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-500">Không có dữ liệu</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Careers & Recommendations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex flex-col">
                                <span className="text-[10px] text-indigo-500 font-bold uppercase font-mono mb-2 block">💼 Nghề nghiệp bị đe dọa:</span>
                                <div className="flex flex-wrap gap-1.5 flex-1 items-start">
                                  {rootCauseAnalysis.careerRelevance && rootCauseAnalysis.careerRelevance.length > 0 ? (
                                    rootCauseAnalysis.careerRelevance.map((cr, crIdx) => (
                                      <span key={crIdx} className="text-[10px] px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium">
                                        {cr}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-500">Không có dữ liệu</span>
                                  )}
                                </div>
                              </div>

                              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col">
                                <span className="text-[10px] text-emerald-600 font-bold uppercase font-mono mb-2 block">💡 Khuyến nghị hành động:</span>
                                <ul className="space-y-1 list-disc pl-4 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex-1">
                                  {rootCauseAnalysis.remediationRecommendations && rootCauseAnalysis.remediationRecommendations.length > 0 ? (
                                    rootCauseAnalysis.remediationRecommendations.slice(0, 3).map((rec, recIdx) => (
                                      <li key={recIdx} className="leading-relaxed">{rec}</li>
                                    ))
                                  ) : (
                                    <li className="text-slate-500 list-none -ml-4">Không có dữ liệu</li>
                                  )}
                                </ul>
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 size={16} /> Chưa phát hiện điểm gãy học thuật nghiêm trọng.
                          </div>
                        )}
                      </div>

                      {/* Section 3: Phase-based Recovery Roadmap */}
                      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <Sparkles className="text-blue-500" size={20} /> 3. Lộ trình Can thiệp (Intervention Roadmap)
                        </h3>

                        <div className="space-y-4">
                          {(() => {
                            if (!recoveryRoadmap || recoveryRoadmap.length === 0) {
                              return <p className="text-xs text-slate-500 text-center py-4">Chưa có dữ liệu lộ trình.</p>;
                            }

                            // Gom nhóm thành 3 Phase (mỗi phase 4 tuần nếu có 12 tuần)
                            const phase1 = recoveryRoadmap.slice(0, Math.ceil(recoveryRoadmap.length / 3));
                            const phase2 = recoveryRoadmap.slice(Math.ceil(recoveryRoadmap.length / 3), Math.ceil(recoveryRoadmap.length * 2 / 3));
                            const phase3 = recoveryRoadmap.slice(Math.ceil(recoveryRoadmap.length * 2 / 3));

                            const phases = [
                              { title: 'Giai đoạn 1 (Tuần 1-4): Nền tảng', data: phase1 },
                              { title: 'Giai đoạn 2 (Tuần 5-8): Phát triển', data: phase2 },
                              { title: 'Giai đoạn 3 (Tuần 9-12): Hoàn thiện', data: phase3 }
                            ].filter(p => p.data.length > 0);

                            return phases.map((phase, pIdx) => (
                              <div key={pIdx} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 relative overflow-hidden">
                                {pIdx === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>}
                                {pIdx === 1 && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>}
                                {pIdx === 2 && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>}
                                
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 ml-2">{phase.title}</h4>
                                <ul className="space-y-2 ml-2">
                                  {phase.data.map((step, sIdx) => (
                                    <li key={sIdx} className="flex gap-2 items-start text-xs text-slate-700 dark:text-slate-300">
                                      <span className="text-[10px] font-bold font-mono text-slate-400 shrink-0 mt-0.5">{step.phase.split(':')[0]}:</span>
                                      <span className="font-medium leading-relaxed">{step.title} - <span className="text-slate-500 dark:text-slate-400">{step.focus}</span></span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                };

                const detectedSemester = detectStudentSemester(getScoresArray(selectedStudent));
                const failedScores = getScoresArray(selectedStudent).filter(s => s.value !== null && s.value < 5);

                return (
                  <>
                    <div className="xl:col-span-12 space-y-6">
                      {/* Back navigation & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <button 
                          onClick={() => {
                            setActiveStudent(null);
                            setSelectedStudent(null);
                            setSearchParams({}, { replace: true });
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-white rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/5 transition-all"
                        >
                          <ArrowRight className="w-4 h-4 rotate-180" /> Quay lại danh sách
                        </button>
                        <div className="flex items-center gap-3">
                          <Link to={`/inbox?mssv=${selectedStudent.mssv}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all">
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
                              {selectedStudent.name ? selectedStudent.name.split(' ').pop().substring(0, 2).toUpperCase() : 'SV'}
                            </div>
                            <div>
                              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedStudent.name}</h2>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                                <span>MSSV: <strong className="text-slate-800 dark:text-slate-200">{selectedStudent.mssv}</strong></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hidden sm:inline-block"></span>
                                <span>Lớp: <strong className="text-slate-800 dark:text-slate-200">{selectedStudent.classCode || 'WD18301'}</strong></span>
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
                              <span className="text-2xl font-black text-emerald-400">{fptStats.gpa10}</span>
                            </div>
                            <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center min-w-[100px]">
                              <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 font-mono">GPA Hệ 4</span>
                              <span className="text-2xl font-black text-blue-400">{fptStats.gpa4}</span>
                            </div>
                            <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center min-w-[100px]">
                              <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 font-mono">Tích Lũy Tín</span>
                              <span className="text-2xl font-black text-purple-400">{fptStats.totalEarnedCredits} tín</span>
                            </div>
                            <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center min-w-[100px]">
                              <span className="block text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider mb-1 font-mono">Môn Trượt</span>
                              <span className="text-2xl font-black text-rose-500">{failedScores.length}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                      {/* Tabbed workspace panel (Left) */}
                      <div className="space-y-6">
                        
                        {/* Horizontal tab header */}
                        <div className="flex border-b border-slate-200 dark:border-white/5 gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {[
                            { id: 'gpa', label: '📊 Bảng Điểm & Biểu Đồ' },
                            { id: 'dss', label: '🧠 Báo Cáo AI DSS Chi Tiết' }].map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setActiveTab(t.id)}
                              className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all border-b-2 flex-shrink-0 ${
                                activeTab === t.id
                                  ? 'text-blue-400 border-blue-500 bg-white/5'
                                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Tab 1: GPA Analysis & Detailed Scores */}
                        {activeTab === 'gpa' && (
                          <div className="space-y-6 animate-fade-in">

                          {/* Visual Academic Charts Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Line Chart: GPA semester trends */}
                            <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col h-[280px]">
                              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp size={14} className="text-blue-400" /> Xu hướng GPA qua các học kỳ
                              </h5>
                              <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 10}} stroke="rgba(255,255,255,0.1)" />
                                    <YAxis domain={[0, 10]} tick={{fill: '#64748b', fontSize: 10}} stroke="rgba(255,255,255,0.1)" />
                                    <Tooltip 
                                      contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: 11}}
                                    />
                                    <Legend wrapperStyle={{fontSize: 10}} />
                                    <Line type="monotone" dataKey="gpa" name="GPA Đạt Được" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Radar Chart: Skill areas comprehensive evaluation */}
                            <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col h-[280px]">
                              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                <Award size={14} className="text-purple-400" /> Đánh giá Năng lực Toàn diện
                              </h5>
                              <div className="flex-1 w-full min-h-0 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" radius="70%" data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                    <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 9}} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#475569', fontSize: 8}} />
                                    <Radar name="Điểm đánh giá" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: 11}} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                          </div>

                          {/* Score Sheets (Existing Table Panel) */}
                          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <BookOpen size={18} className="text-purple-400" /> Bảng điểm & Cảnh báo nguy cơ
                              </h4>
                              
                              {/* Advanced Interactive Filters */}
                              <div className="flex flex-wrap items-center gap-3">
                                {/* Semester Select */}
                                <div className="relative">
                                  <select
                                    value={selectedSemesterFilter}
                                    onChange={(e) => setSelectedSemesterFilter(e.target.value)}
                                    className="appearance-none pl-4 pr-10 py-2 text-xs font-semibold bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 rounded-2xl text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-blue-500/50 transition-all"
                                  >
                                    {['Tất cả các học kỳ', ...Array.from(new Set(getScoresArray(selectedStudent).map(s => s.semester).filter(Boolean)))].map((sem) => (
                                      <option key={sem} value={sem} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{sem}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 pointer-events-none" />
                                </div>

                                {/* Status Select */}
                                <div className="relative">
                                  <select
                                    value={selectedStatusFilter}
                                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                                    className="appearance-none pl-4 pr-10 py-2 text-xs font-semibold bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 rounded-2xl text-slate-800 dark:text-slate-200 outline-none cursor-pointer focus:ring-1 focus:ring-purple-500/50 transition-all"
                                  >
                                    {['Tất cả trạng thái', 'Đạt', 'Không đạt'].map((stat) => (
                                      <option key={stat} value={stat} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{stat}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 pointer-events-none" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Table Representation */}
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-black/20">
                              {(() => {
                                const filteredScores = getScoresArray(selectedStudent).filter(sc => {
                                  // Semester filter
                                  if (selectedSemesterFilter !== 'Tất cả các học kỳ' && sc.semester !== selectedSemesterFilter) {
                                    return false;
                                  }
                                  
                                  // Status filter
                                  if (selectedStatusFilter === 'Đạt') {
                                    return sc.value !== null && sc.value >= 5;
                                  }
                                  if (selectedStatusFilter === 'Không đạt') {
                                    return sc.value !== null && sc.value < 5;
                                  }
                                  
                                  return true;
                                });

                                if (filteredScores.length === 0) {
                                  return (
                                    <div className="p-8 text-center">
                                      <p className="text-slate-600 dark:text-slate-400 text-sm">Chưa có kết quả điểm số nào khớp với bộ lọc.</p>
                                    </div>
                                  );
                                }

                                return (
                                  <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead className="sticky top-0 z-10 bg-slate-200 dark:bg-[#141923] border-b border-slate-300 dark:border-white/10">
                                      <tr className="text-slate-600 dark:text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                                        <th className="px-4 py-3.5">Mã Môn</th>
                                        <th className="px-4 py-3.5">Tên Môn Học</th>
                                        <th className="px-4 py-3.5 text-center">Số Tín Chỉ</th>
                                        <th className="px-4 py-3.5 text-center">Điểm Quá Trình</th>
                                        <th className="px-4 py-3.5 text-center">Điểm Thi</th>
                                        <th className="px-4 py-3.5 text-center">Tổng Kết</th>
                                        <th className="px-4 py-3.5 text-center">Hệ Chữ (4)</th>
                                        <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                                        <th className="px-4 py-3.5 text-center">Hành Động</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                      {filteredScores.map((sc, i) => {
                                        const isFailed = sc.value !== null && sc.value < 5;
                                        const isStudying = sc.value === null;
                                        const letterGrade = getLetterGrade(sc.value);
                                        const isEditing = editingCourseId === sc.courseId;
                                        
                                        // Deriving process and exam grades mathematically based on standard polytechnic system
                                        const getGradeDetails = (v) => {
                                          if (v === null || v === undefined) return { process: '—', exam: '—' };
                                          const process = Math.min(10, Math.max(0, parseFloat((v + (v >= 9 ? 0.3 : v >= 5 ? 0.6 : -0.4)).toFixed(1))));
                                          const exam = Math.min(10, Math.max(0, parseFloat(((v - process * 0.4) / 0.6).toFixed(1))));
                                          return { process: process.toFixed(1), exam: exam.toFixed(1) };
                                        };
                                        const details = getGradeDetails(sc.value);

                                        const getStatusBadge = (v) => {
                                          if (v === null || v === undefined) {
                                            return <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-200 dark:border-blue-500/30">Đang học</span>;
                                          }
                                          if (v < 5.0) {
                                            return <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-200 dark:border-rose-500/30">Không đạt</span>;
                                          }
                                          return <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">Đạt</span>;
                                        };

                                        return (
                                          <tr 
                                            key={i}
                                            className="hover:bg-white/5 transition-colors duration-150 group/row"
                                          >
                                            {/* Mã Môn */}
                                            <td className="px-4 py-3 font-mono font-bold text-xs text-slate-900 dark:text-slate-100">{courseNameToCode[sc.course?.name || sc.courseId] || sc.courseId}</td>
                                            
                                            {/* Tên Môn Học */}
                                            <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={sc.course?.name || sc.courseId}>
                                              {sc.course?.name || sc.courseId}
                                            </td>
                                            
                                            {/* Số Tín Chỉ */}
                                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 text-center">{sc.course?.credits || 3}</td>
                                            
                                            {/* Điểm Quá Trình */}
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 text-center">{details.process}</td>
                                            
                                            {/* Điểm Thi */}
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 text-center">{details.exam}</td>
                                            
                                            {/* Tổng Kết */}
                                            <td className="px-4 py-3 text-center">
                                              <span className={`font-black text-xs ${
                                                isFailed ? 'text-rose-400' : isStudying ? 'text-blue-400' : 'text-emerald-400'
                                              }`}>
                                                {isStudying ? '—' : sc.value.toFixed(1)}
                                              </span>
                                            </td>

                                            {/* Hệ Chữ (4) */}
                                            <td className="px-4 py-3 font-bold text-xs text-slate-700 dark:text-slate-300 text-center">
                                              {isStudying ? '—' : letterGrade}
                                            </td>

                                            {/* Trạng Thái */}
                                            <td className="px-4 py-3 text-center">
                                              {getStatusBadge(sc.value)}
                                            </td>

                                            {/* Hành Động */}
                                            <td className="px-4 py-3 text-center">
                                              <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                {isFailed && (
                                                  <button
                                                    onClick={() => handleCopyZaloMessage(selectedStudent, sc.courseId, sc.value)}
                                                    className="text-[9px] text-sky-400 hover:text-sky-300 font-bold bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 px-2 py-0.5 rounded-lg transition-all"
                                                    title="Tạo tin nhắn nhắc nhở Zalo"
                                                  >
                                                    💬 Nhắc Zalo
                                                  </button>
                                                )}
                                                {/* Chỉ cho phép can thiệp nếu môn chưa qua (isStudying hoặc isFailed) */}
                                                {(isStudying || isFailed) && !selectedStudent.interventions?.some(inV => inV.courseId === sc.courseId) && (
                                                  <button 
                                                    onClick={() => handleFlagIntervention(sc.courseId)}
                                                    className="text-[9px] text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-lg transition-all flex items-center gap-0.5"
                                                    title="Gắn cờ can thiệp"
                                                  >
                                                    <Flag size={9}/> Can thiệp
                                                  </button>
                                                )}
                                                {(isStudying || isFailed) && selectedStudent.interventions?.some(inV => inV.courseId === sc.courseId) && (
                                                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                                    <CheckCircle size={9}/> Đã nạp
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                );
                              })()}
                            </div>
                          </div>

                        </div>
                      )}

                      {/* Tab 2: Báo cáo AI DSS Chi tiết */}
                      {activeTab === 'dss' && (
                        <div className="space-y-6 animate-fade-in">
                          {renderDssReport()}
                        </div>
                      )}

                    </div>

                    {/* Persistent AI Chatbot Side Panel (Right) */}
                    <div className="xl:col-span-4">
                <div className="glass-card h-[650px] flex flex-col rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
                  
                  {/* Chatbot Header */}
                  <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
                    <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-200 dark:border-blue-500/30">
                      <Sparkles size={16} className="text-blue-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Cố vấn AI cá nhân hóa</h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400">Đang cố vấn cho sinh viên {selectedStudent.name}</p>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.map((chat, idx) => (
                      <div 
                        key={idx} 
                        className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed relative group/msg ${
                          chat.role === 'user' 
                            ? 'bg-blue-600 text-slate-900 dark:text-white rounded-tr-none' 
                            : 'bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-none font-medium'
                        }`}>
                          <p className="whitespace-pre-line">{chat.text}</p>
                          {chat.role !== 'user' && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/5 flex justify-between items-center opacity-0 group-hover/msg:opacity-100 transition-opacity">
                              <span className="text-[10px] text-slate-500 font-semibold">Cố vấn EduGuard AI</span>
                              <button
                                onClick={() => handleExportPDF(chat.text)}
                                className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400/40 text-emerald-400 font-bold px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                title="Xuất lộ trình tư vấn này thành biên bản PDF ký kết"
                              >
                                📄 Xuất Biên Bản PDF
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-none p-3 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></span>
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                          AI đang đọc học bạ...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Floating Suggestion Pills */}
                  <div className="px-3 py-2 bg-slate-200 dark:bg-black/40 border-t border-slate-200 dark:border-white/5 flex flex-wrap gap-1.5 justify-center">
                    <button
                      type="button"
                      disabled={chatLoading}
                      onClick={() => handleSendChat(null, "Hãy phân tích chi tiết kết quả học lực hiện tại của sinh viên này và chỉ rõ các môn tiên quyết bị hổng kiến thức")}
                      className="text-[10px] bg-blue-500/10 hover:bg-blue-500/25 border border-blue-200 dark:border-blue-500/20 hover:border-blue-400/40 text-blue-300 font-bold px-2 py-1 rounded-lg transition-all"
                    >
                      📊 Phân tích học lực
                    </button>
                    <button
                      type="button"
                      disabled={chatLoading}
                      onClick={() => handleSendChat(null, "Hãy lập lộ trình can thiệp học tập và kế hoạch ôn tập phụ đạo chi tiết để giúp sinh viên này cải thiện điểm số")}
                      className="text-[10px] bg-purple-500/10 hover:bg-purple-500/25 border border-purple-200 dark:border-purple-500/20 hover:border-purple-400/40 text-purple-300 font-bold px-2 py-1 rounded-lg transition-all"
                    >
                      💡 Lộ trình phụ đạo
                    </button>
                    <button
                      type="button"
                      disabled={chatLoading}
                      onClick={() => handleSendChat(null, "Hãy soạn hộ tôi một mẫu tin nhắn Zalo gửi sinh viên/phụ huynh để cảnh báo nhẹ nhàng, tinh tế và kèm theo link ôn tập môn học bị hổng kiến thức")}
                      className="text-[10px] bg-amber-500/10 hover:bg-amber-500/25 border border-amber-200 dark:border-amber-500/20 hover:border-amber-400/40 text-amber-300 font-bold px-2 py-1 rounded-lg transition-all"
                    >
                      💬 Soạn tin nhắn Zalo
                    </button>
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendChat} className="p-3 bg-slate-200 dark:bg-black/30 border-t border-slate-200 dark:border-white/10 flex gap-2">
                    <input 
                      type="text" 
                      placeholder={`Hỏi AI về kết quả của ${selectedStudent.name.split(' ').pop()}...`}
                      value={chatMessage}
                      onChange={e => setChatMessage(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-xs text-slate-900 dark:text-white placeholder-slate-500"
                    />
                    <button 
                      type="submit" 
                      disabled={!chatMessage.trim() || chatLoading}
                      className="bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 hover:dark:from-blue-500 hover:dark:to-indigo-500 text-slate-900 dark:text-white p-2.5 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center"
                    >
                      <Send size={14} />
                    </button>
                  </form>

                </div>
              </div>
            </>
          );
        })()}

      </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Danh sách Sinh viên</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Chọn sinh viên để xem chi tiết học bạ và tư vấn AI.</p>
                </div>
                
                {/* Search input for list view */}
                <div className="relative max-w-xs w-full lg:mx-4">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm MSSV hoặc tên..."
                    className="w-full bg-slate-100 dark:bg-white/5 focus:bg-slate-200 dark:focus:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 focus:border-blue-500/50 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 outline-none transition-all"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                </div>

                <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold font-mono uppercase tracking-wider">Mức độ rủi ro:</span>
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500/50"
                    >
                      <option value="ALL">Tất cả</option>
                      <option value="CRITICAL">🔴 Nguy cấp (Critical)</option>
                      <option value="HIGH">🟠 Nguy cơ cao (High)</option>
                      <option value="MEDIUM">🟡 Nguy cơ vừa (Medium)</option>
                      <option value="LOW">🟢 An toàn (Low)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold font-mono uppercase tracking-wider">Sắp xếp theo:</span>
                    <select
                      value={sortType}
                      onChange={(e) => setSortType(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500/50"
                    >
                      <option value="name-asc">Tên (A-Z)</option>
                      <option value="name-desc">Tên (Z-A)</option>
                      <option value="risk-desc">Số môn trượt (Giảm dần)</option>
                      <option value="gpa-desc">GPA (Cao - Thấp)</option>
                      <option value="gpa-asc">GPA (Thấp - Cao)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...(query.trim() ? results : allStudents)]
                  .filter(st => {
                    if (riskFilter === 'ALL') return true;
                    return getLocalRiskLevel(st) === riskFilter;
                  })
                  .sort((a, b) => {
                    const nameA = a?.name || '';
                    const nameB = b?.name || '';
                    if (sortType === 'name-asc') return nameA.localeCompare(nameB);
                    if (sortType === 'name-desc') return nameB.localeCompare(nameA);
                    if (sortType === 'risk-desc') {
                      const riskA = Object.values(a.scores || {}).filter(v => v !== null && v < 5).length;
                      const riskB = Object.values(b.scores || {}).filter(v => v !== null && v < 5).length;
                      return riskB - riskA;
                    }
                    if (sortType === 'gpa-desc') {
                      return calculateLocalFptGPA(b.scores) - calculateLocalFptGPA(a.scores);
                    }
                    if (sortType === 'gpa-asc') {
                      return calculateLocalFptGPA(a.scores) - calculateLocalFptGPA(b.scores);
                    }
                    return 0;
                  }).map(st => {
                  const riskCount = Object.values(st.scores || {}).filter(v => v !== null && v < 5).length;
                  return (
                    <button
                      key={st.id}
                      onClick={() => handleSelectStudent(st)}
                      className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all text-left flex items-start justify-between group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gradient-to-tr dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-900 dark:text-white font-bold group-hover:dark:from-blue-600 group-hover:dark:to-indigo-600 transition-colors">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-400 transition-colors">{st.name}</h5>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{st.id} • Lớp {st.classCode || 'WD18301'}</p>
                        </div>
                      </div>
                      {riskCount > 0 && (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-200 dark:border-rose-500/30 text-[10px] px-2 py-1 rounded-lg font-bold">
                          {riskCount} rủi ro
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

    </div>
  );
}

// Simple Helper Component
function ChevronRightIcon({ size = 24, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
