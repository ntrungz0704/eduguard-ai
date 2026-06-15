import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { api } from '../lib/api';
import { Search, GraduationCap } from 'lucide-react';

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

  const query = useStore(state => state.searchQuery);
  const setQuery = useStore(state => state.setSearchQuery);
  const sortType = useStore(state => state.sortType);
  const setSortType = useStore(state => state.setSortType);
  const riskFilter = useStore(state => state.riskFilter);
  const setRiskFilter = useStore(state => state.setRiskFilter);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    api.get('/students-search?q=').then(res => setAllStudents(res.data)).catch(console.error);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) {
      setSearchParams({}, { replace: true });
      navigate(`/student/${urlId}`, { replace: true });
    }
  }, [searchParams, navigate, setSearchParams]);

  useEffect(() => {
    if (activeStudent) {
      const studentId = activeStudent.mssv || activeStudent.id;
      setSearchParams({}, { replace: true });
      navigate(`/student/${studentId}`);
    }
  }, [activeStudent?.mssv, activeStudent?.id, navigate, setSearchParams]);

  // Auto-search on typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(query);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Top Banner */}
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

      <div className="w-full space-y-6">
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
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 font-semibold">
                Đang tìm kiếm dữ liệu sinh viên...
              </div>
            ) : [...(query.trim() ? results : allStudents)]
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
                  className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all text-left flex items-start justify-between group bg-white dark:bg-slate-900"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-gradient-to-tr dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-900 dark:text-white font-bold group-hover:dark:from-blue-600 group-hover:dark:to-indigo-600 transition-colors">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-500 dark:group-hover:text-blue-450 transition-colors">{st.name}</h5>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{st.id} • Lớp {st.classCode || 'WD18301'}</p>
                    </div>
                  </div>
                  {riskCount > 0 && (
                    <span className="bg-rose-500/20 text-rose-500 dark:text-rose-450 border border-rose-200 dark:border-rose-500/30 text-[10px] px-2 py-1 rounded-lg font-bold">
                      {riskCount} rủi ro
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
