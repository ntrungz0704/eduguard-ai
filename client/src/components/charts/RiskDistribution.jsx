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
    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 h-full">
      <h3 className="text-slate-800 dark:text-slate-200 text-sm font-bold mb-1 tracking-wider uppercase">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
        Tổng: <strong className="text-slate-700 dark:text-slate-300">{total}</strong> sinh viên
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
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e2e8f0'
            }}
            formatter={(value, name) => [`${value} SV`, name]}
          />
          <Legend
            formatter={(value) => (
              <span className="text-slate-600 dark:text-slate-400 text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Badges */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {chartData.map(item => (
          <div key={item.name} className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-transparent" style={{ borderColor: `var(--tw-border-opacity) === 1 ? 'transparent' : '${COLORS[item.name]}33'` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[item.name], flexShrink: 0 }} />
            <span className="text-slate-600 dark:text-slate-400 text-xs">{item.name}</span>
            <span style={{ color: COLORS[item.name] }} className="text-[13px] font-bold ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default RiskDistribution;
