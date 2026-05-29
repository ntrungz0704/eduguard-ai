import React from 'react';
import { useNavigate } from 'react-router-dom';

const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e'
};

const RISK_BG = {
  CRITICAL: 'rgba(239,68,68,0.1)',
  HIGH: 'rgba(249,115,22,0.1)',
  MEDIUM: 'rgba(234,179,8,0.1)',
  LOW: 'rgba(34,197,94,0.1)'
};

/**
 * RiskHeatmap — CSS Grid-based heatmap
 * Shows top N students (rows) × weeks (columns)
 * Color intensity = risk level at that week
 */
const RiskHeatmap = React.memo(({ students = [], title = 'Risk Heatmap — Top Sinh viên × Tuần' }) => {
  const navigate = useNavigate();
  const weeks = [1, 2, 3, 4, 5, 6, 7, 8];
  const displayStudents = students.slice(0, 8);

  if (displayStudents.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-10 px-4 text-center text-slate-500 dark:text-slate-400">
        <h3 className="text-slate-800 dark:text-slate-200 text-sm font-bold mb-2">{title}</h3>
        <p>Không có dữ liệu sinh viên (Empty State)</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 overflow-x-auto">
      <h3 className="text-slate-800 dark:text-slate-200 text-sm font-bold mb-1 tracking-wider uppercase">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
        Mức độ rủi ro theo tuần học — {displayStudents.length} sinh viên nguy cơ cao nhất
      </p>

      <div className="min-w-[600px]">
        {/* Week header */}
        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '100px repeat(8, 1fr)' }}>
          <div />
          {weeks.map(w => (
            <div key={w} className="text-center text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
              T{w}
            </div>
          ))}
        </div>

        {/* Student rows */}
        {displayStudents.map((student, idx) => (
          <div key={student.mssv} className="grid gap-1 mb-1" style={{ gridTemplateColumns: '100px repeat(8, 1fr)' }}>
            <div className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold flex items-center pr-2">
              {student.mssv}
            </div>
            {weeks.map(week => {
              // Simulate risk progression: higher risk students show CRITICAL sooner
              const escalationWeek = Math.max(1, 8 - Math.floor(student.riskScore / 15));
              let level = 'LOW';
              if (week >= escalationWeek && student.level === 'CRITICAL') level = 'CRITICAL';
              else if (week >= escalationWeek + 2 && student.level === 'HIGH') level = 'HIGH';
              else if (week >= escalationWeek + 4 && student.level === 'MEDIUM') level = 'MEDIUM';
              else if (week < escalationWeek) level = 'LOW';
              else level = student.level || 'LOW';

              return (
                <div
                  key={week}
                  title={`${student.name || student.mssv} | Tuần ${week}\nRisk Level: ${level}\nGPA Hiện tại: ${student.gpa || 'N/A'}\nChuyên cần: ${student.attendance || 'N/A'}%\nMôn đã fail: ${student.failedSubjects || 0}`}
                  onClick={() => navigate(`/student/${student.mssv}`)}
                  className="h-[22px] rounded-sm cursor-pointer transition-transform hover:scale-110 hover:z-10 shadow-sm"
                  style={{
                    background: RISK_BG[level],
                    border: `1px solid ${RISK_COLORS[level]}55`
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-6 flex-wrap justify-center sm:justify-start">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2">Cấp độ rủi ro:</span>
        {Object.entries(RISK_COLORS).map(([lvl, color]) => (
          <div key={lvl} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm shadow-sm" style={{ background: RISK_BG[lvl], border: `1px solid ${color}55` }} />
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{lvl}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RiskHeatmap;
