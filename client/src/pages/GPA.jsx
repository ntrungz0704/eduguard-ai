import { useState, useEffect } from 'react';
import { Target, Shuffle, AlertCircle, TrendingUp, Compass, User, TrendingDown, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store';

const isConditionalCourse = (courseName, courseId) => {
  const name = (courseName || '').toLowerCase();
  const cid = (courseId || '').toUpperCase();
  return (
    name.includes('thể chất') || name.includes('quốc phòng') ||
    name.includes('thực tập tốt nghiệp') || name.includes('vovinam') ||
    name.includes('gdqp') || cid.includes('VIE103') || cid.includes('VIE104') ||
    cid.includes('PRO110') || cid.includes('PRO115') || cid.includes('PRO116')
  );
};

export default function GPA() {
  const [targetGPA, setTargetGPA] = useState(7.5);
  const [remainingCredits, setRemainingCredits] = useState(30);
  
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  const [studentData, setStudentData] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  
  const [metrics, setMetrics] = useState({
    currentGPA: 0,
    completedCredits: 0,
    attendance: 0,
    dangerCourses: [],
    riskLevel: 'LOW',
    trend: 'stable'
  });

  const currentUser = useStore(state => state.currentUser);
  const isStudent = currentUser?.role === 'STUDENT';

  useEffect(() => {
    if (isStudent && currentUser?.id) {
      setSelectedStudentId(currentUser.id);
      fetchStudentData(currentUser.id);
    } else {
      api.get('/students-search?q=').then(res => setStudents(res.data)).catch(console.error);
    }
  }, [isStudent, currentUser]);

  const fetchStudentData = async (idParam) => {
    const id = (typeof idParam === 'string' ? idParam : selectedStudentId).trim().toUpperCase();
    if (!id) {
      setStudentData(null);
      return;
    }
    
    setLoadingStudent(true);
    try {
      const res = await api.get(`/students/${id}`);
      const data = res.data;
      setStudentData(data);
      
      const validScores = data.scores?.filter(s => s.value !== null && s.status === 'PASSED') || [];
      const academicScores = validScores.filter(s => !isConditionalCourse(s.course?.name || s.courseId, s.courseId));
      
      let totalScoreWeight = 0;
      let totalCredits = 0;
      
      academicScores.forEach(s => {
        const credits = s.course?.credits || 3;
        totalScoreWeight += (s.value * credits);
        totalCredits += credits;
      });

      const gpa = totalCredits > 0 ? (Math.round(((totalScoreWeight / totalCredits) + 1e-9) * 10) / 10).toFixed(1) : 0;
      
      // Compute danger courses (predictions with HIGH risk or FAILED)
      const failed = data.scores?.filter(s => s.status === 'FAILED').map(s => s.courseId) || [];
      const highRisk = data.predictions?.filter(p => p.risk === 'HIGH').map(p => p.courseId) || [];
      const dangers = [...new Set([...failed, ...highRisk])];
      
      // Compute average attendance of studying courses
      const studying = data.scores?.filter(s => s.status === 'STUDYING') || [];
      const att = studying.length > 0 ? studying.reduce((acc, s) => acc + (s.attendance || 100), 0) / studying.length : 100;

      // Estimate trend based on recent failures
      const trend = failed.length > 0 ? 'down' : 'up';
      const riskLevel = dangers.length >= 2 ? 'HIGH' : (dangers.length === 1 ? 'MEDIUM' : 'LOW');

      setMetrics({
        currentGPA: parseFloat(gpa),
        completedCredits: totalCredits,
        attendance: Math.round(att),
        dangerCourses: dangers,
        riskLevel,
        trend
      });
      
      setTargetGPA(Math.min(10, Math.ceil(parseFloat(gpa) * 10) / 10 + 0.5)); // default target a bit higher

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudent(false);
    }
  };

  const calculateSimulation = () => {
    if (!studentData) return null;
    const currentPoints = metrics.currentGPA * metrics.completedCredits;
    const totalCredits = parseFloat(metrics.completedCredits) + parseFloat(remainingCredits);
    const targetPoints = targetGPA * totalCredits;
    const requiredPoints = targetPoints - currentPoints;
    const requiredGPA = requiredPoints / remainingCredits;

    const isPossible = requiredGPA <= 10;
    
    // Probability estimation
    let prob = 100;
    if (!isPossible) prob = 0;
    else {
      // The harder the required GPA is compared to current GPA, the lower the probability
      const diff = requiredGPA - metrics.currentGPA;
      if (diff > 2) prob = 10;
      else if (diff > 1) prob = 40;
      else if (diff > 0) prob = 70;
      else prob = 95;
      
      // Penalize by risk
      if (metrics.riskLevel === 'HIGH') prob -= 30;
      else if (metrics.riskLevel === 'MEDIUM') prob -= 15;
    }
    
    prob = Math.max(0, Math.min(100, prob));

    return {
      requiredGPA: requiredGPA.toFixed(2),
      isPossible,
      totalCredits,
      probability: prob
    };
  };

  const simulation = calculateSimulation();

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-blue-600 rounded-2xl shadow-lg shadow-sm dark:shadow-cyan-500/20">
            <Compass size={32} className="text-slate-900 dark:text-white"/>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Trí tuệ Học thuật AI (Academic Intelligence)</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Hệ thống phân tích và mô phỏng GPA tiên tiến.</p>
          </div>
        </div>

        {isStudent ? (
          <div className="relative z-10 w-full md:w-auto group text-right">
            <label className="block text-xs uppercase tracking-wider font-semibold text-cyan-400 mb-2 flex items-center justify-end gap-2"><User size={14}/> Hồ sơ của bạn</label>
            <div className="text-xl font-bold text-slate-900 dark:text-white uppercase px-4 py-2 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl">
              {currentUser.name} ({currentUser.id})
            </div>
          </div>
        ) : (
          <div className="relative z-10 w-full md:w-80 group">
            <label className="block text-xs uppercase tracking-wider font-semibold text-cyan-400 mb-2 flex items-center gap-2"><User size={14}/> Phân tích theo sinh viên</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nhập MSSV (VD: PS12345)..." 
                value={selectedStudentId} 
                onChange={e => setSelectedStudentId(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && fetchStudentData()}
                className="w-full p-4 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-cyan-500/50 text-slate-900 dark:text-white transition-all font-bold uppercase"
              />
              <button 
                onClick={fetchStudentData} 
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-900 dark:text-white p-4 rounded-2xl transition-colors shadow-lg shadow-sm dark:shadow-cyan-500/20 font-bold whitespace-nowrap"
              >
                Phân tích
              </button>
            </div>
          </div>
        )}
      </div>

      {!studentData && !loadingStudent && (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center opacity-50">
          <Activity size={64} className="text-slate-600 mb-4 animate-pulse" />
          <h3 className="text-xl text-slate-900 dark:text-white font-semibold mb-2">Chưa chọn sinh viên</h3>
          <p className="text-slate-600 dark:text-slate-400">Vui lòng chọn một sinh viên ở góc trên để hệ thống AI tiến hành phân tích Snapshot.</p>
        </div>
      )}

      {loadingStudent && (
        <div className="glass-card p-12 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 border-4 border-cyan-200 dark:border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl text-cyan-400 font-bold mb-2">🤖 Công cụ AI đang Phân tích...</h3>
          <p className="text-slate-600 dark:text-slate-400">Đang cào dữ liệu học bạ và chạy mô hình học máy phân tích rủi ro...</p>
        </div>
      )}

      {studentData && !loadingStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: Student Snapshot & AI Insight */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Snapshot Card */}
            <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-600 flex items-center justify-center text-2xl font-bold text-slate-900 dark:text-white shadow-lg">
                    {studentData.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{studentData.name}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{studentData.mssv} • {studentData.classCode || 'WD18301'}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${metrics.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-200 dark:border-rose-500/50' : metrics.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-200 dark:border-amber-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-200 dark:border-emerald-500/50'}`}>
                  {metrics.riskLevel === 'HIGH' ? '🔴 Rủi ro cao' : metrics.riskLevel === 'MEDIUM' ? '🟡 Rủi ro trung bình' : '🟢 Rủi ro thấp'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-100 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">GPA</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.currentGPA}</p>
                </div>
                <div className="bg-slate-100 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Tín chỉ</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.completedCredits}</p>
                </div>
                <div className="bg-slate-100 dark:bg-black/20 rounded-2xl p-4 border border-slate-200 dark:border-white/5 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Chuyên cần</p>
                  <p className={`text-2xl font-bold ${metrics.attendance < 70 ? 'text-rose-400' : 'text-emerald-400'}`}>{metrics.attendance}%</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4">
                  <p className="text-xs text-rose-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-2"><AlertCircle size={14}/> Môn học nguy hiểm</p>
                  <div className="flex flex-wrap gap-2">
                    {metrics.dangerCourses.length > 0 ? metrics.dangerCourses.map(c => (
                      <span key={c} className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-lg text-sm font-semibold border border-rose-200 dark:border-rose-500/30">{c}</span>
                    )) : <span className="text-slate-600 dark:text-slate-400 text-sm">Không có môn học nguy hiểm</span>}
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3">
                  {metrics.trend === 'down' ? <TrendingDown className="text-rose-400" /> : <TrendingUp className="text-emerald-400" />}
                  <div>
                    <p className="text-xs text-indigo-400 uppercase tracking-wider font-bold mb-1">Xu hướng học lực</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{metrics.trend === 'down' ? 'Điểm có dấu hiệu giảm trong 2 kỳ liên tiếp' : 'Duy trì phong độ học tập khá ổn định'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insight Card */}
            <div className="glass-card p-6 rounded-3xl border border-cyan-200 dark:border-cyan-500/30 relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-cyan-900/20 dark:to-blue-900/10 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap size={64} />
              </div>
              <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <Zap size={20} className="fill-cyan-400"/> AI Insight
              </h3>
              
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 text-sm font-medium">
                Sinh viên có xu hướng <span className="text-slate-900 dark:text-white font-bold">{metrics.trend === 'down' ? 'giảm phong độ học tập' : 'giữ vững thành tích'}</span> trong các học kỳ gần nhất.
              </p>
              
              <div className="space-y-2 mb-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">Nguyên nhân / Đánh giá:</p>
                <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2 ml-4 list-disc marker:text-cyan-500">
                  {metrics.attendance < 70 && <li>Chỉ số Attendance quá thấp (<span className="text-rose-400 font-bold">{metrics.attendance}%</span>) dẫn đến nguy cơ cấm thi trực tiếp.</li>}
                  {metrics.dangerCourses.map(c => (
                    <li key={c}><span className="text-slate-900 dark:text-white font-bold">{c}</span> chưa vững nền tảng, có nguy cơ kéo theo rủi ro học vụ dây chuyền.</li>
                  ))}
                  {metrics.dangerCourses.length === 0 && metrics.attendance >= 70 && (
                     <li>Thái độ học tập tốt, các môn cơ sở đều đạt kết quả an toàn. Hệ thống chưa phát hiện rủi ro lớn.</li>
                  )}
                </ul>
              </div>
              
            </div>

          </div>

          {/* RIGHT PANEL: Simulation Result & Slider */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Target className="text-amber-400"/> Tùy chỉnh What-if
              </h3>
              
              <div className="mb-8 bg-slate-200 dark:bg-black/40 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">Mục tiêu GPA Tốt nghiệp</label>
                  <span className="text-4xl font-black text-amber-400 text-glow-amber">{targetGPA.toFixed(1)}</span>
                </div>
                <div className="py-4">
                  <input 
                    type="range" 
                    min={Math.floor(metrics.currentGPA)} 
                    max="10" 
                    step="0.1" 
                    value={targetGPA} 
                    onChange={e => setTargetGPA(parseFloat(e.target.value))}
                    className="w-full h-3 bg-slate-50 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-bold mt-1 px-1">
                  <span>Current: {metrics.currentGPA}</span>
                  <span>Max: 10.0</span>
                </div>
              </div>

              <div className="group mb-2">
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400 mb-2">Số tín chỉ còn lại (Dự kiến đăng ký thêm)</label>
                <input type="number" value={remainingCredits} onChange={e => setRemainingCredits(e.target.value)} className="w-full p-4 bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 text-slate-900 dark:text-white transition-all text-xl font-bold" />
              </div>
            </div>

            {/* AI Simulation Results */}
            {simulation && (
              <div className="glass-card p-8 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden shadow-2xl">
                <div className={`absolute top-0 right-0 w-80 h-80 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${simulation.isPossible ? (simulation.probability > 60 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-rose-500'}`}></div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">📈 Kết quả Mô phỏng AI (Simulation)</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
                  <div className="bg-slate-200 dark:bg-black/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5 flex flex-col justify-center items-center relative overflow-hidden group hover:border-white/10 transition-all">
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400 mb-3">GPA Môn còn lại cần đạt</span>
                    <span className={`text-5xl font-black ${!simulation.isPossible ? 'text-rose-500 text-glow-red' : 'text-slate-900 dark:text-white'}`}>
                      {simulation.isPossible ? simulation.requiredGPA : 'Vượt trần'}
                    </span>
                  </div>

                  <div className="bg-slate-200 dark:bg-black/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5 flex flex-col justify-center items-center relative overflow-hidden group hover:border-white/10 transition-all">
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-600 dark:text-slate-400 mb-3">Xác suất khả thi (AI)</span>
                    <div className="flex items-end gap-1">
                      <span className={`text-5xl font-black ${simulation.probability >= 70 ? 'text-emerald-400 text-glow-green' : (simulation.probability >= 30 ? 'text-amber-400 text-glow-amber' : 'text-rose-500 text-glow-red')}`}>
                        {simulation.probability}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider mb-2">Hành động Khuyến nghị:</p>
                  {simulation.probability >= 70 ? (
                    <div className="bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-5 rounded-2xl flex items-start gap-4">
                      <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={24}/>
                      <div>
                        <p className="text-emerald-400 font-bold mb-2 text-lg">Khả thi cao!</p>
                        <ul className="text-sm text-emerald-200/90 space-y-2 list-disc ml-4">
                          <li>Chỉ cần duy trì trung bình các môn còn lại ≥ <b className="text-slate-900 dark:text-white">{simulation.requiredGPA}</b>.</li>
                          <li>Cố gắng không rớt thêm môn nào trong nhóm rủi ro cao.</li>
                          <li>Tiếp tục phát huy phong độ học tập và giữ điểm danh đầy đủ.</li>
                        </ul>
                      </div>
                    </div>
                  ) : simulation.probability >= 30 ? (
                    <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-5 rounded-2xl flex items-start gap-4">
                      <AlertCircle className="text-amber-400 shrink-0 mt-1" size={24}/>
                      <div>
                        <p className="text-amber-400 font-bold mb-2 text-lg">Thử thách trung bình - khó</p>
                        <ul className="text-sm text-amber-200/90 space-y-2 list-disc ml-4">
                          <li>Cần nỗ lực cực kỳ lớn, duy trì điểm trung bình các môn còn lại ≥ <b className="text-slate-900 dark:text-white">{simulation.requiredGPA}</b>.</li>
                          <li>Cải thiện chuyên cần ngay lập tức để tránh rớt do điểm quá trình.</li>
                          {metrics.dangerCourses.length > 0 && <li>Bắt buộc học kèm mentor các môn rủi ro cao: <b className="text-slate-900 dark:text-white">{metrics.dangerCourses.join(', ')}</b>.</li>}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-5 rounded-2xl flex items-start gap-4">
                      <AlertCircle className="text-rose-400 shrink-0 mt-1" size={24}/>
                      <div>
                        <p className="text-rose-400 font-bold mb-2 text-lg">Rất rủi ro / Bất khả thi</p>
                        <ul className="text-sm text-rose-200/90 space-y-2 list-disc ml-4">
                          {simulation.isPossible ? (
                            <li>Yêu cầu điểm số trung bình quá cao (<b className="text-slate-900 dark:text-white">{simulation.requiredGPA}</b>), gần như điểm tuyệt đối. Rất khó đạt được nếu không có phương pháp học đột phá.</li>
                          ) : (
                            <li>Điểm yêu cầu vượt quá 10.0. Toán học chứng minh bạn <b>không thể</b> đạt mốc {targetGPA} với số tín chỉ còn lại này.</li>
                          )}
                          <li>Khuyến nghị: <b>Nên hạ mục tiêu GPA xuống</b> để hệ thống mô phỏng lại phương án thực tế hơn.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
