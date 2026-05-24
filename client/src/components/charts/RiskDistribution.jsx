import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e'
};

const RADIAN = Math.PI / 180;

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="700">
      {value}
    </text>
  );
};

const RiskDistribution = React.memo(({ data, title = 'Phân phối Rủi ro' }) => {
  // data: [{ name: 'CRITICAL', value: 5 }, ...]
  const chartData = data || [
    { name: 'CRITICAL', value: 0 },
    { name: 'HIGH', value: 0 },
    { name: 'MEDIUM', value: 0 },
    { name: 'LOW', value: 0 }
  ];

  const total = chartData.reduce((s, d) => s + d.value, 0);

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
        Tổng: <strong style={{ color: '#94a3b8' }}>{total}</strong> sinh viên
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e2e8f0'
            }}
            formatter={(value, name) => [`${value} SV`, name]}
          />
          <Legend
            formatter={(value) => (
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        {chartData.map(item => (
          <div key={item.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            border: `1px solid ${COLORS[item.name]}33`
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[item.name], flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{item.name}</span>
            <span style={{ color: COLORS[item.name], fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RiskDistribution;
