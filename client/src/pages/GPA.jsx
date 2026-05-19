import { useState } from 'react';
import { Target, Shuffle, AlertCircle, TrendingUp, Compass } from 'lucide-react';

export default function GPA() {
  const [currentGPA, setCurrentGPA] = useState(7.0);
  const [completedCredits, setCompletedCredits] = useState(90);
  const [targetGPA, setTargetGPA] = useState(7.5);
  const [remainingCredits, setRemainingCredits] = useState(30);
  
  const [simulation, setSimulation] = useState(null);

  const calculateRequiredGPA = () => {
    const currentPoints = currentGPA * completedCredits;
    const totalCredits = parseFloat(completedCredits) + parseFloat(remainingCredits);
    const targetPoints = targetGPA * totalCredits;
    const requiredPoints = targetPoints - currentPoints;
    const requiredGPA = requiredPoints / remainingCredits;

    setSimulation({
      requiredGPA: requiredGPA.toFixed(2),
      isPossible: requiredGPA <= 10,
      totalCredits
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Compass size={32} className="text-white"/>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Kịch bản Mục tiêu GPA</h2>
            <p className="text-slate-400 mt-1">What-if Simulator: Tính toán chính xác áp lực điểm số cho các học kỳ cuối.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Form */}
        <div className="glass-card p-8 rounded-3xl border border-white/5 relative z-10">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="text-cyan-400"/> Nhập Dữ liệu Hiện tại
          </h3>
          <div className="space-y-5">
            <div className="group">
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">GPA Hiện tại (Hệ 10)</label>
              <input type="number" step="0.1" value={currentGPA} onChange={e => setCurrentGPA(e.target.value)} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 text-white transition-all" />
            </div>
            
            <div className="group">
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Số tín chỉ đã tích lũy</label>
              <input type="number" value={completedCredits} onChange={e => setCompletedCredits(e.target.value)} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 text-white transition-all" />
            </div>
            
            <div className="pt-6 mt-6 border-t border-white/5">
              <div className="group mb-5">
                <label className="block text-xs uppercase tracking-wider font-semibold text-amber-400 mb-2">Mục tiêu GPA Tốt nghiệp</label>
                <input type="number" step="0.1" value={targetGPA} onChange={e => setTargetGPA(e.target.value)} className="w-full p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl outline-none focus:border-amber-500 focus:bg-amber-500/20 text-white font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)]" />
              </div>
              
              <div className="group">
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Số tín chỉ còn lại (Dự kiến)</label>
                <input type="number" value={remainingCredits} onChange={e => setRemainingCredits(e.target.value)} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 text-white transition-all" />
              </div>
            </div>
            
            <button onClick={calculateRequiredGPA} className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold p-4 rounded-2xl flex justify-center items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
              <Shuffle size={20} /> Khởi chạy Mô phỏng (What-if)
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="relative">
          {simulation ? (
            <div className="glass-card h-full p-8 rounded-3xl border border-white/5 flex flex-col justify-center items-center text-center animate-fade-in relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-full h-full opacity-10 rounded-3xl blur-3xl ${simulation.isPossible ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              
              <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Kết quả Mô phỏng</h3>
              <p className="text-slate-400 mb-8 relative z-10">Để đạt mốc <b className="text-white">{targetGPA}</b> sau tổng <b className="text-white">{simulation.totalCredits}</b> tín chỉ, bạn cần đạt được:</p>
              
              <div className={`relative z-10 w-48 h-48 rounded-full flex flex-col justify-center items-center border-[12px] bg-black/40 shadow-2xl transition-all ${simulation.isPossible ? 'border-emerald-500/80 shadow-emerald-500/20' : 'border-rose-500/80 shadow-rose-500/20'}`}>
                <span className={`text-5xl font-black ${simulation.isPossible ? 'text-emerald-400 text-glow-green' : 'text-rose-500 text-glow-red'}`}>
                  {simulation.requiredGPA}
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mt-2">GPA / Môn</span>
              </div>

              <div className="mt-10 text-sm w-full relative z-10">
                {!simulation.isPossible ? (
                  <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-2xl flex items-start gap-3 text-left">
                    <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={24}/>
                    <div>
                      <p className="text-rose-400 font-bold mb-1">Cảnh báo: Bất khả thi!</p>
                      <p className="text-rose-200/80">Điểm yêu cầu vượt quá 10.0. Dù toàn bộ môn còn lại đạt 10, bạn vẫn không thể chạm mốc {targetGPA}. Hãy thử hạ mục tiêu xuống.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex items-start gap-3 text-left">
                    <TrendingUp className="text-emerald-400 shrink-0 mt-0.5" size={24}/>
                    <div>
                      <p className="text-emerald-400 font-bold mb-1">Mục tiêu Khả thi!</p>
                      <p className="text-emerald-200/80 mb-2">Bạn cần duy trì phong độ tối thiểu <b>{simulation.requiredGPA}</b> cho tất cả các môn còn lại.</p>
                      <p className="text-slate-400 text-xs">💡 Lời khuyên: Sử dụng AI để dự báo xem môn nào sắp tới có thể kéo điểm của bạn xuống.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card h-full p-8 rounded-3xl border border-white/5 flex flex-col justify-center items-center text-center opacity-50">
              <Compass size={64} className="text-slate-600 mb-4" />
              <p className="text-slate-400">Nhập thông tin bên trái và nhấn<br/>"Khởi chạy Mô phỏng" để xem kết quả</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
