import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend
} from 'recharts';

const LEVEL_COLOR = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e'
};

export default function TimelineEscalation({ data, title = 'Timeline Leo thang Cảnh báo' }) {
  // data: array of weekly risk events
  // [{ week: 3, eventCount: 2, level: 'WARNING' }, ...]
  const chartData = data || generateMockTimeline();

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: '20px 16px',
      height: '100%'
    }}>
      <h3 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {title}
      </h3>
      <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
        Số lượng sự kiện cảnh báo theo tuần học (Kỳ hiện tại)
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="warningGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="week"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(w) => `T${w}`}
          />
          <YAxis
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
            labelFormatter={(w) => `Tuần ${w}`}
            formatter={(value, name) => [value, name === 'warnings' ? 'Cảnh báo' : 'Khẩn cấp']}
          />
          <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v === 'warnings' ? 'Cảnh báo' : 'Khẩn cấp'}</span>} />
          <ReferenceLine y={5} stroke="#ef444433" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="warnings"
            stroke="#f97316"
            fill="url(#warningGrad)"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 3 }}
            activeDot={{ r: 5 }}
            name="warnings"
          />
          <Area
            type="monotone"
            dataKey="critical"
            stroke="#ef4444"
            fill="url(#criticalGrad)"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 3 }}
            activeDot={{ r: 5 }}
            name="critical"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function generateMockTimeline() {
  return [
    { week: 1, warnings: 0, critical: 0 },
    { week: 2, warnings: 1, critical: 0 },
    { week: 3, warnings: 2, critical: 0 },
    { week: 4, warnings: 3, critical: 1 },
    { week: 5, warnings: 4, critical: 1 },
    { week: 6, warnings: 5, critical: 2 },
    { week: 7, warnings: 4, critical: 3 },
    { week: 8, warnings: 6, critical: 4 },
    { week: 9, warnings: 5, critical: 4 },
    { week: 10, warnings: 7, critical: 5 },
    { week: 11, warnings: 6, critical: 5 },
    { week: 12, warnings: 8, critical: 6 },
    { week: 13, warnings: 7, critical: 6 },
    { week: 14, warnings: 5, critical: 4 },
    { week: 15, warnings: 3, critical: 2 },
    { week: 16, warnings: 1, critical: 1 }
  ];
}
