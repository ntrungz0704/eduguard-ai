import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import { api } from './lib/api';
import { LayoutDashboard, TrendingUp, Calculator, Settings, Sparkles, BrainCircuit, Search, User, Hash, ChevronRight, Loader2, MessageSquare, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Predict from './pages/Predict';
import GPA from './pages/GPA';
import StudentSearch from './pages/StudentSearch';
import StudentProfile from './pages/StudentProfile';
import AIChat from './pages/AIChat';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import Inbox from './pages/Inbox';
import Interventions from './pages/Interventions';
import { LogOut, GraduationCap, Mails, HeartHandshake } from 'lucide-react';

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const location = useLocation();
  const currentUser = useStore(state => state.currentUser);
  
  const advisorNavItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Tổng quan (Dashboard)' },
    { path: '/search', icon: <Search size={20} />, label: 'Tra cứu học vụ' },
    { path: '/interventions', icon: <HeartHandshake size={20} />, label: 'Quản lý Can thiệp' },
    { path: '/predict', icon: <TrendingUp size={20} />, label: 'Dự đoán & Cảnh báo' },
    { path: '/gpa', icon: <Calculator size={20} />, label: 'Mục tiêu GPA & What-if' },
    { path: '/inbox', icon: <Mails size={20} />, label: 'Hộp thư' },
    { path: '/chat', icon: <MessageSquare size={20} />, label: 'Trợ lý AI' }
  ];

  const studentNavItems = [
    { path: '/student-dashboard', icon: <LayoutDashboard size={20} />, label: 'Bảng điểm của tôi' },
    { path: '/chat', icon: <MessageSquare size={20} />, label: 'Gia sư AI' },
    { path: '/inbox', icon: <Mails size={20} />, label: 'Tin nhắn Cố vấn' }
  ];

  const navItems = currentUser?.role === 'STUDENT' ? studentNavItems : advisorNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside className={`w-64 glass-panel border-r border-white/5 h-screen fixed top-0 left-0 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center px-6 border-b border-white/10 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-blue-500/20">
            <BrainCircuit className="text-white" size={22} />
          </div>
          <h1 className="font-bold text-2xl tracking-tight">Edu<span className="text-blue-500">Guard</span></h1>
          
          <button 
            className="md:hidden absolute right-4 text-slate-400 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
      
      <div className="p-6">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">Phân tích Học vụ</div>
        <nav className="space-y-2">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden group
                  ${isActive 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] rounded-r-md"></div>}
                <div className={`${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                  {item.icon}
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-white/5">
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/5 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20"><Sparkles size={40} /></div>
          <h4 className="text-sm font-bold text-white mb-1">AI Engine Active</h4>
          <p className="text-xs text-slate-400">Powered by Pearson & Regression Model</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-400 font-medium">Hệ thống ổn định</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

const Header = ({ setMobileMenuOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const setActiveStudent = useStore(state => state.setActiveStudent);
  const activeStudent = useStore(state => state.activeStudent);
  const currentUser = useStore(state => state.currentUser);
  const setCurrentUser = useStore(state => state.setCurrentUser);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/students-search?q=${encodeURIComponent(searchQuery)}`);
        setResults(res.data);
        setShowDropdown(true);
      } catch (err) {
        console.error('Lỗi tìm kiếm:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelect = async (student) => {
    try {
      setLoading(true);
      const res = await api.get(`/students/${student.id}`);
      setActiveStudent(res.data);
      setSearchQuery('');
      setShowDropdown(false);
      
      // Auto navigate to search page unless we are on the AI Chat page
      if (location.pathname !== '/search' && location.pathname !== '/chat') {
        navigate('/search');
      }
    } catch (err) {
      alert('Không thể tải chi tiết sinh viên: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-between px-4 md:px-10 sticky top-0 z-20">
      {/* Title & Brand */}
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden text-slate-300 hover:text-white p-2"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <h2 className="font-semibold text-xl text-white hidden md:block">SmartGen {currentUser?.role === 'STUDENT' && <span className="text-xs text-purple-400 font-bold ml-2">STUDENT PORTAL</span>}</h2>
      </div>

      {/* Global Premium Search Input in Navbar (Advisors only) */}
      {currentUser?.role !== 'STUDENT' && (
      <div className="flex-1 max-w-md mx-6 relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            placeholder="Tìm kiếm MSSV hoặc tên sinh viên..."
            className="w-full bg-white/5 focus:bg-white/10 border border-white/10 hover:border-white/20 focus:border-blue-500/50 rounded-2xl pl-10 pr-10 py-2 text-sm text-slate-100 placeholder-slate-400 outline-none transition-all"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          {loading && (
            <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
          )}
        </div>

        {/* Floating Dropdown Results */}
        {showDropdown && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 glass-panel border border-white/10 rounded-2xl shadow-2xl z-30 max-h-80 overflow-y-auto overflow-hidden">
            {results.length > 0 ? (
              <div className="divide-y divide-white/5">
                {results.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleSelect(st)}
                    className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/5 transition-all text-slate-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{st.name}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Hash size={10} /> {st.id} • Lớp {st.class || 'WD18301'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-blue-400 transition-all transform group-hover:translate-x-1" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-400 font-medium">Không tìm thấy sinh viên nào</p>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      <div className="flex items-center space-x-6 ml-auto">
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-white">{currentUser?.name || 'Guest'}</p>
          <p className="text-xs text-slate-400">{currentUser?.role === 'STUDENT' ? `MSSV: ${currentUser.id}` : 'Admin Dashboard'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.4)] border-2 border-white/10 ring-2 ring-black">
          {currentUser?.role === 'STUDENT' ? <GraduationCap size={18} /> : 'GV'}
        </div>
        <button onClick={() => setCurrentUser(null)} className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

function App() {
  const fetchTrainingData = useStore(state => state.fetchTrainingData);
  const { isLoading, error, currentUser } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchTrainingData();
  }, [fetchTrainingData]);

  if (!currentUser) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <div className="flex-1 flex flex-col relative w-full md:ml-64">
          <Header setMobileMenuOpen={setMobileMenuOpen} />
          <main className="p-4 md:p-8 flex-1 overflow-auto relative z-0">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
                <span className="text-2xl">⚠️</span> 
                <div>
                  <h3 className="font-bold">Lỗi kết nối Backend</h3>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
              </div>
            )}
            <Routes>
              {currentUser.role === 'STUDENT' ? (
                <>
                  <Route path="/student-dashboard" element={<StudentDashboard />} />
                  <Route path="/chat" element={<AIChat />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="*" element={<StudentDashboard />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/search" element={<StudentSearch />} />
                  <Route path="/predict" element={<Predict />} />
                  <Route path="/gpa" element={<GPA />} />
                  <Route path="/interventions" element={<Interventions />} />
                  <Route path="/chat" element={<AIChat />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/student/:mssv" element={<StudentProfile />} />
                  <Route path="*" element={<Dashboard />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
