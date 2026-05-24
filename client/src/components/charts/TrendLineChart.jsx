import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';

export default function TrendLineChart({ data, title = 'Xu hướng GPA', studentName = null }) {
  // data: [{ semester: 'HK1', gpa: 7.5, predicted: null }, ...]
  const chartData = data || [
    { semester: 'HK1', gpa: 7.5 },
    { semester: 'HK2', gpa: 7.2 },
    { semester: 'HK3', gpa: 6.8 },
    { semester: 'HK4', gpa: null, predicted: 6.2 }
  ];

  const avgGpa = chartData
    .filter(d => d.gpa !== null)
    .reduce((s, d, _, arr) => s + d.gpa / arr.length, 0);

  const lastGpa = chartData.filter(d => d.gpa !== null).slice(-1)[0]?.gpa;
  const trend = lastGpa > avgGpa ? 'up' : 'down';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: '20px 16px',
      height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {title}
        </h3>
        <span style={{
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 20,
          background: trend === 'up' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: trend === 'up' ? '#22c55e' : '#ef4444',
          fontWeight: 600
        }}>
          {trend === 'up' ? '↑ Tăng' : '↓ Giảm'}
        </span>
      </div>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
        {studentName ? `SV: ${studentName}` : 'Xu hướng GPA theo học kỳ'}
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="semester"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e2e8f0'
            }}
            formatter={(value, name) => [
              value !== null ? `${value?.toFixed(1)}/10` : 'N/A',
              name === 'gpa' ? 'GPA Thực tế' : 'GPA Dự báo'
            ]}
          />
          <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v === 'gpa' ? 'GPA Thực tế' : 'Dự báo'}</span>} />
          {/* Passing threshold line */}
          <ReferenceLine y={5} stroke="#ef444466" strokeDasharray="4 4" label={{ value: 'Ngưỡng pass', fill: '#ef4444', fontSize: 10, position: 'insideTopLeft' }} />
          <ReferenceLine y={6.5} stroke="#eab30866" strokeDasharray="4 4" />
          {/* Actual GPA line */}
          <Line
            type="monotone"
            dataKey="gpa"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ fill: '#6366f1', r: 5, strokeWidth: 2, stroke: '#1e293b' }}
            activeDot={{ r: 7 }}
            connectNulls={false}
            name="gpa"
          />
          {/* Predicted GPA dashed line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#f97316"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ fill: '#f97316', r: 4 }}
            connectNulls={true}
            name="predicted"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
