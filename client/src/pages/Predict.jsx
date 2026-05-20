import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { api, requestWithRestartRetry } from '../lib/api';
import { 
  UploadCloud, Activity, Zap, CheckCircle, Brain, Target, 
  Info, AlertTriangle, HeartHandshake, XCircle, Save, Database,
  TrendingUp, HelpCircle
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

// Helper to style matrix cells beautifully based on coefficient values
const getCellStyle = (r) => {
  if (r === 1.0) return { backgroundColor: 'rgba(59, 130, 246, 0.45)', color: '#93c5fd', border: '1px solid rgba(147, 197, 253, 0.25)' };
  if (r === 0.0) return { backgroundColor: 'rgba(255, 255, 255, 0.02)', color: '#475569' };
  
  if (r > 0) {
    const alpha = Math.min(0.65, r * 0.7);
    return { backgroundColor: `rgba(16, 185, 129, ${alpha})`, color: '#fff', border: `1px solid rgba(16, 185, 129, ${alpha + 0.1})` };
  } else {
    const alpha = Math.min(0.65, Math.abs(r) * 0.7);
    return { backgroundColor: `rgba(239, 68, 68, ${alpha})`, color: '#fff', border: `1px solid rgba(239, 68, 68, ${alpha + 0.1})` };
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
  let colorClass = 'text-slate-400';
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
    desc = `Sinh viên đạt điểm cao ở môn "${subA}" có tỷ lệ thuận rất cao (khoảng ${Math.round(r * 100)}%) sẽ học tốt môn "${subB}". Ngược lại, nếu sinh viên hổng kiến thức môn "${subA}", nguy cơ rớt môn "${subB}" sẽ cực kỳ nghiêm trọng.`;
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
  const { trainingData } = useStore();
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [predictableSubjects, setPredictableSubjects] = useState([]);
  const [uploadedStudentsData, setUploadedStudentsData] = useState([]);

  // Pearson correlation matrix state
  const [pearsonData, setPearsonData] = useState(null);
  const [pearsonLoading, setPearsonLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [pearsonFilter, setPearsonFilter] = useState('core');

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
    const fetchPearsonMatrix = async () => {
      setPearsonLoading(true);
      try {
        const res = await requestWithRestartRetry(() => api.get('/pearson-matrix'));
        setPearsonData(res.data);
      } catch (err) {
        console.error("Lỗi nạp Pearson Matrix:", err);
      } finally {
        setPearsonLoading(false);
      }
    };
    fetchPearsonMatrix();
  }, []);

  const subjects = predictableSubjects.length > 0 ? predictableSubjects : (trainingData?.stats?.map(s => s.subject) || []);

  const handlePredict = async () => {
    if (!subject) return alert('Vui lòng chọn môn cần dự đoán!');
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
        statusMsg += ` ⚠️ Có ${errorsCount} dòng lỗi bị bỏ qua.`;
        console.warn('Chi tiết lỗi upload:', errorsDetails);
      }
      
      setUploadStatus(statusMsg);
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
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <UploadCloud size={22} className="text-purple-400" /> Tải dữ liệu học vụ mới
          </h3>
          <p className="text-sm text-slate-400 mb-6">EduGuard AI hỗ trợ nạp bảng điểm lớp hoặc bảng điểm cá nhân tùy thích. Hệ thống chỉ lưu khi bạn xác nhận.</p>
          
          <label className="border-2 border-dashed border-purple-500/30 rounded-2xl p-8 text-center hover:bg-purple-500/5 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group-hover:border-purple-500/60">
            <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleUpload} className="hidden" />
            <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="text-purple-300" size={20}/>
            </div>
            <p className="text-slate-300 font-medium">{file ? file.name : 'Kéo thả hoặc Click chọn file Excel/CSV'}</p>
          </label>
          {uploadStatus && <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl text-sm font-medium">{uploadStatus}</div>}
        </div>

        {/* Predict Card */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden hover-glow">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Zap size={22} className="text-blue-400" /> AI Engine Core
          </h3>
          <p className="text-sm text-slate-400 mb-6">EduGuard AI sẽ phân tích các môn tiên quyết có hệ số tương quan (Pearson r) cao nhất để tính toán điểm rủi ro.</p>
          
          <div className="space-y-4">
            <div className="relative">
              <select className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl outline-none focus:border-blue-500/50 text-white appearance-none transition-colors" value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="" className="bg-slate-900 text-slate-400">-- Click chọn môn cần dự báo --</option>
                {subjects.map(s => {
                  if (typeof s === 'string') {
                    return <option key={s} value={s} className="bg-slate-900">{s}</option>;
                  }
                  const { subject: name, missingCount, totalCount } = s;
                  const isDone = missingCount === 0;
                  return (
                    <option key={name} value={name} disabled={isDone} className={`bg-slate-900 ${isDone ? 'text-slate-600' : 'text-white font-medium'}`}>
                      {name} {isDone ? '(Đã có điểm)' : (totalCount === 1 ? '(Chưa có điểm)' : `(${missingCount}/${totalCount} SV thiếu)`)}
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Target size={18}/>
              </div>
            </div>
            <button onClick={handlePredict} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold p-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <span className="animate-pulse">Đang nạp trọng số Neural...</span> : <><Brain size={20} /> Kích hoạt Dự đoán</>}
            </button>
          </div>
        </div>
      </div>

      {/* Pearson Correlation Matrix */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <TrendingUp size={120} className="text-blue-400" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={22} className="text-blue-400" /> Bản Đồ Hệ Số Tương Quan Học Thuật (Pearson Matrix)
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Hệ số Pearson (r) chỉ ra mức độ liên kết học vụ giữa các học phần trong FPT Polytechnic. Giúp phát hiện lỗ hổng kiến thức dây chuyền của sinh viên.
            </p>
          </div>
          
          <div className="flex bg-black/35 p-1 rounded-xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => { setPearsonFilter('core'); setSelectedCell(null); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                pearsonFilter === 'core' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              8 Môn Cốt Lõi
            </button>
            <button
              onClick={() => { setPearsonFilter('all'); setSelectedCell(null); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                pearsonFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất Cả Môn
            </button>
          </div>
        </div>

        {pearsonLoading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"></span>
            <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce delay-75"></span>
            <span className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce delay-150"></span>
            Đang tính toán hệ số tương quan học bạ...
          </div>
        ) : pearsonData ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
            
            {/* Heatmap Grid */}
            <div className="xl:col-span-8 overflow-x-auto rounded-2xl border border-white/5 bg-black/25 p-4">
              <div className="min-w-[640px]">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-[10px] font-bold text-slate-500 text-left w-36 uppercase tracking-wider">Môn học gốc</th>
                      {pearsonData.subjects
                        .filter(sub => pearsonFilter === 'all' || CORE_SUBJECTS_FILTER.includes(sub))
                        .map(sub => (
                          <th key={sub} className="p-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center w-20 truncate max-w-[80px]" title={sub}>
                            {sub.split(' ').pop()}
                          </th>
                        ))
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {pearsonData.matrix
                      .filter(row => pearsonFilter === 'all' || CORE_SUBJECTS_FILTER.includes(row.subject))
                      .map(row => {
                        const activeSubjects = pearsonData.subjects.filter(sub => pearsonFilter === 'all' || CORE_SUBJECTS_FILTER.includes(sub));
                        return (
                          <tr key={row.subject} className="hover:bg-white/5 transition-colors border-b border-white/5">
                            <td className="p-2.5 text-slate-300 font-semibold text-xs text-left truncate max-w-[140px]" title={row.subject}>
                              {row.subject}
                            </td>
                            {activeSubjects.map(subB => {
                              const rRaw = row[subB];
                              const r = (typeof rRaw === 'number' && !isNaN(rRaw)) ? rRaw : 0.0;
                              const isSelected = selectedCell && selectedCell.subA === row.subject && selectedCell.subB === subB;
                              return (
                                <td key={subB} className="p-1">
                                  <button
                                    onClick={() => setSelectedCell({ subA: row.subject, subB, r })}
                                    style={getCellStyle(r)}
                                    className={`w-full aspect-square md:aspect-auto md:py-2 px-1 text-[11px] font-bold rounded-lg transition-all hover:scale-105 hover:shadow-lg flex items-center justify-center cursor-pointer ${
                                      isSelected ? 'ring-2 ring-blue-400 scale-105 shadow-md shadow-blue-500/20' : ''
                                    }`}
                                    title={`${row.subject} ⇄ ${subB}: r = ${r.toFixed(2)}`}
                                  >
                                    {r === 1.0 ? '1.0' : r.toFixed(2)}
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
                <div className="flex justify-end items-center gap-4 mt-3 px-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500/50"></span> Tương quan dương (+)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/40 border border-rose-500/50"></span> Tương quan nghịch (-)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-500/40 border border-blue-400/50"></span> Đồng biến tuyệt đối</span>
                </div>
              </div>
            </div>

            {/* Clicked Details Panel */}
            <div className="xl:col-span-4">
              {selectedCell ? (() => {
                const info = getCorrelationDetails(selectedCell.subA, selectedCell.subB, selectedCell.r);
                return (
                  <div className="glass-card p-5 rounded-2xl border border-white/10 h-full flex flex-col justify-between bg-white/5 relative overflow-hidden shadow-inner">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400"><HelpCircle size={16} /></span>
                        <h4 className="text-sm font-extrabold text-white tracking-wide">Chi tiết liên kết học thuật</h4>
                      </div>
                      
                      <div className="p-3 bg-black/45 border border-white/5 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Cặp môn học</span>
                        <span className="text-xs text-white font-bold block mt-0.5">{info.title}</span>
                      </div>

                      <div className="p-3 bg-black/45 border border-white/5 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Mức độ tương quan</span>
                        <span className={`text-xs font-black block mt-0.5 ${info.class}`}>{info.intensity}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium block">Ý nghĩa khoa học</span>
                        <p className="text-slate-300 text-xs leading-relaxed font-normal">{info.desc}</p>
                      </div>

                      <div className="pt-3 border-t border-white/5 space-y-1">
                        <span className="text-[10px] text-blue-400 uppercase tracking-wider font-bold block flex items-center gap-1">
                          💡 Đề xuất hành động sư phạm
                        </span>
                        <p className="text-emerald-300 text-xs leading-relaxed font-semibold italic">{info.advice}</p>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 mt-4 text-right italic">
                      Dữ liệu tính toán từ {pearsonData.matrix.length} học bạ thực tế.
                    </div>
                  </div>
                );
              })() : (
                <div className="border border-dashed border-white/10 rounded-2xl h-full p-8 flex flex-col items-center justify-center text-center bg-black/15">
                  <div className="bg-slate-800/40 p-3 rounded-2xl border border-white/5 text-slate-500 mb-3">
                    <TrendingUp size={24} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400">Chọn một ô hệ số tương quan</h4>
                  <p className="text-[10px] text-slate-500 mt-1.5 max-w-[200px]">
                    Click vào bất kỳ ô hệ số nào trong ma trận để xem phân tích khoa học và chỉ dẫn hành động sư phạm tương ứng.
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs border border-white/5 rounded-2xl">
            Không thể tải dữ liệu ma trận Pearson. Vui lòng kiểm tra lại kết nối API.
          </div>
        )}
      </div>

      {/* Pending Confirmation Panel */}
      {isPendingSave && (
        <div className="glass-card p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 relative overflow-hidden shadow-2xl animate-fade-in">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Database size={150} className="text-amber-400 animate-pulse" />
          </div>
          
          <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Database size={20} className="text-amber-400" /> Xác nhận lưu trữ học bạ sinh viên
          </h4>

          {fileType === 'transcript' ? (
            <div className="space-y-6">
              <div className="p-4 bg-black/25 border border-white/5 rounded-2xl">
                <p className="text-slate-300 text-xs leading-relaxed flex items-center gap-2">
                  <Info size={16} className="text-blue-400 flex-shrink-0" />
                  <span><strong>Định dạng cá nhân:</strong> Phát hiện file bảng điểm của 1 sinh viên lẻ. Vui lòng nhập thông tin MSSV thực tế dưới đây để hệ thống liên kết học bạ và cho phép tra cứu sau này.</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">MSSV (Mã sinh viên) *</label>
                  <input 
                    type="text" 
                    placeholder="Nhập MSSV (VD: PS12345)..." 
                    value={mssvInput}
                    onChange={e => setMssvInput(e.target.value)}
                    className="w-full p-3.5 bg-black/35 border border-white/10 rounded-xl outline-none focus:border-amber-500/50 text-white text-xs font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Họ và tên sinh viên</label>
                  <input 
                    type="text" 
                    placeholder="Họ tên sinh viên..." 
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="w-full p-3.5 bg-black/35 border border-white/10 rounded-xl outline-none focus:border-amber-500/50 text-white text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Mã lớp</label>
                  <input 
                    type="text" 
                    placeholder="VD: WD18301..." 
                    value={classInput}
                    onChange={e => setClassInput(e.target.value)}
                    className="w-full p-3.5 bg-black/35 border border-white/10 rounded-xl outline-none focus:border-amber-500/50 text-white text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-black/25 border border-white/5 rounded-2xl">
                <p className="text-slate-300 text-xs leading-relaxed flex items-center gap-2">
                  <Info size={16} className="text-blue-400 flex-shrink-0" />
                  <span><strong>Định dạng lớp học:</strong> Phát hiện danh sách điểm lớp gồm <strong>{pendingStudents.length} sinh viên</strong>. Dữ liệu MSSV đã được tự động nạp từ các cột tương ứng.</span>
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto border border-white/5 rounded-2xl bg-black/30">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 uppercase tracking-wider border-b border-white/10 bg-white/5">
                      <th className="p-3">STT</th>
                      <th className="p-3">MSSV</th>
                      <th className="p-3">Họ và tên</th>
                      <th className="p-3">Số môn học có điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingStudents.map((st, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-3 text-slate-500">{index + 1}</td>
                        <td className="p-3 text-blue-300 font-bold font-mono">{st.id}</td>
                        <td className="p-3 text-white font-medium">{st.name || `Sinh viên lớp`}</td>
                        <td className="p-3 text-slate-400 font-mono">
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
          <div className="flex gap-4 mt-6 pt-6 border-t border-white/5 justify-end">
            <button 
              onClick={handleCancelSave}
              className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold border border-rose-500/20 transition-all flex items-center gap-2"
            >
              <XCircle size={14} /> Hủy bỏ tải lên
            </button>
            <button 
              onClick={handleSaveToDatabase}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
            >
              <Save size={14} /> {loading ? 'Đang lưu học bạ...' : 'Xác nhận Lưu Database'}
            </button>
          </div>
        </div>
      )}

      {/* Results Area */}
      {result && result.validation && (
        <div ref={resultsRef} className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          
          {/* XAI Architecture Details */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Activity size={100} />
            </div>
            <h4 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
              <Activity size={24} className="text-emerald-400"/> Kiến trúc XAI (Explainable AI)
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-4">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Thuật toán lõi</p>
                  <p className="text-white font-medium">{result.formula.name}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Hàm toán học</p>
                  <code className="bg-emerald-500/10 px-3 py-1.5 rounded-lg text-emerald-400 font-mono text-sm border border-emerald-500/20">{result.formula.expression}</code>
                  <p className="text-slate-500 text-xs mt-3">{result.formula.explanation}</p>
                </div>
              </div>
              
              <div className="bg-blue-900/10 p-5 rounded-2xl border border-blue-500/10">
                <h5 className="font-bold mb-4 text-sm text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Info size={16} className="text-blue-400"/> Chỉ số Validation (80/20 Split)
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="block text-slate-400 text-xs mb-1">Train Size</span>
                    <span className="font-bold text-blue-300 text-lg">{result.validation.trainSize}</span>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="block text-slate-400 text-xs mb-1">Test Size</span>
                    <span className="font-bold text-amber-300 text-lg">{result.validation.testSize}</span>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="block text-slate-400 text-xs mb-1">Sai số MAE</span>
                    <span className="font-bold text-rose-400 text-lg">{result.validation.mae}</span>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <span className="block text-slate-400 text-xs mb-1">Sai số RMSE</span>
                    <span className="font-bold text-rose-400 text-lg">{result.validation.rmse}</span>
                  </div>
                  <div className="col-span-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex justify-between items-center">
                    <span className="text-emerald-400 font-medium">Độ chính xác (Accuracy)</span>
                    <span className="font-black text-emerald-400 text-xl">{result.validation.accuracy}%</span>
                  </div>
                </div>
              </div>
            </div>

            {result.topFeatures && (
              <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Tính năng đóng góp (Top Features):</p>
                <div className="flex gap-2 flex-wrap">
                  {result.topFeatures.map(f => (
                    <div key={f.subject} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs flex items-center gap-2 hover:bg-white/10 transition-colors">
                      <span className="text-slate-200 font-medium">{f.subject}</span>
                      <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md" title="Hệ số tương quan tuyến tính Pearson (r)">r = {f.r}</span>
                      {f.hybridScore !== undefined && (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md" title="Hệ số tương quan kết hợp sơ đồ môn học tiên quyết (Hybrid Score)">Độ ưu tiên: {f.hybridScore}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Prediction Insights Dashboard */}
          {(() => {
            const totalPreds = result?.predictions?.length || 0;
            const highRiskCount = result?.predictions?.filter(p => p.risk === 'high').length || 0;
            const mediumRiskCount = result?.predictions?.filter(p => p.risk === 'medium').length || 0;
            const lowRiskCount = result?.predictions?.filter(p => p.risk === 'low').length || 0;

            const highPercent = totalPreds > 0 ? ((highRiskCount / totalPreds) * 100).toFixed(1) : 0;
            const mediumPercent = totalPreds > 0 ? ((mediumRiskCount / totalPreds) * 100).toFixed(1) : 0;
            const lowPercent = totalPreds > 0 ? ((lowRiskCount / totalPreds) * 100).toFixed(1) : 0;

            return (
              <div className="mx-8 mt-8 p-6 bg-gradient-to-br from-slate-900/40 via-slate-800/40 to-slate-900/40 border border-white/10 rounded-3xl relative overflow-hidden shadow-xl animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <Zap size={18} className="text-amber-400" /> Báo cáo Phân tích Phổ rủi ro học đường
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Phân tích rủi ro học thuật diện rộng của sinh viên FPT Polytechnic đối với học phần {subject}.</p>
                  </div>
                  
                  {result.validation?.accuracy && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-2xl flex items-center gap-2 self-start sm:self-auto">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-xs font-bold text-emerald-400">Độ chính xác AI: {result.validation.accuracy}%</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex flex-col justify-center items-center">
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-1">Cảnh báo Nguy cơ Cao (Cần Can Thiệp)</span>
                    <span className="text-2xl font-black text-rose-400">{highRiskCount} <span className="text-xs text-slate-500 font-normal">sinh viên ({highPercent}%)</span></span>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col justify-center items-center">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Theo dõi Cần Lưu Ý</span>
                    <span className="text-2xl font-black text-amber-400">{mediumRiskCount} <span className="text-xs text-slate-500 font-normal">sinh viên ({mediumPercent}%)</span></span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-center items-center">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">An Toàn & Ổn Định</span>
                    <span className="text-2xl font-black text-emerald-400">{lowRiskCount} <span className="text-xs text-slate-500 font-normal">sinh viên ({lowPercent}%)</span></span>
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex border border-white/10 mt-6 relative group">
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
            <div className="mx-8 mt-8 p-6 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-blue-500/20 rounded-3xl relative overflow-hidden shadow-2xl animate-fade-in group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-700 pointer-events-none"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                {/* Left Side: Score Spotlight */}
                <div className="lg:col-span-1 flex flex-col justify-between p-6 bg-black/35 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] text-blue-400 uppercase tracking-widest font-black block">Học bạ Tiên lượng</span>
                        <h5 className="text-lg font-black text-white mt-1 tracking-wide">{singleStudent.name}</h5>
                        <span className="text-xs font-mono text-slate-400 block mt-0.5">MSSV: {singleStudent.id} | Lớp: {singleStudent.classCode || 'WD18301'}</span>
                      </div>
                      
                      {singleStudent.isPredicted ? (
                        <span className="text-[9px] bg-purple-500/25 border border-purple-500/35 text-purple-300 px-2 py-0.5 rounded-md font-black tracking-wide uppercase">AI DỰ ĐOÁN</span>
                      ) : (
                        <span className="text-[9px] bg-blue-500/25 border border-blue-500/35 text-blue-300 px-2 py-0.5 rounded-md font-black tracking-wide uppercase">THỰC TẾ</span>
                      )}
                    </div>
                  </div>

                  <div className="my-6 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Điểm số mục tiêu</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-5xl font-black tracking-tight text-glow-green ${singleStudent.predicted >= 6.5 ? 'text-emerald-400 text-glow-green' : singleStudent.predicted >= 5 ? 'text-amber-400' : 'text-rose-500 text-glow-red'}`}>
                          {typeof singleStudent.predicted === 'number' ? singleStudent.predicted.toFixed(1) : singleStudent.predicted}
                        </span>
                        <span className="text-lg font-bold text-slate-400">đ</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Cảnh báo rủi ro</span>
                      <div className="mt-1.5">
                        {singleStudent.risk === 'high' ? (
                          <span className="bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]"><AlertTriangle size={14}/> NGUY CƠ CAO</span>
                        ) : singleStudent.risk === 'medium' ? (
                          <span className="bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.15)]"><Info size={14}/> THEO DÕI</span>
                        ) : (
                          <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"><CheckCircle size={14}/> ỔN ĐỊNH</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Can thiệp sư phạm:</span>
                    <button 
                      onClick={() => handleToggleIntervention(singleStudent.id, singleStudent.intervened)} 
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${singleStudent.intervened ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white'}`}
                    >
                      <HeartHandshake size={14} className={singleStudent.intervened ? 'text-emerald-400' : 'text-slate-400'} />
                      {singleStudent.intervened ? 'Đã Can Thiệp' : 'Đánh dấu hỗ trợ'}
                    </button>
                  </div>
                </div>

                {/* Right Side (Col-span-2): Explainable AI & Action Recommendations */}
                <div className="lg:col-span-2 flex flex-col justify-between p-6 bg-black/25 rounded-2xl border border-white/5">
                  <div>
                    <h6 className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-3">Phân tích yếu tố ảnh hưởng (Explainable AI)</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Môn học tác động tích cực</span>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                          {singleStudent.reasons?.filter(r => r.impact === 'positive').length > 0 ? (
                            singleStudent.reasons?.filter(r => r.impact === 'positive').map((r, i) => (
                              <div key={i} className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs flex items-center gap-2 text-emerald-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="font-semibold">{r.subject}: {r.score}đ</span>
                                <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded-md font-bold">r = {r.r}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic block">Không có môn bổ trợ điểm nổi bật.</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Môn học kéo điểm / Rủi ro hổng</span>
                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                          {singleStudent.reasons?.filter(r => r.impact === 'negative').length > 0 ? (
                            singleStudent.reasons?.filter(r => r.impact === 'negative').map((r, i) => (
                              <div key={i} className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl text-xs flex items-center gap-2 text-rose-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></div>
                                <span className="font-semibold">{r.subject}: {r.score}đ</span>
                                <span className="text-[10px] bg-rose-500/10 px-1.5 py-0.5 rounded-md font-bold">r = {r.r}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic block">Hệ thống chưa ghi nhận môn hổng kiến thức.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black block mb-1">🎯 Đề xuất hành động từ Cố vấn AI</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium italic">
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
                <h4 className="text-xl font-bold text-white">
                  {showOnlyUploaded ? (
                    '🎯 Kết quả Dự đoán danh sách nạp'
                  ) : (
                    '🎯 Danh sách phân tích mức độ cảnh báo'
                  )}
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
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
                  className="px-4 py-2 bg-black/35 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-white text-xs font-medium w-full sm:w-60"
                />
                
                <select 
                  value={listFilter}
                  onChange={e => setListFilter(e.target.value)}
                  className="px-4 py-2 bg-black/35 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 text-slate-300 text-xs font-semibold"
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
                    <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/10">
                      <th className="p-4 font-semibold">MSSV</th>
                      <th className="p-4 font-semibold">Họ và tên</th>
                      <th className="p-4 font-semibold">Điểm số (Thực tế/Dự đoán)</th>
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
                          className={`border-b border-white/5 hover:bg-white/10 transition-all cursor-pointer ${
                            selectedPredictStudentId === p.id 
                              ? 'bg-blue-600/10 border-l-4 border-l-blue-500' 
                              : ''
                          }`}
                        >
                          <td className="p-4 font-medium text-slate-300">
                            <Link to={`/student/${p.id}`} className="text-blue-400 hover:text-blue-300 transition-colors font-bold hover:underline font-mono">
                              {p.id}
                            </Link>
                          </td>
                          <td className="p-4 text-white">
                            <Link to={`/student/${p.id}`} className="hover:text-blue-400 transition-colors font-semibold">
                              {p.name}
                            </Link>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              <span className={`text-lg font-black ${p.predicted >= 6.5 ? 'text-emerald-400 text-glow-green' : p.predicted >= 5 ? 'text-amber-400' : 'text-rose-500 text-glow-red'}`}>
                                {typeof p.predicted === 'number' ? p.predicted.toFixed(1) : p.predicted}đ
                              </span>
                              {p.isPredicted ? (
                                <span className="text-[9px] bg-purple-500/15 border border-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md font-extrabold w-max tracking-wide uppercase">AI Dự đoán</span>
                              ) : (
                                <span className="text-[9px] bg-blue-500/15 border border-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-md font-extrabold w-max tracking-wide uppercase">Thực tế</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {p.risk === 'high' ? <span className="bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><AlertTriangle size={12}/> Nguy cơ</span> :
                             p.risk === 'medium' ? <span className="bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><Info size={12}/> Theo dõi</span> :
                             <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><CheckCircle size={12}/> Ổn định</span>}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1.5 font-normal">
                              {p.reasons?.map((r, i) => (
                                <div key={i} className={`text-xs flex items-center gap-2 ${r.impact === 'negative' ? 'text-rose-400' : r.impact === 'positive' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${r.impact === 'negative' ? 'bg-rose-400' : r.impact === 'positive' ? 'bg-emerald-400' : 'bg-slate-400'}`}></div>
                                  {r.explanation}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleToggleIntervention(p.id, p.intervened)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 mx-auto transition-all ${p.intervened ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white'}`}>
                              <HeartHandshake size={14} className={p.intervened ? 'text-emerald-400' : 'text-slate-400'} />
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
                      className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Xem thêm 30 sinh viên... ({filteredPredictions.length - visibleCount} còn lại)
                    </button>
                  </div>
                )}
              </>
            ) : (
              !showOnlyUploaded && (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-black/15 rounded-3xl border border-white/5 relative overflow-hidden shadow-inner mt-4">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Brain size={120} className="text-blue-500" />
                  </div>
                  <Brain size={48} className="text-blue-500/30 mb-4 animate-pulse" />
                  <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Hỗ trợ Phân tích & Tiên lượng Cá nhân</h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
                    Hệ thống EduGuard AI đang lưu trữ <strong>{result.predictions.length} hồ sơ sinh viên</strong> trong bộ nhớ học tập. 
                    Để có trải nghiệm tối ưu nhất, vui lòng nhập MSSV (VD: <code>PS23116</code>) hoặc tên của sinh viên bạn muốn xem vào thanh tìm kiếm ở trên để nhận báo cáo phân tích rủi ro chi tiết ngay lập tức!
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Warning Alert if no regression data is available */}
      {result && result.status === 'warning' && (
        <div className="glass-card p-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 text-amber-300 relative overflow-hidden shadow-xl animate-fade-in">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <AlertTriangle size={80} className="text-amber-400 animate-pulse" />
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-amber-500/25 p-3 rounded-2xl border border-amber-500/30">
              <AlertTriangle size={24} className="text-amber-400" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-2">Chưa đủ dữ liệu hồi quy</h4>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                {result.message || 'Mô hình học máy hiện chưa có đủ số lượng mẫu sinh viên để xây dựng hồi quy tuyến tính'} cho môn học <strong>{result.target}</strong>. Điểm số của sinh viên không thể dự báo chính xác bằng mô hình HK-Pearson hiện tại.
              </p>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setSubject('')} className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/20 transition-all">Chọn môn học khác</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
