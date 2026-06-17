import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, TrendingDown, BookOpen, Clock, Play } from 'lucide-react';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function CourseRecoveryModal({ course, onClose }) {
  const [xaiData, setXaiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (course?.courseId) {
      api.get(`/retake/xai/${course.courseId}`)
        .then(res => {
          setXaiData(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Lỗi khi tải XAI:', err);
          setLoading(false);
        });
    }
  }, [course]);

  if (!course) return null;

  const currentScore = course.value || course.currentScore;
  const isCritical = currentScore < 5.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-slate-900/95 border-slate-800 backdrop-blur">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-blue-400" />
              {course.courseId} - {course.course?.name || "Chi tiết môn học"}
            </h2>
            <div className="flex gap-4 mt-1 text-xs">
              <span className="text-slate-400">Tín chỉ: <strong className="text-slate-200">{course.course?.credits || course.credits}</strong></span>
              <span className="text-slate-400">Điểm hiện tại: <strong className={isCritical ? 'text-rose-500' : 'text-emerald-400'}>{currentScore}</strong></span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 transition-colors rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {loading ? (
            <div className="py-12 text-center text-slate-500 animate-pulse">
              Đang phân tích dữ liệu học thuật (XAI)...
            </div>
          ) : !xaiData ? (
            <div className="py-12 text-center text-slate-500">
              Không có dữ liệu phân tích cho môn học này.
            </div>
          ) : (
            <>
              {/* SECTION 1: ACADEMIC DIAGNOSIS */}
              <section className="p-5 border bg-slate-800/50 rounded-xl border-slate-700/50">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-bold text-white uppercase tracking-wider">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Chẩn đoán Học thuật (XAI)
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs text-slate-400">Mức độ rủi ro:</div>
                    <div className={`text-xl font-bold ${isCritical ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {isCritical ? 'NGUY HIỂM (CRITICAL)' : 'AN TOÀN'}
                    </div>
                    <div className="mt-4 mb-2 text-xs text-slate-400">Độ tin cậy AI: <span className="text-white">{xaiData.diagnosis.confidence}%</span></div>
                  </div>
                  <div>
                    <div className="mb-2 text-xs text-slate-400">Phân tích nguyên nhân gốc rễ:</div>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {xaiData.diagnosis.rootCauses.map((rc, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <TrendingDown size={16} className="mt-0.5 text-rose-400 shrink-0" />
                          <span>{rc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* SECTION 2: WHY THIS MATTERS */}
              <section>
                <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Mức độ Ảnh hưởng (Tương lai)</h3>
                {xaiData.whyItMatters.blockedCourses.length > 0 ? (
                  <div className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-lg">
                    <p className="mb-3 text-sm text-slate-300">
                      Nếu không cải thiện <strong className="text-white">{course.courseId}</strong>, bạn sẽ gặp khó khăn hoặc bị chặn học các môn sau:
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {xaiData.whyItMatters.blockedCourses.map(bc => (
                        <span key={bc} className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-rose-900/40 text-rose-300 border border-rose-800/50">
                          {bc}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-rose-400">{xaiData.whyItMatters.risk}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Môn học này không chặn trực tiếp các môn chuyên ngành tiếp theo.</p>
                )}
              </section>

              {/* SECTION 4: SKILL GAP ANALYSIS */}
              <section>
                <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Phân tích Lỗ hổng Kỹ năng</h3>
                <div className="space-y-4">
                  {xaiData.skillGap.map((skill, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-1 text-xs">
                        <span className="text-slate-300">{skill.name}</span>
                        <span className="text-slate-400">{skill.value}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800">
                        <div className="h-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500" style={{ width: `${skill.value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 3: PERSONALIZED ACTION PLAN */}
              <section>
                <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Kế hoạch Hành động Cá nhân</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {xaiData.actionPlan.map((plan, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-slate-800/30 border-slate-700/50">
                      <div className="flex items-center gap-2 mb-3 text-sm font-bold text-indigo-400">
                        <Clock size={16} /> Tuần {plan.week}
                      </div>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {plan.tasks.map((task, tidx) => (
                          <li key={tidx} className="flex gap-2 items-start">
                            <div className="w-4 h-4 mt-0.5 border border-slate-600 rounded-sm shrink-0 flex items-center justify-center text-transparent hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors cursor-pointer">
                              <CheckCircle size={12} />
                            </div>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 5: RETAKE RECOMMENDATION */}
              <section className="p-6 text-center border bg-gradient-to-br from-indigo-950/40 to-slate-900 rounded-xl border-indigo-900/50">
                <h3 className="mb-2 text-lg font-bold text-white">Khuyến nghị Đăng ký Học lại</h3>
                <p className="mb-6 text-sm text-slate-400">Điểm số hiện tại của bạn ({currentScore}) nằm dưới mức an toàn. Hệ thống khuyến nghị học lại môn này để củng cố nền tảng.</p>
                <button 
                  onClick={() => { onClose(); navigate('/retake-registration'); }}
                  className="px-6 py-3 text-sm font-bold text-white transition-transform rounded-lg shadow-lg bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-indigo-500/20"
                >
                  Đăng ký Học lại ngay
                </button>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
