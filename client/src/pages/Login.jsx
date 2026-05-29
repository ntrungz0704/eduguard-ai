import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Loader2, Users, GraduationCap, MapPin, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store';

// ========================================================
// MOCK ACCOUNTS - Login works instantly, no API needed
// ========================================================
const ADVISOR_ACCOUNTS = [
  { username: 'admin', password: 'admin123', name: 'Nguyễn Văn An (Admin)', id: 'GV001' },
  { username: 'giangvien', password: '123456', name: 'Trần Thị Bình', id: 'GV002' },
];

const campuses = [
  { id: 'HCM', name: '🏙️ Hồ Chí Minh' },
  { id: 'HN',  name: '🏛️ Hà Nội' },
  { id: 'DN',  name: '🌊 Đà Nẵng' },
  { id: 'CT',  name: '🌾 Cần Thơ' },
  { id: 'TN',  name: '🏔️ Tây Nguyên' },
];

export default function Login() {
  const navigate = useNavigate();
  const setCurrentUser = useStore(state => state.setCurrentUser);

  const [role, setRole] = useState('ADVISOR');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState('HCM');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');

    // Simulate a small delay for UX
    setTimeout(() => {
      if (role === 'ADVISOR') {
        const account = ADVISOR_ACCOUNTS.find(
          a => a.username === username.trim() && a.password === password
        );
        if (!account) {
          setError('Tên đăng nhập hoặc mật khẩu không đúng');
          setLoading(false);
          return;
        }
        setCurrentUser({
          id: account.id,
          name: account.name,
          role: 'ADVISOR',
          campus,
          email: `${account.username}@fpt.edu.vn`,
        });
        navigate('/');
      } else {
        // STUDENT - any username works (MSSV), password is anything with min 4 chars
        if (password.length < 4) {
          setError('Mật khẩu phải có ít nhất 4 ký tự');
          setLoading(false);
          return;
        }
        const mssv = username.trim().toUpperCase();
        setCurrentUser({
          id: mssv,
          name: `Sinh viên ${mssv}`,
          role: 'STUDENT',
          campus,
          email: `${username.trim()}@gmail.com`,
        });
        navigate('/student-dashboard');
      }
      setLoading(false);
    }, 600);
  };

  const quickFill = (type) => {
    if (type === 'GV') {
      setRole('ADVISOR');
      setUsername('admin');
      setPassword('admin123');
      setError('');
    } else {
      setRole('STUDENT');
      setUsername('PS47261');
      setPassword('123456');
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-card p-8 rounded-3xl w-full max-w-md relative z-10 border border-slate-200 dark:border-white/10 shadow-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-blue-500 dark:to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sm dark:shadow-blue-500/30">
            <BrainCircuit className="text-slate-900 dark:text-white" size={34} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Edu<span className="text-blue-400">Guard</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Nền tảng Cố vấn Học vụ AI</p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 mb-6">
          <button
            type="button"
            onClick={() => { setRole('ADVISOR'); setUsername(''); setPassword(''); setError(''); }}
            className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
              role === 'ADVISOR'
                ? 'bg-blue-600 shadow-lg shadow-sm dark:shadow-blue-500/30 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Giảng Viên</span>
          </button>
          <button
            type="button"
            onClick={() => { setRole('STUDENT'); setUsername(''); setPassword(''); setError(''); }}
            className={`py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
              role === 'STUDENT'
                ? 'bg-purple-600 shadow-lg shadow-sm dark:shadow-purple-500/30 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GraduationCap size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Sinh Viên</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Campus select - only for ADVISOR */}
          {role === 'ADVISOR' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin size={12} /> Cơ sở giảng dạy
              </label>
              <select
                value={campus}
                onChange={e => setCampus(e.target.value)}
                className="w-full bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none transition-all cursor-pointer"
              >
                {campuses.map(c => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              {role === 'ADVISOR' ? 'Tên đăng nhập' : 'Mã số sinh viên (MSSV)'}
            </label>
            <div className="flex bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 focus-within:border-blue-500 rounded-xl overflow-hidden transition-all">
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={role === 'ADVISOR' ? 'admin' : 'PS47261'}
                className="w-full bg-transparent px-4 py-3 text-slate-900 dark:text-white outline-none placeholder-slate-600"
              />
              <div className="px-3 py-3 bg-white/5 border-l border-slate-200 dark:border-white/10 flex items-center text-slate-500 text-xs font-medium whitespace-nowrap">
                {role === 'ADVISOR' ? '@fpt.edu.vn' : '@gmail.com'}
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={role === 'ADVISOR' ? 'admin123' : 'Nhập bất kỳ (≥ 4 ký tự)'}
                className="w-full bg-slate-200 dark:bg-black/40 border border-slate-200 dark:border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white outline-none transition-all placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-rose-400 text-sm text-center font-medium bg-rose-500/10 py-2.5 rounded-xl border border-rose-200 dark:border-rose-500/20">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl text-slate-900 dark:text-white font-bold tracking-wide shadow-xl transition-all flex items-center justify-center disabled:opacity-60 ${
              role === 'ADVISOR'
                ? 'bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 hover:dark:from-blue-500 hover:dark:to-indigo-500 shadow-sm dark:shadow-blue-500/20'
                : 'bg-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-pink-600 hover:dark:from-purple-500 hover:dark:to-pink-500 shadow-sm dark:shadow-purple-500/20'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Đăng nhập vào Hệ thống'}
          </button>
        </form>

        {/* Quick login hint */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/5">
          <p className="text-[10px] text-center text-slate-600 font-bold uppercase tracking-wider mb-3">Đăng nhập nhanh để demo</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickFill('GV')}
              className="py-2.5 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-200 dark:border-blue-500/20 text-blue-400 text-xs font-bold transition-all"
            >
              👨‍🏫 Vào tài khoản GV
            </button>
            <button
              type="button"
              onClick={() => quickFill('SV')}
              className="py-2.5 px-3 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-200 dark:border-purple-500/20 text-purple-400 text-xs font-bold transition-all"
            >
              🎓 Vào tài khoản SV
            </button>
          </div>
        </div>

      </div>

      {/* Credentials hint */}
      <div className="mt-4 text-center space-y-1 text-slate-600 text-[11px]">
        <p>GV: <span className="text-slate-600 dark:text-slate-400 font-mono">admin</span> / <span className="text-slate-600 dark:text-slate-400 font-mono">admin123</span></p>
        <p>SV: Nhập bất kỳ MSSV + mật khẩu ≥ 4 ký tự</p>
      </div>
    </div>
  );
}
