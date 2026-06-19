import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ShieldCheck, Target, TrendingUp, Zap, Clock, Users, BarChart3, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart, Bar, Line, Legend } from 'recharts';

const AiEvaluationDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai-evaluation');
      setMetrics(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi kết nối tới máy chủ AI');
    } finally {
      setLoading(false);
    }
  };

  const triggerAutoValidation = async () => {
    try {
      setValidating(true);
      await api.post('/ai-evaluation/run');
      await fetchMetrics();
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể kích hoạt đối chiếu');
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const { overview, yearlyTrends } = metrics || {};

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase flex items-center gap-3">
            <Zap className="text-amber-500" /> Hệ Thống Kiểm Chứng (Continuous Validation)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
            Tự động đối chiếu các dự đoán trong quá khứ với điểm số thực tế ngay khi có dữ liệu mới để tính toán sai số và tinh chỉnh mô hình.
          </p>
        </div>
        <button
          onClick={triggerAutoValidation}
          disabled={validating}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all"
        >
          <Target size={18} className={validating ? "animate-spin" : ""} />
          {validating ? 'Đang Đối Chiếu...' : 'Quét Đối Chiếu Điểm Mới'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3">
          <AlertCircle /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-blue-500">
            <Users size={24} />
            <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase text-sm">Quy mô Dataset</h3>
          </div>
          <div className="text-3xl font-black">{overview?.totalStudents || 0} <span className="text-base font-normal text-slate-400">sinh viên</span></div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <Clock size={24} />
            <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase text-sm">Đang Chờ Kiểm Chứng</h3>
          </div>
          <div className="text-3xl font-black">{overview?.pendingPredictions || 0} <span className="text-base font-normal text-slate-400">dự đoán</span></div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-4 text-green-500">
            <ShieldCheck size={24} />
            <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase text-sm">Sai số MAE Trung Bình</h3>
          </div>
          <div className="text-4xl font-black text-green-600 dark:text-green-400">
            {overview?.mae || '0.00'} <span className="text-base font-normal text-slate-400">điểm</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-4 text-indigo-500">
            <TrendingUp size={24} />
            <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase text-sm">Độ Chính Xác (±1 Điểm)</h3>
          </div>
          <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
            {overview?.accuracy10 || 0}%
          </div>
        </div>
      </div>

      {/* Charts */}
      {yearlyTrends && yearlyTrends.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><BarChart3 className="text-indigo-500"/> AI Performance Over Time (Độ Lệch)</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yearlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#10b981" />
                <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '12px' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="mae" name="MAE (Sai số tuyệt đối)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="accuracy10" name="Accuracy ±1.0 (%)" stroke="#6366f1" strokeWidth={4} dot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <div className="flex justify-center mb-4"><Target size={48} className="text-slate-300 dark:text-slate-600"/></div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Chưa Có Dữ Liệu Lịch Sử Đánh Giá</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Hệ thống cần trải qua ít nhất 1 kỳ nạp điểm thực tế để đối chiếu với các dự đoán trong quá khứ.
          </p>
        </div>
      )}
    </div>
  );
};

export default AiEvaluationDashboard;
