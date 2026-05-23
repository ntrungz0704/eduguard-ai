import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GPATrendChart = ({ data }) => {
  return (
    <div className="w-full h-64 bg-white p-4 rounded-xl shadow-sm border border-gray-100 my-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">📈 GPA Trend Simulation</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="semester" stroke="#8884d8" fontSize={12} />
          <YAxis domain={[0, 10]} stroke="#8884d8" fontSize={12} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="gpa" 
            name="GPA Dự kiến" 
            stroke="#8884d8" 
            strokeWidth={3}
            activeDot={{ r: 8 }} 
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GPATrendChart;
