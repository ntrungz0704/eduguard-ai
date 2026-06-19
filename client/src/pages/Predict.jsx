import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { api, requestWithRestartRetry } from '../lib/api';
import { 
  UploadCloud, Activity, Zap, CheckCircle, Brain, Target, 
  Info, AlertTriangle, HeartHandshake, XCircle, Save, Database,
  TrendingUp, HelpCircle, Loader2
} from 'lucide-react';

// Core FPT Polytechnic subjects filter for compact matrix layout
const CORE_SUBJECTS_FILTER = [
  "Nhập môn lập trình",
  "Cơ sở dữ liệu",
  "Lập trình Javascript nâng cao",
  "NodeJS & Restful Web Service",
  "Lập trình Front-End Framework 1",
  "Lập trình Front-End Framework 2",
  "Dự án 1",
  "Dự án tốt nghiệp"
];

// Helper to abbreviate subject names for table headers
const getSubjectAbbrev = (name) => {
  const map = {
    "Nhập môn lập trình": "NMLT",
    "Cơ sở dữ liệu": "CSDL",
    "Lập trình Javascript nâng cao": "JS NC",
    "NodeJS & Restful Web Service": "NODEJS",
    "Lập trình Front-End Framework 1": "FE FW1",
    "Lập trình Front-End Framework 2": "FE FW2",
    "Dự án 1": "DA1",
    "Dự án tốt nghiệp": "DATN"
  };
  if (map[name]) return map[name];
  return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 5);
};

