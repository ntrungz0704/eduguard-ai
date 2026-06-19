import React, { useState } from 'react';
import { api } from '../lib/api';
import { RefreshCw, CheckCircle2, TrendingUp, Info, Printer, Download, BookOpen, User, AlertTriangle, ShieldCheck, Zap, X, Target, Database } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useStore } from '../store';
import AiEvaluationDashboard from './AiEvaluationDashboard';

const AIMetrics = () => {
  const theme = useStore(state => state.theme);
  const isDark = theme === 'dark';
  const [metrics, setMetrics] = useState(null);
  const [integrityStatus, setIntegrityStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanTime, setScanTime] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('loocv'); // 'loocv', 'validation', 'metadata'

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const startTime = Date.now();
      
      const res = await api.get('/evaluate-model');
      try {
        const integrityRes = await api.post('/audit/integrity');
        setIntegrityStatus(integrityRes.data.status);
      } catch (e) {
        console.error("Integrity check failed:", e);
      }
      
      const durationMs = Date.now() - startTime;
      setScanTime(durationMs);
      
      if (res.data && res.data.totalPredictions > 0) {
        setMetrics(res.data);
      } else {
        setMetrics(null);
        setError('Không đủ dữ liệu để đánh giá (cần ít nhất 1 sinh viên có điểm).');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Lỗi khi tải dữ liệu đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const statsList = metrics?.subjectStats || metrics?.stats || [];
  const hasData = metrics && statsList.length > 0;

  // Calculate overall metrics
  const excellent = metrics?.distribution?.excellent || 0;
  const good = metrics?.distribution?.good || 0;
  const poor = metrics?.distribution?.poor || 0;
  const total = metrics?.totalPredictions || 0;
  const mae = metrics?.mae || 0;
  
  const excellentRate = total > 0 ? (excellent / total) * 100 : 0;
  const goodRate = total > 0 ? (good / total) * 100 : 0;
  const poorRate = total > 0 ? (poor / total) * 100 : 0;
  const overallAccuracy = total > 0 ? (10 - mae) * 10 : 0;

  const pieData = [
    { name: 'Siêu Chuẩn (0.0 - 0.5)', value: excellent, color: '#10b981' },
    { name: 'Khá Chuẩn (0.6 - 1.0)', value: good, color: '#3b82f6' },
    { name: 'Cần Lưu Ý (> 1.0)', value: poor, color: '#ef4444' }
  ];

  return (
    <div className="bg-white dark:bg-[#0b1221] min-h-screen rounded-3xl p-6 md:p-8 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
              <ShieldCheck size={14} /> BÁO CÁO KIỂM CHỨNG AI
            </span>
            <span className="bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider">
              LOOCV METHOD
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">
            ĐÁNH GIÁ SAI SỐ DỰ ĐOÁN EDUGUARD AI
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl leading-relaxed">
            Kết quả thống kê thực nghiệm trên tập mẫu <strong className="text-slate-800 dark:text-slate-200">{metrics?.totalStudents || 0} sinh viên đủ điều kiện</strong> (có từ 3 cột điểm chuyên ngành trở lên), chạy mô hình kiểm thử chéo Leave-One-Out (LOOCV) trên toàn bộ <strong className="text-slate-800 dark:text-slate-200">{statsList.length || 0} môn học</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {!hasData ? (
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              {loading ? 'Đang Quét Hệ Thống...' : 'Quét Toàn Bộ Hệ Thống'}
            </button>
          ) : (
            <>
              <button 
                onClick={fetchMetrics} 
                disabled={loading} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all text-sm disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? 'Đang quét...' : 'Quét lại'}
              </button>
              <button 
                onClick={() => window.print()} 
                disabled={loading} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-all text-sm disabled:opacity-50"
              >
                <Printer size={16} /> In Báo Cáo / Lưu PDF
              </button>
              <button 
                onClick={() => setShowGuide(true)} 
                disabled={loading} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 text-sm disabled:opacity-50"
              >
                <BookOpen size={16} /> Hướng Dẫn Chụp Slide
              </button>
            </>
          )}
      </div>
    </div>

    {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('loocv')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'loocv' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          } rounded-t-lg`}
        >
          <BarChart size={18} /> LOOCV Evaluation
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'validation' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          } rounded-t-lg`}
        >
          <Target size={18} /> Ground Truth Validation
        </button>
        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'metadata' 
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' 
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          } rounded-t-lg`}
        >
          <Database size={18} /> Model Metadata
        </button>
      </div>

      {activeTab === 'validation' && (
        <div className="animate-fade-in -mx-6 md:-mx-8">
          <AiEvaluationDashboard />
        </div>
      )}

      {activeTab === 'metadata' && (
        <div className="animate-fade-in max-w-4xl">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
              <Database className="text-amber-500" /> Dataset Metadata
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Training Sample Size</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{metrics?.totalStudents || 0} students</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Features Evaluated</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{statsList.length} subjects</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Algorithm</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Ensemble Weighted Pearson (Offline) + KNN</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Validation Methodology</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Leave-One-Out Cross-Validation (LOOCV)</p>
              </div>
              <div className="space-y-1 md:col-span-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Data Integrity</p>
                <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${integrityStatus === 'PASS' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : integrityStatus === 'FAIL' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-slate-100 text-slate-500'}`}>
                    DATA INTEGRITY = {integrityStatus || 'UNCHECKED'}
                  </span>
                  <p>Continuous post-deployment validation enabled.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'loocv' && (
        <>

      {error && (
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 flex items-center gap-3 mb-8">
          <AlertTriangle size={24} />
          <div>
            <p className="font-bold">Đã xảy ra lỗi</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}

      {loading && !hasData && (
        <div className="flex flex-col justify-center items-center h-64 space-y-4 border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-[#0f172a]/50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Hệ thống đang mô phỏng việc xóa điểm và dự đoán lại (LOOCV)...</p>
        </div>
      )}

      {!hasData && !loading && !error && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-[#0f172a]/50 p-8 text-center relative z-10">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <Zap size={40} className="text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Chưa khởi chạy Đánh giá Model</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">Nhấp vào nút Quét để hệ thống AI tự động chạy kiểm thử chéo LOOCV (Leave-One-Out Cross-Validation) trên toàn bộ sinh viên để tìm ra độ chính xác thực tế.</p>
        </div>
      )}

      {hasData && (
        <div className="space-y-6 relative z-10 animate-fade-in">
          {/* Explanation Banner */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-5 flex items-center gap-2">
              <Info size={18} className="text-blue-400" /> Giải Thích Dễ Hiểu Về Các Chỉ Số Thống Kê (Dành Cho Slide Báo Cáo)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              <div className="space-y-2">
                <h4 className="text-emerald-500 dark:text-emerald-400 font-bold text-sm flex items-center gap-2">
                  <User size={16} /> Sai Số 0.0 - 0.5 (ĐẦU NGƯỜI)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Là số lượng sinh viên có điểm dự đoán lệch so với thực tế cực kỳ nhỏ (từ 0 đến nửa điểm). Điểm dự đoán xem như <strong className="text-slate-800 dark:text-slate-300">chính xác tuyệt đối</strong>.</p>
                <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700/50">Ví dụ: Dự đoán 8.0, thực tế 8.2 → Lệch 0.2 điểm (Nằm trong nhóm này).</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-amber-500 dark:text-amber-400 font-bold text-sm flex items-center gap-2">
                  <User size={16} /> Sai Số 0.6 - 1.0 (ĐẦU NGƯỜI)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Là số lượng sinh viên có điểm dự đoán lệch nhẹ (từ 0.6 đến 1 điểm). Sai lệch nhỏ, mô hình vẫn hoạt động <strong className="text-slate-800 dark:text-slate-300">ổn định, chấp nhận được</strong>.</p>
                <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700/50">Ví dụ: Dự đoán 7.5, thực tế 8.4 → Lệch 0.9 điểm (Nằm trong nhóm này).</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-rose-500 dark:text-rose-400 font-bold text-sm flex items-center gap-2">
                  <User size={16} /> Sai Số &gt; 1.0 (ĐẦU NGƯỜI)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Là số lượng sinh viên bị dự đoán lệch nhiều (trên 1 điểm). Sai lệch lớn, <strong className="text-slate-800 dark:text-slate-300">cần lưu ý</strong>.</p>
                <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700/50">Ví dụ: Dự đoán 8.0, thực tế 6.5 → Lệch 1.5 điểm. Đây được coi là kết quả dự đoán sai lệch đáng kể.</p>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <p>📌 <strong className="text-slate-700 dark:text-slate-300">MAE (Sai số trung bình):</strong> Là số điểm lệch trung bình của môn học đó (ví dụ MAE = 0.7 tức là dự đoán trung bình lệch ±0.7 điểm). <strong className="text-rose-500 dark:text-rose-300">Không phải số người!</strong></p>
              <p>📌 <strong className="text-slate-700 dark:text-slate-300">% Tỉ lệ (%):</strong> Được tính dựa trên số SV thực tế có đầu điểm kiểm thử của môn học đó (giúp so sánh khách quan khi số lượng SV học mỗi môn khác nhau).</p>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-sm">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ĐỘ CHÍNH XÁC TOÀN HỆ THỐNG</h4>
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-3">{overallAccuracy.toFixed(1)}<span className="text-2xl text-slate-500">%</span></div>
              <div className="text-xs font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 w-fit px-2 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={12} /> Đạt chuẩn tin cậy xuất sắc (&gt;90%)
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors shadow-sm">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">LỆCH TRUNG BÌNH (MAE TOÀN KHÓA)</h4>
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-3">±{mae.toFixed(2)} <span className="text-lg text-slate-500 font-medium">điểm</span></div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp size={12} className="text-blue-500 dark:text-blue-400" /> Biên dao động điểm số cực nhỏ
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors shadow-sm">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">TỔNG LƯỢT KIỂM THƯ CHÉO</h4>
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-3">{total.toLocaleString()} <span className="text-lg text-slate-500 font-medium">lượt</span></div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Info size={12} className="text-purple-500 dark:text-purple-400" /> {metrics.totalStudents} SV × {statsList.length} môn (loại trừ trống)
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-colors shadow-sm">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">TỈ LỆ DỰ ĐOÁN SIÊU CHUẨN (≤0.5)</h4>
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-3">{excellentRate.toFixed(1)}<span className="text-2xl text-slate-500">%</span></div>
              <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5 bg-amber-500/10 w-fit px-2 py-1 rounded-full border border-amber-500/20">
                <Zap size={12} /> {excellent.toLocaleString()} học sinh đạt độ khớp tuyệt đối
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <PieChart size={18} className="text-purple-500 dark:text-purple-400" /> Phân Bổ Sai Số Toàn Hệ Thống
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Cơ cấu tỉ lệ các mức độ sai lệch điểm số dự đoán của AI.</p>
              
              <div className="flex-1 min-h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '12px', color: isDark ? '#f8fafc' : '#0f172a' }}
                      itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                      formatter={(value) => [`${value.toLocaleString()} lượt`, 'Số lượng']}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      wrapperStyle={{ fontSize: '12px' }} 
                      formatter={(value) => <span className="text-slate-600 dark:text-slate-400 font-semibold">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                    <BarChart2Icon className="text-blue-500 dark:text-blue-400" /> Độ Chính Xác Theo Từng Môn Học
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">So sánh độ tin cậy dự báo AI của 12 môn học tiêu biểu (%).</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full">
                  Top 12 Môn Học
                </div>
              </div>

              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsList.slice(0, 12)} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis 
                      dataKey="subject" 
                      tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} 
                      tickLine={false} 
                      axisLine={{ stroke: isDark ? '#1e293b' : '#e2e8f0' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
                      tickLine={false} 
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '12px', color: isDark ? '#f8fafc' : '#0f172a' }}
                      labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value, name) => {
                        if (name === "accuracy") return [`${value}%`, 'Độ chính xác'];
                        if (name === "mae") return [`${value} điểm`, 'Sai số trung bình (MAE)'];
                        return [value, name];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} 
                      formatter={(value) => <span className="text-slate-600 dark:text-slate-400 font-semibold">{value}</span>}
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey={(data) => {
                         const total = data.count;
                         const ok = data.excellent + data.good;
                         return total > 0 ? Math.round((ok / total) * 100) : 0;
                      }} 
                      name="Độ chính xác (%)" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20} 
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="mae" 
                      name="Sai số trung bình (MAE)" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Per-subject Table */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 overflow-hidden flex flex-col mt-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                  <BookOpen size={18} className="text-emerald-500 dark:text-emerald-400" /> Bảng Số Liệu Kiểm Chứng Mô Hình Chi Tiết
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Dữ liệu kiểm thử chéo 34 môn học. Sắp xếp theo độ chính xác từ cao xuống thấp.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-[#0f172a] text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-y border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">STT</th>
                    <th className="px-4 py-3">Môn học</th>
                    <th className="px-4 py-3 text-center">Tổng SV</th>
                    <th className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400">Siêu Chuẩn (≤0.5)</th>
                    <th className="px-4 py-3 text-center text-blue-600 dark:text-blue-400">Khá Chuẩn (0.6-1.0)</th>
                    <th className="px-4 py-3 text-center text-rose-600 dark:text-rose-400">Lệch Lớn (&gt;1.0)</th>
                    <th className="px-4 py-3 text-center text-purple-600 dark:text-purple-400">Lệch TB (MAE)</th>
                    <th className="px-4 py-3 text-center text-blue-500">Độ Chính Xác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {statsList.map((stat, idx) => {
                    const total = stat.count;
                    if (total === 0) return null;
                    const acc = stat.accuracy !== undefined ? stat.accuracy : Math.round(((stat.excellent + stat.good) / total) * 1000) / 10;
                    return (
                      <tr key={stat.subject} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/50">
                        <td className="px-4 py-3 text-slate-500 font-medium">{idx + 1}</td>
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-300 font-semibold">{stat.subject}</td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{total}</td>
                        <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400/90">{stat.excellent} <span className="text-xs opacity-60">({Math.round(stat.excellent/total*100)}%)</span></td>
                        <td className="px-4 py-3 text-center text-blue-600 dark:text-blue-400/90">{stat.good} <span className="text-xs opacity-60">({Math.round(stat.good/total*100)}%)</span></td>
                        <td className="px-4 py-3 text-center text-rose-600 dark:text-rose-400/90">{stat.poor} <span className="text-xs opacity-60">({Math.round(stat.poor/total*100)}%)</span></td>
                        <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-medium">{stat.mae}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white bg-blue-500/5 rounded-md">{acc}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Slide Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative">
            <button 
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-500/10 text-blue-500 p-2.5 rounded-xl">
                <BookOpen size={24} />
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Hướng Dẫn Chụp Slide Báo Cáo</h2>
            </div>
            
            <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300">
              <p className="leading-relaxed">
                Để có những bức ảnh chụp biểu đồ và bảng số liệu kiểm chứng sắc nét, chuẩn kích thước để đưa vào Slide báo cáo, hãy làm theo hướng dẫn sau:
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 font-bold flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white mb-1">Mở chế độ toàn màn hình</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Nhấn phím <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono shadow-sm">F11</kbd> trên Windows hoặc <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono shadow-sm">Control + Cmd + F</kbd> trên macOS để ẩn thanh địa chỉ trình duyệt.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 font-bold flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white mb-1">Dùng phím tắt chụp màn hình nhanh</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                      Sử dụng tổ hợp phím chụp vùng màn hình mong muốn:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2 text-xs text-slate-500 dark:text-slate-400">
                      <li><strong>Windows:</strong> <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono shadow-sm">Win + Shift + S</kbd> rồi kéo chuột chọn vùng.</li>
                      <li><strong>macOS:</strong> <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono shadow-sm">Cmd + Shift + 4</kbd> rồi kéo chuột chọn vùng.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 font-bold flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-slate-950 dark:text-white mb-1">Dán vào PowerPoint / Google Slides</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Chuyển sang slide PowerPoint của bạn và nhấn <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono shadow-sm">Ctrl + V</kbd> (hoặc <kbd className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono shadow-sm">Cmd + V</kbd> trên Mac) để dán trực tiếp ảnh.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setShowGuide(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 text-sm"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

// Helper component for BarChart2Icon inside the file since it's not imported directly in the same way 
const BarChart2Icon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

export default AIMetrics;
