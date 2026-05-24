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
    // Render mock data for visual demo
    return <RiskHeatmapMock title={title} />;
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: '20px 16px',
      overflowX: 'auto'
    }}>
      <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {title}
      </h3>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
        Mức độ rủi ro theo tuần học — {displayStudents.length} sinh viên nguy cơ cao nhất
      </p>

      <div style={{ minWidth: 600 }}>
        {/* Week header */}
        <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(8, 1fr)', gap: 3, marginBottom: 4 }}>
          <div />
          {weeks.map(w => (
            <div key={w} style={{ textAlign: 'center', color: '#475569', fontSize: 10, fontWeight: 600 }}>
              T{w}
            </div>
          ))}
        </div>

        {/* Student rows */}
        {displayStudents.map((student, idx) => (
          <div key={student.mssv} style={{ display: 'grid', gridTemplateColumns: '100px repeat(8, 1fr)', gap: 3, marginBottom: 3 }}>
            <div style={{ color: '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', paddingRight: 8, fontWeight: 600 }}>
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
                  style={{
                    height: 22,
                    borderRadius: 3,
                    background: RISK_BG[level],
                    border: `1px solid ${RISK_COLORS[level]}55`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.zIndex = '10';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.zIndex = '1';
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {Object.entries(RISK_COLORS).map(([level, color]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: RISK_BG[level], border: `1px solid ${color}` }} />
            <span style={{ color: '#64748b', fontSize: 11 }}>{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

function RiskHeatmapMock({ title }) {
  const navigate = useNavigate();
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);
  const mockStudents = [
    { mssv: 'PS47261', riskScore: 88, level: 'CRITICAL' },
    { mssv: 'PS12345', riskScore: 72, level: 'HIGH' },
    { mssv: 'PS98765', riskScore: 65, level: 'HIGH' },
    { mssv: 'PS11111', riskScore: 48, level: 'MEDIUM' },
    { mssv: 'PS22222', riskScore: 35, level: 'MEDIUM' },
    { mssv: 'PS33333', riskScore: 18, level: 'LOW' },
  ];

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: '20px 16px',
      overflowX: 'auto'
    }}>
      <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {title}
      </h3>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
        Demo — Mức độ rủi ro theo tuần học
      </p>

      <div style={{ minWidth: 600 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(8, 1fr)', gap: 3, marginBottom: 4 }}>
          <div />
          {weeks.map(w => (
            <div key={w} style={{ textAlign: 'center', color: '#475569', fontSize: 10, fontWeight: 600 }}>T{w}</div>
          ))}
        </div>
        {mockStudents.map(student => (
          <div key={student.mssv} style={{ display: 'grid', gridTemplateColumns: '100px repeat(8, 1fr)', gap: 3, marginBottom: 3 }}>
            <div style={{ color: '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', paddingRight: 8, fontWeight: 600 }}>
              {student.mssv}
            </div>
            {weeks.map(week => {
              const escW = Math.max(1, 8 - Math.floor(student.riskScore / 15));
              let level = week >= escW ? student.level : 'LOW';
              return (
                <div key={week} 
                  onClick={() => navigate(`/student/${student.mssv}`)}
                  title={`${student.mssv} | Tuần ${week}\nRisk Level: ${level}`}
                  style={{
                    height: 22, borderRadius: 3,
                    background: RISK_BG[level],
                    border: `1px solid ${RISK_COLORS[level]}55`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }} 
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        {Object.entries(RISK_COLORS).map(([level, color]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: RISK_BG[level], border: `1px solid ${color}` }} />
            <span style={{ color: '#64748b', fontSize: 11 }}>{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RiskHeatmap;