// Helper to style matrix cells beautifully based on coefficient values
const getCellStyle = (r, isDark = false) => {
  if (r === 1.0) {
    return isDark 
      ? { backgroundColor: 'rgba(59, 130, 246, 0.45)', color: '#ffffff', border: '1px solid rgba(147, 197, 253, 0.4)' }
      : { backgroundColor: '#1D4ED8', color: '#ffffff', border: '1px solid #1E40AF', fontWeight: 'bold' };
  }
  if (r === 0.0) {
    return isDark
      ? { backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#475569' }
      : { backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' };
  }
  
  if (r > 0) {
    const alpha = Math.min(0.65, r * 0.7);
    return isDark
      ? { backgroundColor: `rgba(16, 185, 129, ${alpha})`, color: '#ffffff', border: `1px solid rgba(16, 185, 129, ${alpha + 0.1})` }
      : { backgroundColor: `rgba(5, 150, 105, ${alpha + 0.2})`, color: '#ffffff', border: `1px solid rgba(5, 150, 105, ${alpha + 0.3})`, fontWeight: 'bold' };
  } else {
    const alpha = Math.min(0.65, Math.abs(r) * 0.7);
    return isDark
      ? { backgroundColor: `rgba(239, 68, 68, ${alpha})`, color: '#ffffff', border: `1px solid rgba(239, 68, 68, ${alpha + 0.1})` }
      : { backgroundColor: `rgba(220, 38, 38, ${alpha + 0.2})`, color: '#ffffff', border: `1px solid rgba(220, 38, 38, ${alpha + 0.3})`, fontWeight: 'bold' };
  }
};

// Pedagogical advice generator based on correlation pairs
const getCorrelationDetails = (subA, subB, r) => {
  if (subA === subB) {
    return {
      title: `${subA}`,
      intensity: 'Hoàn hảo (1.0)',
      class: 'text-blue-400',
      desc: 'Tương quan của môn học với chính nó.',
      advice: 'Không yêu cầu phân tích rủi ro.'
    };
  }

  const absR = Math.abs(r);
  let intensity = 'Không tương quan';
  let colorClass = 'text-slate-600 dark:text-slate-400';
  let desc = '';
  let advice = '';

  if (absR >= 0.7) {
    intensity = 'Tương quan rất mạnh';
    colorClass = 'text-emerald-400 text-glow-green';
  } else if (absR >= 0.4) {
    intensity = 'Tương quan trung bình';
    colorClass = 'text-teal-400';
  } else if (absR >= 0.1) {
    intensity = 'Tương quan yếu';
    colorClass = 'text-amber-400';
  }

  if (r > 0) {
    desc = `Có mức liên hệ dương ${absR >= 0.7 ? 'mạnh' : absR >= 0.4 ? 'trung bình' : 'yếu'}. Sinh viên đạt kết quả thấp ở môn "${subA}" thường có xu hướng gặp khó khăn ở môn "${subB}". Mức tương quan (r = ${r}) cho thấy kiến thức của môn trước là nền tảng cho môn sau.`;
    advice = `Giảng viên môn "${subB}" cần kiểm tra điểm môn tiên quyết "${subA}" từ tuần 1. Tổ chức phụ đạo ôn tập bổ trợ kiến thức "${subA}" ngay lập tức nếu sinh viên có điểm đầu vào < 5.0.`;
  } else if (r < 0) {
    desc = `Hệ số tương quan nghịch r = ${r} chỉ ra sự phân hóa nhẹ trong phong cách tiếp thu của sinh viên giữa hai học phần này. Sinh viên học tốt môn này thường gặp khó khăn nhẹ ở môn kia.`;
    advice = `Giảng viên nên đa dạng hóa phương pháp truyền đạt (kết hợp cả tư duy logic của "${subA}" và thực hành/thực nghiệm của "${subB}") để đảm bảo sinh viên tiếp thu đồng đều.`;
  } else {
    desc = `Không phát hiện mối tương quan đáng kể nào (r = 0) giữa hai môn học này trong cơ sở dữ liệu.`;
    advice = `Hai môn học độc lập về mặt kiến thức truyền tải. Giảng viên giảng dạy bình thường mà không cần lo lắng về sự hổng kiến thức dây chuyền giữa hai môn học này.`;
  }

  return {
    title: `${subA} ⇄ ${subB}`,
    intensity: `${intensity} (r = ${r})`,
    class: colorClass,
    desc,
    advice
  };
};

export default function Predict() {
  const { trainingData, theme, fetchTrainingData } = useStore();
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [predictableSubjects, setPredictableSubjects] = useState([]);
  const [uploadedStudentsData, setUploadedStudentsData] = useState([]);

  // Dependency Graph state
  const [graphData, setGraphData] = useState(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [graphFilter, setGraphFilter] = useState('core');

  // Pending save variables for verification workflow
  const [pendingStudents, setPendingStudents] = useState([]);
  const [isPendingSave, setIsPendingSave] = useState(false);
  const [fileType, setFileType] = useState('class');
  const [mssvInput, setMssvInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [classInput, setClassInput] = useState('WD18301');
  const [searchTerm, setSearchTerm] = useState('');
  const [listFilter, setListFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(15);

  const resultsRef = useRef(null);

  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  useEffect(() => {
    setVisibleCount(15);
  }, [subject]);

  useEffect(() => {
    const fetchDependencyGraph = async () => {
      setGraphLoading(true);
      try {
        const res = await requestWithRestartRetry(() => api.get('/pearson-matrix'));
        setGraphData(res.data);
      } catch (err) {
        console.error("Lỗi nạp Pearson Matrix:", err);
      } finally {
        setGraphLoading(false);
        // Phase 2 Audit Log
        api.post('/audit-log', { userId: 'Advisor_01', action: 'VIEW_PEARSON_MATRIX' }).catch(() => {});
      }
    };
    fetchDependencyGraph();
  }, []);

  const subjects = predictableSubjects.length > 0 ? predictableSubjects : (trainingData?.stats?.map(s => typeof s === 'string' ? s : s.subject) || []);

  const handlePredict = async () => {
    if (!subject) return alert('Vui lòng chọn môn cần phân tích!');
    setLoading(true);
    try {
      const activeStudents = uploadedStudentsData.length > 0 ? uploadedStudentsData : pendingStudents;
      const res = await api.post(`/predict/${encodeURIComponent(subject)}`, {
        students: activeStudents.length > 0 ? activeStudents : undefined
      });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      // Phase 2 Audit Log
      api.post('/audit-log', { userId: 'Advisor_01', action: `PREDICT_${subject}` }).catch(() => {});
    }
  };

  const handleToggleIntervention = async (studentId, currentStatus) => {
    try {
      const targetStatus = !currentStatus;
      await api.post('/interventions', {
        studentId,
        subject,
        intervened: targetStatus
      });
      
      // Cập nhật kết quả cục bộ
      if (result && Array.isArray(result.predictions)) {
        const updated = result.predictions.map(p => {
          if (p.id === studentId) {
            return { ...p, intervened: targetStatus };
          }
          return p;
        });
        setResult({ ...result, predictions: updated });
      }
    } catch (err) {
      alert('Không thể cập nhật can thiệp: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // --- RESET ALL STATES ---
    setResult(null);
    setSubject('');
    setUploadedStudentsData([]);
    setMssvInput('');
    setNameInput('');
    setSelectedPredictStudentId(null);
    setPendingStudents([]);
    setPredictableSubjects([]);
    setSelectedCell(null);
    setSearchTerm('');
    // ------------------------

    if (files.length === 1) {
      setFile(files[0]);
    } else {
      setFile({ name: `📦 Đã chọn ${files.length} file dữ liệu` });
    }

    setUploadStatus(`⏳ Đang phân tích ${files.length} file...`);
    const formData = new FormData();
    files.forEach(f => {
      formData.append('files', f);
    });

    try {
      const res = await requestWithRestartRetry(() => api.post('/upload-predict', formData), {
        retries: 4,
        delayMs: 700,
      });
      const { studentsCount, errorsCount, errorsDetails, predictableSubjects: serverSubjects, students, fileType: type } = res.data;
      
      setFileType(type || 'class');
      setPendingStudents(students || []);
      setIsPendingSave(true);
      setPredictableSubjects(serverSubjects || []);
      
      if (type === 'transcript') {
        setMssvInput('');
        setNameInput('');
        setClassInput('WD18301');
      }

      let statusMsg = `📊 Phân tích thành công! Phát hiện ${studentsCount} sinh viên từ ${files.length} file (Dạng ${type === 'transcript' ? 'Bảng điểm cá nhân' : 'Bảng điểm lớp'}).`;
      
      if (errorsCount > 0) {
        console.warn('Chi tiết lỗi upload:', errorsDetails);
        setUploadStatus(`⚠️ Import thành công nhưng có lỗi dữ liệu bị loại bỏ:\n${errorsDetails.join('\n')}`);
      } else {
        setUploadStatus(statusMsg);
      }
      setResult(null); // Clear previous results
    } catch (err) {
      setUploadStatus(`❌ Lỗi: ${err.response?.data?.error || err.message}`);
      setIsPendingSave(false);
    }
  };

  const handleSaveToDatabase = async () => {
    let studentsToSave = [...pendingStudents];
    if (fileType === 'transcript') {
      if (!mssvInput.trim()) {
        return alert('Vui lòng nhập mã sinh viên MSSV để lưu trữ học bạ!');
      }
      if (mssvInput.trim().toUpperCase() === 'CA_NHAN') {
        return alert('MSSV không được đặt là CA_NHAN!');
      }
      
      // Update the dummy student profile with user filled attributes
      studentsToSave[0] = {
        ...studentsToSave[0],
        id: mssvInput.trim().toUpperCase(),
        name: nameInput.trim() || `Sinh viên ${mssvInput.trim().toUpperCase()}`,
        classCode: classInput.trim().toUpperCase() || 'WD18301'
      };
    } else {
      const hasInvalid = studentsToSave.some(st => !st.id || String(st.id).trim() === '' || String(st.id).trim() === 'CA_NHAN');
      if (hasInvalid) {
        return alert('Danh sách lớp tồn tại sinh viên thiếu mã MSSV hợp lệ!');
      }
    }

    setLoading(true);
    try {
      const res = await api.post('/save-uploaded', {
        students: studentsToSave
      });
      
      setUploadedStudentsData(studentsToSave);
      setIsPendingSave(false);
      setPendingStudents([]);
      setUploadStatus(`✅ ${res.data.message}`);
      alert(res.data.message);
      
      // Khởi chạy reload global state "Không cần F5"
      await fetchTrainingData();
      
      // Tự động reload để Analytics và toàn bộ UI đồng bộ dữ liệu SSOT
      window.location.reload();
    } catch (err) {
      alert('Không thể lưu dữ liệu vào Database: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSave = () => {
    setFile(null);
    setPendingStudents([]);
    setIsPendingSave(false);
    setUploadStatus('Tải lên đã được hủy bỏ.');
  };

  const [selectedPredictStudentId, setSelectedPredictStudentId] = useState(null);

  // Tự động chọn sinh viên rủi ro cao nhất làm tiêu điểm khi có kết quả mới
  useEffect(() => {
    if (result?.predictions?.length > 0) {
      const highRisk = result.predictions.find(p => p.risk === 'high');
      setSelectedPredictStudentId(highRisk ? highRisk.id : result.predictions[0].id);
    } else {
      setSelectedPredictStudentId(null);
    }
  }, [result]);

  const uploadedIds = (uploadedStudentsData.length > 0 ? uploadedStudentsData : pendingStudents).map(s => s.id);
  const showOnlyUploaded = file !== null || uploadedIds.length > 0;

  const filteredPredictions = (result?.predictions || []).filter(p => {
    if (showOnlyUploaded) {
      if (!uploadedIds.includes(p.id)) return false;
    } else {
      // Khi không tìm kiếm, EduGuard hiển thị danh sách các em nguy cơ Cao & Trung bình theo mặc định để cố vấn dễ hành động
      if (!searchTerm.trim()) {
        if (listFilter === 'all') {
          return p.risk === 'high' || p.risk === 'medium';
        }
      }
    }
    const matchSearch = String(p.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                        String(p.name).toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (listFilter === 'predicted') return p.isPredicted === true;
    if (listFilter === 'actual') return p.isPredicted === false;
    if (listFilter === 'highRisk') return p.risk === 'high';
    if (listFilter === 'mediumRisk') return p.risk === 'medium';
    if (listFilter === 'lowRisk') return p.risk === 'low';
    return true;
  });

  const displayedPredictions = filteredPredictions.slice(0, visibleCount);
  const singleStudent = filteredPredictions.find(p => p.id === selectedPredictStudentId) || (filteredPredictions.length > 0 ? filteredPredictions[0] : null);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload Card */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <UploadCloud size={22} className="text-purple-400" /> Tải dữ liệu học vụ mới
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">EduGuard AI hỗ trợ nạp bảng điểm lớp hoặc bảng điểm cá nhân tùy thích. Hệ thống chỉ lưu khi bạn xác nhận.</p>
          
          <label className="border-2 border-dashed border-purple-200 dark:border-purple-500/30 rounded-2xl p-8 text-center hover:bg-purple-500/5 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group-hover:border-purple-500/60">
            <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleUpload} className="hidden" />
            <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="text-purple-300" size={20}/>
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium">{file ? file.name : 'Kéo thả hoặc Click chọn file Excel/CSV'}</p>
          </label>
          {uploadStatus && <div className="mt-4 p-3 bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-300 rounded-xl text-sm font-medium">{uploadStatus}</div>}
        </div>

        {/* Predict Card */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden hover-glow">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Zap size={22} className="text-blue-400" /> AI Engine Core
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">EduGuard AI sẽ phân tích mức độ hụt kiến thức của các môn học nền tảng để tính toán nguy cơ rớt môn chuyên ngành.</p>
          
          <div className="space-y-4">
            <div className="relative">
              <select className="w-full p-4 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500/50 text-slate-900 dark:text-white appearance-none transition-colors" value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="" className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">-- Click chọn môn cần dự báo --</option>
                {subjects.map(s => {
                  if (typeof s === 'string') {
                    return <option key={s} value={s} className="bg-white dark:bg-slate-900">{s}</option>;
                  }
                  const { subject: name, missingCount, totalCount } = s;
                  const isDone = missingCount === 0;
                  return (
                    <option key={name} value={name} disabled={isDone} className={`bg-white dark:bg-slate-900 ${isDone ? 'text-slate-600' : 'text-slate-900 dark:text-white font-medium'}`}>
                      {name} {isDone ? '(Đã có điểm)' : (totalCount === 1 ? '(Chưa có điểm)' : `(${missingCount}/${totalCount} SV thiếu)`)}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 dark:text-slate-400">
                <Target size={18}/>
              </div>
            </div>
            <button onClick={handlePredict} disabled={loading} className="w-full bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 hover:dark:from-blue-500 hover:dark:to-indigo-500 text-slate-900 dark:text-white font-bold p-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 className="animate-spin text-blue-500 dark:text-white" size={20} /> <span className="animate-pulse">Đang phân tích dữ liệu...</span></> : <><Brain size={20} /> Phân tích Rủi ro</>}
            </button>
          </div>
        </div>
      </div>

      {/* Dependency Graph Matrix */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <TrendingUp size={120} className="text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h3 className="text-xl font-black text-[#0F172A] dark:text-white flex items-center gap-2">
              <TrendingUp size={22} className="text-[#1D4ED8] dark:text-blue-400" /> Bản Đồ Liên Kết Môn Tiên Quyết (Dependency Graph)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-semibold">
              Sơ đồ chỉ ra mức độ liên kết học vụ giữa các học phần nền tảng và chuyên ngành trong chương trình 34 môn. Giúp phát hiện lỗ hổng kiến thức dây chuyền của sinh viên.
            </p>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-black/35 p-1 rounded-xl border border-slate-200 dark:border-white/10 self-start md:self-auto">
            <button
              onClick={() => { setGraphFilter('core'); setSelectedCell(null); }}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                graphFilter === 'core' ? 'bg-[#1D4ED8] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              8 Môn Cốt Lõi
            </button>
            <button
              onClick={() => { setGraphFilter('all'); setSelectedCell(null); }}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                graphFilter === 'all' ? 'bg-[#1D4ED8] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              Tất Cả Môn
            </button>
          </div>
        </div>

        {graphLoading ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></span>
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce delay-75"></span>
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce delay-150"></span>
            Đang phân tích chuỗi liên kết 34 môn học...
          </div>
        ) : graphData?.status === 'INSUFFICIENT_DATA' ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
            <Info size={32} className="text-yellow-500 mb-2" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Dữ liệu chưa đủ độ tin cậy</h3>
            <p>{graphData.message || "Hệ thống cần ít nhất 30 học bạ hoàn chỉnh để phân tích mức độ tương quan môn học."}</p>
          </div>
        ) : graphData ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
            
            {/* Heatmap Grid */}
            <div className="xl:col-span-8 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-[#F8FAFC] dark:bg-black/25 p-4">
              <div className="min-w-[640px]">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-[10px] font-black text-[#0F172A] dark:text-slate-500 text-left w-36 uppercase tracking-wider">Môn học gốc</th>
                      {graphData.subjects
                        .filter(sub => graphFilter === 'all' || CORE_SUBJECTS_FILTER.includes(sub))
                        .map(sub => (
                          <th key={sub} className="p-2 text-[10px] font-black text-[#0F172A] dark:text-slate-400 uppercase tracking-wider text-center w-20 truncate max-w-[80px]" title={sub}>
                            {getSubjectAbbrev(sub)}
                          </th>
                        ))
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {graphData.matrix && graphData.matrix
                      .filter(row => graphFilter === 'all' || CORE_SUBJECTS_FILTER.includes(row.subject))
                      .map(row => {
                        const activeSubjects = graphData.subjects.filter(sub => graphFilter === 'all' || CORE_SUBJECTS_FILTER.includes(sub));
                        return (
                          <tr key={row.subject} className="hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/5">
                            <td className="p-2.5 text-[#0F172A] dark:text-slate-300 font-extrabold text-xs text-left truncate max-w-[140px]" title={row.subject}>
                              {row.subject}
                            </td>
                            {activeSubjects.map(subB => {
                              const rRaw = row[subB];
                              const isSelected = selectedCell && selectedCell.subA === row.subject && selectedCell.subB === subB;
                              return (
                                <td key={subB} className="p-1">
                                  <button
                                    onClick={() => rRaw !== null && setSelectedCell({ subA: row.subject, subB, r: rRaw })}
                                    style={rRaw === null ? { backgroundColor: theme === 'dark' ? '#1e293b' : '#f1f5f9', color: '#94a3b8' } : getCellStyle(rRaw, theme === 'dark')}
                                    disabled={rRaw === null}
                                    className={`w-full aspect-square md:aspect-auto md:py-2 px-1 text-[11px] font-bold rounded-lg transition-all ${rRaw !== null ? 'hover:scale-105 hover:shadow-lg cursor-pointer' : 'cursor-not-allowed'} flex items-center justify-center ${
                                      isSelected ? 'ring-2 ring-blue-500 scale-105 shadow-md shadow-sm dark:shadow-blue-500/20' : ''
                                    }`}
                                    title={rRaw === null ? 'Insufficient Data (< 30 samples)' : `${row.subject} ⇄ ${subB}: r = ${rRaw.toFixed(2)}`}
                                  >
                                    {rRaw === null ? '—' : (rRaw === 1.0 ? '1.0' : rRaw.toFixed(2))}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
                <div className="flex justify-end items-center gap-4 mt-4 px-2 text-[10px] text-[#0F172A] dark:text-slate-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#10B981] border border-emerald-300 dark:bg-emerald-500/40 dark:border-emerald-500/50"></span> 
                    Tương quan dương (+)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#EF4444] border border-rose-300 dark:bg-rose-500/40 dark:border-rose-500/50"></span> 
                    Tương quan nghịch (-)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#1D4ED8] border border-blue-400 dark:bg-blue-500/40 dark:border-blue-400/50"></span> 
                    Đồng biến tuyệt đối
                  </span>
                </div>
              </div>
            </div>

            {/* Clicked Details Panel */}
            <div className="xl:col-span-4">
              {selectedCell ? (() => {
                const info = getCorrelationDetails(selectedCell.subA, selectedCell.subB, selectedCell.r);
                return (
                  <div className="bg-[#F8FAFC] dark:bg-white/5 p-5 rounded-2xl border border-slate-200 dark:border-white/10 h-full flex flex-col justify-between relative overflow-hidden shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-[#1D4ED8] dark:text-blue-400"><HelpCircle size={16} /></span>
                        <h4 className="text-sm font-black text-[#0F172A] dark:text-white tracking-wide">Chi tiết liên kết học thuật</h4>
                      </div>
                      
                      <div className="p-3 bg-white dark:bg-black/45 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-bold">Cặp môn học</span>
                        <span className="text-xs text-[#0F172A] dark:text-white font-extrabold block mt-0.5">{info.title}</span>
                      </div>

                      <div className="p-3 bg-white dark:bg-black/45 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-bold">Mức độ tương quan</span>
                        <span className={`text-xs font-black block mt-0.5 ${info.class}`}>{info.intensity}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold block">Ý nghĩa khoa học</span>
                        <p className="text-slate-800 dark:text-slate-300 text-xs leading-relaxed font-semibold">{info.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-200 dark:border-white/5 space-y-1">
                        <span className="text-[10px] text-[#1D4ED8] dark:text-blue-400 uppercase tracking-wider font-extrabold block flex items-center gap-1">
                          💡 Đề xuất hành động sư phạm
                        </span>
                        <p className="text-[#059669] dark:text-emerald-300 text-xs leading-relaxed font-bold italic">{info.advice}</p>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 mt-4 text-right italic font-semibold">
                      Dữ liệu tính toán từ {graphData.matrix.length} học bạ thực tế.
                    </div>
                  </div>
                );
              })() : (
                <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-2xl h-full p-8 flex flex-col items-center justify-center text-center bg-[#F8FAFC] dark:bg-black/15 shadow-inner">
                  <div className="bg-white dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-white/5 text-[#1D4ED8] dark:text-slate-500 mb-3 shadow-sm">
                    <TrendingUp size={24} />
                  </div>
                  <h4 className="text-xs font-extrabold text-[#0F172A] dark:text-slate-400">Chọn một ô hệ số tương quan</h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-1.5 max-w-[200px] font-semibold leading-relaxed">
                    Click vào bất kỳ ô hệ số nào trong ma trận để xem phân tích khoa học và chỉ dẫn hành động sư phạm tương ứng.
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs border border-slate-200 dark:border-white/5 rounded-2xl">
            Không thể tải sơ đồ liên kết môn học. Vui lòng kiểm tra lại kết nối API.
          </div>
        )}
      </div>

      {/* Pending Confirmation Panel */}
      {isPendingSave && (
        <div className="glass-card p-6 rounded-3xl border border-amber-200 dark:border-amber-500/20 bg-amber-500/5 relative overflow-hidden shadow-2xl animate-fade-in">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Database size={150} className="text-amber-400 animate-pulse" />
          </div>
          
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Database size={20} className="text-amber-400" /> Xác nhận lưu trữ học bạ sinh viên
          </h4>

          {fileType === 'transcript' ? (
            <div className="space-y-6">
              <div className="p-4 bg-black/25 border border-slate-200 dark:border-white/5 rounded-2xl">
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed flex items-center gap-2">
                  <Info size={16} className="text-blue-400 flex-shrink-0" />
                  <span><strong>Định dạng cá nhân:</strong> Phát hiện file bảng điểm của 1 sinh viên lẻ. Vui lòng nhập thông tin MSSV thực tế dưới đây để hệ thống liên kết học bạ và cho phép tra cứu sau này.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">MSSV (Mã sinh viên) *</label>
                  <input 
                    type="text" 
                    placeholder="Nhập MSSV (VD: PS12345)..." 
                    value={mssvInput}
                    onChange={e => setMssvInput(e.target.value)}
                    className="w-full p-3.5 bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-amber-500/50 text-slate-900 dark:text-white text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Họ và tên sinh viên</label>
                  <input 
                    type="text" 
                    placeholder="Họ tên sinh viên..." 
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="w-full p-3.5 bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-amber-500/50 text-slate-900 dark:text-white text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Mã lớp</label>
                  <input 
                    type="text" 
                    placeholder="VD: WD18301..." 
                    value={classInput}
                    onChange={e => setClassInput(e.target.value)}
                    className="w-full p-3.5 bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-amber-500/50 text-slate-900 dark:text-white text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-black/25 border border-slate-200 dark:border-white/5 rounded-2xl">
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed flex items-center gap-2">
                  <Info size={16} className="text-blue-400 flex-shrink-0" />
                  <span><strong>Định dạng lớp học:</strong> Phát hiện danh sách điểm lớp gồm <strong>{pendingStudents.length} sinh viên</strong>. Dữ liệu MSSV đã được tự động nạp từ các cột tương ứng.</span>
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-white/5 rounded-2xl bg-slate-200 dark:bg-black/30">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10 bg-white/5">
                      <th className="p-3">STT</th>
                      <th className="p-3">MSSV</th>
                      <th className="p-3">Họ và tên</th>
                      <th className="p-3">Số môn học có điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStudents.map((st, index) => (
                      <tr key={index} className="border-b border-slate-200 dark:border-white/5 hover:bg-white/5">
                        <td className="p-3 text-slate-500">{index + 1}</td>
                        <td className="p-3 text-blue-300 font-bold font-mono">{st.id}</td>
                        <td className="p-3 text-slate-900 dark:text-white font-medium">{st.name || `Sinh viên lớp`}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                          {Object.entries(st.scores || {}).filter(([_, v]) => v !== null).length} môn
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-white/5 justify-end">
            <button 
              onClick={handleCancelSave}
              className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-500/20 transition-all flex items-center gap-2"
            >
              <XCircle size={14} /> Hủy bỏ tải lên
            </button>
            <button 
              onClick={handleSaveToDatabase}
              disabled={loading}
              className="px-6 py-2.5 bg-white dark:bg-gradient-to-r dark:from-emerald-600 dark:to-green-600 hover:dark:from-emerald-500 hover:dark:to-green-500 text-slate-900 dark:text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
            >
              <Save size={14} /> {loading ? 'Đang lưu học bạ...' : 'Xác nhận Lưu Database'}
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl p-8 animate-pulse">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div>
              <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2"></div>
              <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="w-full h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              <div className="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            </div>
            <div className="w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          </div>
          <div className="mt-8 flex gap-3">
            <div className="w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="w-32 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="w-20 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      )}

      {/* Results Area */}
      {result && result.validation && !loading && (
        <div ref={resultsRef} className="glass-card rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
          
          {/* XAI Architecture Details */}
          <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 p-8 border-b border-slate-200 dark:border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Activity size={100} />
            </div>
            <h4 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <Activity size={24} className="text-emerald-400"/> Kiến trúc XAI (Explainable AI)
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-4">
                <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5">
                  <p className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-1">Thuật toán lõi</p>
                  <p className="text-slate-900 dark:text-white font-medium">{result.formula.name}</p>
                </div>
                <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                  <p className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider mb-2">Hàm toán học</p>
                  <code className="bg-emerald-500/10 px-3 py-1.5 rounded-lg text-emerald-400 font-mono text-sm border border-emerald-200 dark:border-emerald-500/20">{result.formula.expression}</code>
                  <p className="text-slate-500 text-xs mt-3">{result.formula.explanation}</p>
                </div>
              </div>
              
              <div className="bg-blue-900/10 p-5 rounded-2xl border border-blue-200 dark:border-blue-500/10">
                <h5 className="font-bold mb-4 text-sm text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Info size={16} className="text-blue-400"/> Chỉ số Validation (80/20 Split)
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-100 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                    <span className="block text-slate-600 dark:text-slate-400 text-xs mb-1">Train Size</span>
                    <span className="font-bold text-blue-300 text-lg">{result.validation.trainSize}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                    <span className="block text-slate-600 dark:text-slate-400 text-xs mb-1">Test Size</span>
                    <span className="font-bold text-amber-300 text-lg">{result.validation.testSize}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                    <span className="block text-slate-600 dark:text-slate-400 text-xs mb-1">Sai số MAE</span>
                    <span className="font-bold text-rose-400 text-lg">{result.validation.mae}</span>
                  </div>
                  <div className="bg-slate-100 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                    <span className="block text-slate-600 dark:text-slate-400 text-xs mb-1">Sai số RMSE</span>
                    <span className="font-bold text-rose-400 text-lg">{result.validation.rmse}</span>
                  </div>
                  <div className="col-span-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/20 flex justify-between items-center">
                    <span className="text-emerald-400 font-medium">Độ tin cậy (Confidence)</span>
                    <span className="font-black text-emerald-400 text-xl">{result.validation.accuracy}%</span>
                  </div>
                </div>
              </div>
            </div>

            {result.topFeatures && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 relative z-10">
                <p className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">Tính năng đóng góp (Top Features):</p>
                <div className="flex gap-2 flex-wrap">
                  {result.topFeatures.map(f => (
                    <div key={f.subject} className="bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-white/10 transition-colors">
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{f.subject}</span>
                      <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md" title="Mức độ ảnh hưởng dây chuyền">Impact: {f.r > 0.5 ? "Mạnh" : "Vừa"}</span>
                      {f.hybridScore !== undefined && (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md" title="Hệ số tương quan kết hợp sơ đồ môn học tiên quyết (Hybrid Score)">Độ ưu tiên: {f.hybridScore}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ML Risk Analysis Dashboard */}
          {(() => {
            const totalPreds = result?.predictions?.length || 0;
            const highRiskCount = result?.predictions?.filter(p => p.risk === 'high').length || 0;
            const mediumRiskCount = result?.predictions?.filter(p => p.risk === 'medium').length || 0;
            const lowRiskCount = result?.predictions?.filter(p => p.risk === 'low').length || 0;

            const highPercent = totalPreds > 0 ? ((highRiskCount / totalPreds) * 100).toFixed(1) : 0;
            const mediumPercent = totalPreds > 0 ? ((mediumRiskCount / totalPreds) * 100).toFixed(1) : 0;
            const lowPercent = totalPreds > 0 ? ((lowRiskCount / totalPreds) * 100).toFixed(1) : 0;

            return (
              <div className="mx-8 mt-8 p-6 bg-white dark:bg-gradient-to-br dark:from-slate-900/40 dark:via-slate-800/40 dark:to-slate-900/40 border border-slate-200 dark:border-white/10 rounded-3xl relative overflow-hidden shadow-xl animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap size={18} className="text-amber-400" /> Báo cáo Phân tích Phổ rủi ro học đường
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Phân tích rủi ro học thuật diện rộng của sinh viên FPT Polytechnic đối với học phần {subject}.</p>
                  </div>
                  
                  {result.validation?.accuracy && (
                    <div className="bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3.5 py-2 rounded-2xl flex items-center gap-2 self-start sm:self-auto">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-xs font-bold text-emerald-400">Độ tin cậy hệ thống: {result.validation.accuracy}%</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-2xl flex flex-col justify-center items-center">
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-1">Cảnh báo Nguy cơ Cao (Cần Can Thiệp)</span>
                    <span className="text-2xl font-black text-rose-400">{highRiskCount} <span className="text-xs text-slate-500 font-normal">sinh viên ({highPercent}%)</span></span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex flex-col justify-center items-center">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Theo dõi Cần Lưu Ý</span>
                    <span className="text-2xl font-black text-amber-400">{mediumRiskCount} <span className="text-xs text-slate-500 font-normal">sinh viên ({mediumPercent}%)</span></span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-center items-center">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">An Toàn & Ổn Định</span>
                    <span className="text-2xl font-black text-emerald-400">{lowRiskCount} <span className="text-xs text-slate-500 font-normal">sinh viên ({lowPercent}%)</span></span>
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex border border-slate-200 dark:border-white/10 mt-6 relative group">
                  <div style={{ width: `${highPercent}%` }} className="bg-rose-500 h-full transition-all duration-700 hover:opacity-90 cursor-pointer" title={`Nguy cơ cao: ${highPercent}%`}></div>
                  <div style={{ width: `${mediumPercent}%` }} className="bg-amber-500 h-full transition-all duration-700 hover:opacity-90 cursor-pointer" title={`Cần theo dõi: ${mediumPercent}%`}></div>
                  <div style={{ width: `${lowPercent}%` }} className="bg-emerald-500 h-full transition-all duration-700 hover:opacity-90 cursor-pointer" title={`Ổn định: ${lowPercent}%`}></div>
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-semibold">
                  <span>Màu đỏ: Dự báo Rớt môn (&lt; 5.0đ)</span>
                  <span>Màu vàng: Dự báo Trung bình (5.0 - 6.5đ)</span>
                  <span>Màu xanh: Dự báo Khá / Giỏi (&gt; 6.5đ)</span>
                </div>
              </div>
            );
          })()}

          {/* Personal Student Prediction Spotlight Showcase */}
          {singleStudent && (
            <div className="mx-8 mt-8 p-6 bg-white dark:bg-gradient-to-br dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900/90 border border-blue-200 dark:border-blue-500/20 rounded-3xl relative overflow-hidden shadow-2xl animate-fade-in group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                {/* Left Side: Score Spotlight */}
                <div className="lg:col-span-1 flex flex-col justify-between p-6 bg-black/35 rounded-2xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] text-blue-400 uppercase tracking-widest font-black block">Học bạ Tiên lượng</span>
                        <h5 className="text-lg font-black text-slate-900 dark:text-white mt-1 tracking-wide">{singleStudent.name}</h5>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400 block mt-0.5">MSSV: {singleStudent.id} | Lớp: {singleStudent.classCode || 'WD18301'}</span>
                      </div>
                      
                      {singleStudent.isPredicted ? (
                        <span className="text-[9px] bg-purple-500/25 border border-purple-200 dark:border-purple-500/35 text-purple-300 px-2 py-0.5 rounded-md font-black tracking-wide uppercase">Ước Lượng</span>
                      ) : (
                        <span className="text-[9px] bg-blue-500/25 border border-blue-200 dark:border-blue-500/35 text-blue-300 px-2 py-0.5 rounded-md font-black tracking-wide uppercase">THỰC TẾ</span>
                      )}
                    </div>
                  </div>

                  <div className="my-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Điểm số mục tiêu</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        {singleStudent.risk === 'insufficient_data' ? (
                          <span className="text-5xl font-black tracking-tight text-slate-500">
                            —
                          </span>
                        ) : (
                          <>
                            <span className={`text-5xl font-black tracking-tight text-glow-green ${singleStudent.predicted >= 6.5 ? 'text-emerald-400 text-glow-green' : singleStudent.predicted >= 5 ? 'text-amber-400' : 'text-rose-500 text-glow-red'}`}>
                              {typeof singleStudent.predicted === 'number' ? singleStudent.predicted.toFixed(1) : singleStudent.predicted}
                            </span>
                            <span className="text-lg font-bold text-slate-600 dark:text-slate-400">đ</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Cảnh báo rủi ro</span>
                      <div className="mt-1.5 flex flex-col gap-1 items-end">
                        {singleStudent.risk === 'insufficient_data' ? (
                          <span className="bg-slate-500/20 border border-slate-200 dark:border-white/10 text-slate-400 px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5"><Info size={14}/> CHƯA ĐỦ DỮ LIỆU</span>
                        ) : singleStudent.risk === 'high' ? (
                          <span className="bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-400 px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]"><AlertTriangle size={14}/> NGUY CƠ CAO</span>
                        ) : singleStudent.risk === 'medium' ? (
                          <span className="bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]"><Info size={14}/> THEO DÕI</span>
                        ) : (
                          <span className="bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"><CheckCircle size={14}/> ỔN ĐỊNH</span>
                        )}
                        {singleStudent.confidence && singleStudent.confidence < 0.6 && singleStudent.risk !== 'insufficient_data' && (
                          <span className="text-[9px] text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded-md border border-yellow-500/20 mt-1">
                            ⚠️ Độ tin cậy thấp – Cần tham khảo thêm dữ liệu thực tế
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {singleStudent.componentScores && (
                    <div className="my-4 pt-4 border-t border-slate-200/50 dark:border-white/5 animate-slide-up" style={{animationDuration: '0.3s'}}>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold mb-3">Thành phần điểm hiện tại</span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Att.', value: singleStudent.componentScores.attendance != null ? (singleStudent.componentScores.attendance <= 1 ? `${Math.round(singleStudent.componentScores.attendance * 100)}%` : `${singleStudent.componentScores.attendance}%`) : '-' },
                          { label: 'Quiz', value: singleStudent.componentScores.quiz ?? '-' },
                          { label: 'Lab', value: singleStudent.componentScores.lab ?? '-' },
                          { label: 'Assig.', value: singleStudent.componentScores.assignment ?? '-' },
                          { label: 'ASM1', value: singleStudent.componentScores.asm1 ?? '-' },
                          { label: 'ASM2', value: singleStudent.componentScores.asm2 ?? '-' },
                          { label: 'Final', value: singleStudent.componentScores.final ?? '-' },
                        ].map((c, idx) => (
                          <div key={idx} className="bg-slate-100 dark:bg-black/30 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-200 dark:border-white/5">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider mb-1">{c.label}</span>
                            <span className={`text-xs font-bold ${c.value === '-' ? 'text-slate-400' : 'text-blue-600 dark:text-blue-400'}`}>{c.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">Can thiệp sư phạm:</span>
                    <button 
                      onClick={() => handleToggleIntervention(singleStudent.id, singleStudent.intervened)} 
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${singleStudent.intervened ? 'bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-white'}`}
                    >
                      <HeartHandshake size={14} className={singleStudent.intervened ? 'text-emerald-400' : 'text-slate-600 dark:text-slate-400'} />
                      {singleStudent.intervened ? 'Đã Can Thiệp' : 'Đánh dấu hỗ trợ'}
                    </button>
                  </div>
                </div>

                {/* Right Side (Col-span-2): Explainable AI & Action Recommendations */}
                <div className="lg:col-span-2 flex flex-col justify-between p-6 bg-black/25 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div>
                    <h6 className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-widest font-black mb-3">Phân tích yếu tố ảnh hưởng (Explainable AI)</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Điểm mạnh / Hỗ trợ chuyên ngành</span>
                        <ul className="space-y-2 max-h-36 overflow-y-auto pr-1 list-none">
                          {singleStudent.reasons && Array.isArray(singleStudent.reasons) && singleStudent.reasons.filter(r => r.impact === 'positive').length > 0 ? (
                            singleStudent.reasons.filter(r => r.impact === 'positive').map((r, i) => (
                              <li key={i} className="text-xs flex items-center gap-2 text-emerald-300">
                                <span>🟢</span>
                                <span className="font-semibold">Nắm vững môn nền tảng: {r.subject} ({r.score}đ)</span>
                              </li>
                            ))
                          ) : typeof singleStudent.reasons === 'string' && singleStudent.reasons ? (
                            <li className="text-xs flex items-center gap-2 text-emerald-300">
                              <span>🟢</span>
                              <span className="font-semibold">{singleStudent.reasons}</span>
                            </li>
                          ) : (
                            <span className="text-xs text-slate-500 italic block">Chưa ghi nhận ưu điểm nổi bật.</span>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Lỗ hổng kiến thức / Cảnh báo</span>
                        <ul className="space-y-2 max-h-36 overflow-y-auto pr-1 list-none">
                          {singleStudent.reasons && Array.isArray(singleStudent.reasons) && singleStudent.reasons.filter(r => r.impact === 'negative').length > 0 ? (
                            singleStudent.reasons.filter(r => r.impact === 'negative').map((r, i) => (
                              <li key={i} className="text-xs flex items-center gap-2 text-rose-300">
                                <span>🔴</span>
                                <span className="font-semibold">Mất gốc môn {r.subject} ({r.score}đ) gây đứt gãy chuỗi.</span>
                              </li>
                            ))
                          ) : typeof singleStudent.reasons === 'string' && singleStudent.reasons ? (
                            <li className="text-xs flex items-center gap-2 text-rose-300">
                              <span>🔴</span>
                              <span className="font-semibold">{singleStudent.reasons}</span>
                            </li>
                          ) : (
                            <span className="text-xs text-slate-500 italic block">Chưa ghi nhận hổng kiến thức nền tảng.</span>
                          )}
                          {singleStudent.risk === 'high' && (
                            <li className="text-xs flex items-center gap-2 text-rose-300">
                                <span>🔴</span>
                                <span className="font-semibold">Dấu hiệu chuyên cần giảm sút trong chuỗi học vụ.</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black block mb-1">🎯 Đề xuất hành động từ Cố vấn AI</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium italic">
                      {singleStudent.risk === 'high' ? (
                        `⚠️ Cảnh báo: Sinh viên đang có nguy cơ rớt môn "${subject}". Giảng viên giảng dạy và Cố vấn học tập cần lập tức liên hệ, hỗ trợ phụ đạo kiến thức của các môn liên quan (đặc biệt là môn hổng kiến thức) để tránh rớt môn dây chuyền.`
                      ) : singleStudent.risk === 'medium' ? (
                        `📝 Lưu ý: Điểm số dự kiến nằm ở mức trung bình (${singleStudent.predicted}đ). Khuyến khích sinh viên tham gia các buổi trao đổi bài tập nhóm và hoàn thành đầy đủ lab/quiz môn "${subject}" đúng hạn để bảo đảm kết quả.`
                      ) : (
                        `✨ Tuyệt vời: Sinh viên có nền tảng cực tốt ở các môn học liên quan. Điểm dự báo đạt ${singleStudent.predicted}đ (Rủi ro Thấp). Khuyến khích sinh viên duy trì phong độ hiện tại và hỗ trợ các bạn cùng lớp học nhóm.`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Predictions Table */}
          <div className="p-8 overflow-x-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                  {showOnlyUploaded ? (
                    '🎯 Kết quả Phân tích danh sách nạp'
                  ) : (
                    '🎯 Danh sách phân tích mức độ cảnh báo'
                  )}
                </h4>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                  <span>💡 Mẹo: Nhấp vào dòng bất kỳ để nạp báo cáo tiêu điểm chi tiết (Spotlight) của sinh viên đó lên khung phía trên.</span>
                </p>
              </div>
              
              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm MSSV hoặc Tên..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-4 py-2 bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-slate-900 dark:text-white text-xs font-medium w-full sm:w-60"
                />
                
                <select 
                  value={listFilter}
                  onChange={e => setListFilter(e.target.value)}
                  className="px-4 py-2 bg-black/35 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  {showOnlyUploaded ? (
                    <>
                      <option value="all">Tất cả nạp lên</option>
                      <option value="highRisk">Rủi ro cao (Nguy cơ)</option>
                      <option value="mediumRisk">Rủi ro trung bình (Theo dõi)</option>
                      <option value="lowRisk">Rủi ro thấp (Ổn định)</option>
                    </>
                  ) : (
                    <>
                      <option value="all">Tất cả cần dự báo</option>
                      <option value="highRisk">Rủi ro cao (Nguy cơ)</option>
                      <option value="mediumRisk">Rủi ro trung bình (Theo dõi)</option>
                      <option value="lowRisk">Rủi ro thấp (Ổn định)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {filteredPredictions.length > 0 ? (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                      <th className="p-4 font-semibold">MSSV</th>
                      <th className="p-4 font-semibold">Họ và tên</th>
                      <th className="p-4 font-semibold">Điểm số (Thực tế/Ước lượng)</th>
                      <th className="p-4 font-semibold">Mức Cảnh báo</th>
                      <th className="p-4 font-semibold">Giải thích XAI (Reasons)</th>
                      <th className="p-4 font-semibold text-center">Can thiệp sư phạm</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {displayedPredictions
                      .map(p => (
                        <tr 
                          key={p.id} 
                          onClick={() => setSelectedPredictStudentId(p.id)}
                          className={`border-b border-slate-200 dark:border-white/5 hover:bg-white/10 transition-all cursor-pointer ${
                            selectedPredictStudentId === p.id 
                              ? 'bg-blue-600/10 border-l-4 border-l-blue-500' 
                              : ''
                          }`}
                        >
                          <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                            <Link to={`/student/${p.id}`} className="text-blue-400 hover:text-blue-300 transition-colors font-bold hover:underline font-mono">
                              {p.id}
                            </Link>
                          </td>
                          <td className="p-4 text-slate-900 dark:text-white">
                            <Link to={`/student/${p.id}`} className="hover:text-blue-400 transition-colors font-semibold">
                              {p.name}
                            </Link>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              {p.risk === 'insufficient_data' ? (
                                <span className="text-lg font-black text-slate-500">
                                  —
                                </span>
                              ) : (
                                <span className={`text-lg font-black ${p.predicted >= 6.5 ? 'text-emerald-400 text-glow-green' : p.predicted >= 5 ? 'text-amber-400' : 'text-rose-500 text-glow-red'}`}>
                                  {typeof p.predicted === 'number' ? p.predicted.toFixed(1) : p.predicted}đ
                                </span>
                              )}
                              {p.isPredicted ? (
                                <span className="text-[9px] bg-purple-500/15 border border-purple-200 dark:border-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md font-extrabold w-max tracking-wide uppercase">Ước lượng</span>
                              ) : (
                                <span className="text-[9px] bg-blue-500/15 border border-blue-200 dark:border-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-md font-extrabold w-max tracking-wide uppercase">Thực tế</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {p.risk === 'insufficient_data' ? <span className="bg-slate-500/20 border border-slate-200 dark:border-white/10 text-slate-400 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><Info size={12}/> Chưa đủ dữ liệu</span> :
                             p.risk === 'high' ? <span className="bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><AlertTriangle size={12}/> Nguy cơ</span> :
                             p.risk === 'medium' ? <span className="bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><Info size={12}/> Theo dõi</span> :
                             <span className="bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><CheckCircle size={12}/> Ổn định</span>}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1.5 font-normal">
                              {p.reasons?.map((r, i) => (
                                <div key={i} className={`text-xs flex items-center gap-2 ${r.impact === 'negative' ? 'text-rose-400' : r.impact === 'positive' ? 'text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${r.impact === 'negative' ? 'bg-rose-400' : r.impact === 'positive' ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                                  {r.explanation}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleToggleIntervention(p.id, p.intervened)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 mx-auto transition-all ${p.intervened ? 'bg-emerald-500/25 border border-emerald-200 dark:border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-white'}`}>
                              <HeartHandshake size={14} className={p.intervened ? 'text-emerald-400' : 'text-slate-600 dark:text-slate-400'} />
                              {p.intervened ? 'Đã Can Thiệp' : 'Đánh dấu'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {filteredPredictions.length > visibleCount && (
                  <div className="mt-8 text-center">
                    <button 
                      onClick={() => setVisibleCount(prev => prev + 30)} 
                      className="px-6 py-3 bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Xem thêm 30 sinh viên... ({filteredPredictions.length - visibleCount} còn lại)
                    </button>
                  </div>
                )}
              </>
            ) : (
              !showOnlyUploaded && (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-black/15 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden shadow-inner mt-4">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Brain size={120} className="text-blue-500" />
                  </div>
                  <Brain size={48} className="text-blue-500/30 mb-4 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Hỗ trợ Phân tích & Tiên lượng Cá nhân</h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                    Hệ thống EduGuard AI đang lưu trữ <strong>{result.predictions.length} hồ sơ sinh viên</strong> trong bộ nhớ học tập. 
                    Để có trải nghiệm tối ưu nhất, vui lòng nhập MSSV hoặc tên của sinh viên bạn muốn xem vào thanh tìm kiếm ở trên để nhận báo cáo phân tích rủi ro chi tiết ngay lập tức!
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Warning Alert if no regression data is available */}
      {result && result.status === 'warning' && (
        <div className="glass-card p-8 rounded-3xl border border-amber-200 dark:border-amber-500/20 bg-amber-500/5 text-amber-300 relative overflow-hidden shadow-xl animate-fade-in">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <AlertTriangle size={80} className="text-amber-400 animate-pulse" />
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-amber-500/25 p-3 rounded-2xl border border-amber-200 dark:border-amber-500/30">
              <AlertTriangle size={24} className="text-amber-400" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Chưa đủ dữ liệu hồi quy</h4>
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed max-w-xl">
                {result.message || 'Hệ thống hiện chưa có đủ số lượng sinh viên học qua chuỗi môn này để phân tích chuỗi rủi ro'} cho môn học <strong>{result.target}</strong>. Điểm số của sinh viên không thể phân tích chính xác bằng Academic Dependency Engine hiện tại.
              </p>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setSubject('')} className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-500/20 transition-all">Chọn môn học khác</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
