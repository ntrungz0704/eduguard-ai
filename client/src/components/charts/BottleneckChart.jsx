import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';

const FAIL_COLORS = ['#ef4444', '#f97316', '#f97316', '#eab308', '#eab308'];

export default function BottleneckChart({ data, title = 'Môn Học Bottleneck' }) {
  // data: [{ name: 'COM108', failCount: 12 }, ...]
  const chartData = data || [];

  if (chartData.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '20px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <p style={{ color: '#475569', fontSize: 13 }}>Chưa có dữ liệu bottleneck</p>
      </div>
    );
  }

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
        Top {chartData.length} môn có tỷ lệ fail cao nhất
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e2e8f0'
            }}
            formatter={(value) => [`${value} sinh viên failed`, 'Số lượng']}
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
}
