import React, { useState, useEffect } from 'react';
import { Network, AlertTriangle, ArrowRight, ShieldAlert, ShieldCheck, CheckCircle2, User, Loader2, Info } from 'lucide-react';
import { api } from '../lib/api';

const AcademicRiskMap = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [riskData, setRiskData] = useState(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);

  // Search for students
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/students-search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Risk Chain when a student is selected
  const loadStudentRisk = async (mssv) => {
    setIsLoadingRisk(true);
    setRiskData(null);
    try {
      const res = await api.get(`/graph/student-risk/${mssv}`);
      setRiskData(res.data);
    } catch (err) {
      console.error(err);
      alert('Không thể phân tích chuỗi rủi ro cho sinh viên này.');
    } finally {
      setIsLoadingRisk(false);
    }
  };

  // Demo List of students if search is empty
  const demoStudents = [
    { id: 'PC07988', name: 'Nguyễn Văn A' },
    { id: 'PS27463', name: 'Lê Thị B' },
    { id: 'PS28758', name: 'Trần Văn C' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Network className="text-blue-500" size={32} />
            Academic Risk Map
          </h1>
          <p className="text-slate-400 mt-2">Phân tích chuỗi rủi ro học vụ (Learning Path Risk Analysis)</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* LEFT COLUMN: Student Selection (3 cols) */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-5 border border-white/5 flex flex-col h-full">
          <h2 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
            <User size={18} className="text-blue-400" /> Chọn Sinh Viên
          </h2>
          
          <input
            type="text"
            placeholder="Tìm MSSV (vd: PC07988)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none mb-4"
          />

          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {(searchQuery ? searchResults : demoStudents).map(st => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedStudent(st);
                  loadStudentRisk(st.id);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedStudent?.id === st.id 
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <div className="font-semibold text-slate-200">{st.id}</div>
                {st.name && <div className="text-xs text-slate-400 mt-1">{st.name}</div>}
              </button>
            ))}
            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center text-slate-500 text-sm mt-4">Không tìm thấy sinh viên</div>
            )}
            {isSearching && (
              <div className="flex justify-center mt-4"><Loader2 className="animate-spin text-blue-500" size={20} /></div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Risk Chain Flow (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-3 opacity-10"><Network size={120} /></div>
          <h2 className="font-semibold text-lg text-white mb-6 relative z-10">Student Risk Chain</h2>
          
          {!selectedStudent ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Network size={48} className="mb-4 opacity-50" />
              <p>Chọn một sinh viên để xem chuỗi rủi ro</p>
            </div>
          ) : isLoadingRisk ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Loader2 size={48} className="mb-4 animate-spin text-blue-500" />
              <p>Đang phân tích Knowledge Graph...</p>
            </div>
          ) : riskData && riskData.nodes.length > 0 ? (
            <div className="flex-1 overflow-y-auto relative z-10 px-2 py-4">
               {/* Custom vertical flowchart rendering */}
               <div className="flex flex-col items-center space-y-4">
                 {riskData.nodes.map((node, idx) => {
                    // Check if node is a source of a critical edge
                    const isCriticalSource = riskData.edges.some(e => e.from === node.id && e.type === 'critical');
                    const isCriticalTarget = riskData.edges.some(e => e.to === node.id && e.type === 'critical');
                    
                    let bgClass = "bg-slate-800/80 border-slate-600";
                    let icon = <CheckCircle2 className="text-green-400" size={20} />;
                    
                    if (node.status === 'Failed' || node.status === 'Missing') {
                       bgClass = "bg-red-900/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                       icon = <ShieldAlert className="text-red-400" size={20} />;
                    } else if (node.status === 'Warning') {
                       bgClass = "bg-orange-900/40 border-orange-500";
                       icon = <AlertTriangle className="text-orange-400" size={20} />;
                    } else if (node.status === 'Predicted Risk' || node.status === 'At Risk' || isCriticalTarget) {
                       bgClass = "bg-rose-900/30 border-rose-500 border-dashed border-2";
                       icon = <ShieldAlert className="text-rose-400" size={20} />;
                    }

                    return (
                      <React.Fragment key={node.id}>
                        <div className={`w-full max-w-sm rounded-xl p-4 border transition-all ${bgClass} backdrop-blur-md`}>
                          <div className="flex items-start justify-between">
                             <div>
                                <div className="text-xs font-bold text-slate-400 mb-1">{node.id}</div>
                                <div className="font-semibold text-white text-sm">{node.name}</div>
                             </div>
                             <div>{icon}</div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs">
                             <span className="text-slate-400">Status: <span className="font-medium text-slate-200">{node.status}</span></span>
                             <span className="text-slate-400">Score: <span className="font-medium text-white">{node.score !== null ? node.score : 'N/A'}</span></span>
                          </div>
                        </div>
                        
                        {/* Render downward arrow if not the last node and there is an edge */}
                        {idx < riskData.nodes.length - 1 && (
                          <div className="flex flex-col items-center">
                            <div className={`w-0.5 h-6 ${isCriticalSource ? 'bg-red-500' : 'bg-slate-600'}`}></div>
                            <ArrowRight className={`transform rotate-90 -mt-1 ${isCriticalSource ? 'text-red-500' : 'text-slate-600'}`} size={16} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                 })}
               </div>
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <ShieldCheck size={48} className="mb-4 text-green-500 opacity-50" />
              <p>Sinh viên này không có chuỗi rủi ro nghiêm trọng.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Explanation & Actions (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-blue-500/20 bg-blue-900/10 shadow-[0_0_30px_rgba(59,130,246,0.05)] flex-1">
            <h2 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
              <Info size={18} className="text-blue-400" /> AI Risk Explanation
            </h2>
            
            {!selectedStudent || !riskData ? (
              <p className="text-sm text-slate-400">Chờ dữ liệu phân tích...</p>
            ) : riskData.explanations.length > 0 ? (
              <div className="space-y-4">
                {riskData.explanations.map((exp, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-rose-400" />
                      <span className="text-sm font-bold text-slate-200">{exp.course} - {exp.status}</span>
                    </div>
                    <p className="text-xs text-rose-300 font-medium mb-1">Căn nguyên: {exp.impact}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{exp.explanation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-sm text-green-400">Không phát hiện chuỗi hổng kiến thức nghiêm trọng.</p>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5">
             <h2 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-orange-400" /> Suggested Actions
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Đăng ký phụ đạo môn nền tảng</div>
                  <div className="text-xs text-slate-500">Yêu cầu sinh viên học lại các môn rớt.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Gắn cờ theo dõi đặc biệt</div>
                  <div className="text-xs text-slate-500">Cảnh báo giảng viên môn chuyên ngành.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Gửi cảnh báo qua Email/SMS</div>
                  <div className="text-xs text-slate-500">Thông báo tự động tới sinh viên và gia đình.</div>
                </div>
              </label>
            </div>
            
            <button className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]">
              Cập nhật hồ sơ Can thiệp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicRiskMap;
