import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';

const FAIL_COLORS = ['#ea580c', '#ef4444', '#f43f5e', '#d946ef', '#8b5cf6'];

const BottleneckChart = React.memo(({ data, title = 'Môn Học Bottleneck' }) => {
  // data: [{ name: 'COM108', failCount: 12 }, ...]
  const chartData = data || [];

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 h-full flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Chưa có dữ liệu bottleneck</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 h-full">
      <h3 className="text-slate-800 dark:text-slate-200 text-sm font-bold mb-1 tracking-wider uppercase">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
        Top {chartData.length} môn có tỷ lệ fail cao nhất
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--tw-colors-slate-200)" strokeOpacity={0.2} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
            tickFormatter={(val) => val.length > 25 ? val.substring(0, 25) + '...' : val}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e2e8f0'
            }}
            formatter={(value) => [`${value} sinh viên chưa đạt`, 'Số lượng']}
          />
          <Bar dataKey="failCount" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={FAIL_COLORS[index] || '#6b7280'} />
            ))}
            <LabelList
              dataKey="failCount"
              position="right"
              style={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
              formatter={(val) => `${val} SV`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default BottleneckChart;
