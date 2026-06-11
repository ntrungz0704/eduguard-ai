import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart3, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp, Clock, Info } from 'lucide-react';

const AIMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ai-evaluation');
      if (res.data && !res.data.empty) {
        setMetrics(res.data);
      } else {
        setMetrics(null);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRunEvaluation = async () => {
    try {
      setRunning(true);
      const res = await api.post('/ai-evaluation/run');
      alert(res.data.message);
      
      // Auto refresh after 15 seconds
      setTimeout(() => {
        fetchMetrics();
        setRunning(false);
      }, 15000);
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.message));
      setRunning(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" />
            Đánh giá Hiệu suất Mô hình AI (LOOCV)
          </h1>
          <p className="text-slate-500 mt-1">Đánh giá độ chính xác của thuật toán dự đoán điểm số trên toàn hệ thống</p>
        </div>
        <button
          onClick={handleRunEvaluation}
          disabled={running}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
            running ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          <RefreshCw size={18} className={running ? "animate-spin" : ""} />
          {running ? 'Đang chạy (Vui lòng đợi 15s)...' : 'Quét lại toàn bộ hệ thống'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {!metrics && !loading && (
        <div className="bg-slate-50 p-12 text-center rounded-2xl border border-slate-200">
          <Info size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-xl font-medium text-slate-700">Chưa có dữ liệu đánh giá</h3>
          <p className="text-slate-500 mt-2">Vui lòng nhấp vào nút "Quét lại toàn bộ hệ thống" để bắt đầu tiến trình nội suy LOOCV.</p>
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-500"/> Tổng Lượt Đoán
              </div>
              <div className="text-3xl font-bold text-slate-800">{metrics.totalPredictions.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mt-2">Cross-Validation trên {metrics.totalStudents} sinh viên</div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500"/> MAE (Sai số TB)
              </div>
              <div className="text-3xl font-bold text-slate-800">{metrics.mae.toFixed(2)}</div>
              <div className="text-xs text-slate-400 mt-2">Điểm chênh lệch tuyệt đối trung bình</div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500"/> Phạm vi kiểm tra
              </div>
              <div className="text-3xl font-bold text-slate-800">{metrics.totalSubjects}</div>
              <div className="text-xs text-slate-400 mt-2">Môn học trong hệ thống</div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                <Clock size={16} className="text-purple-500"/> Thời gian quét
              </div>
              <div className="text-3xl font-bold text-slate-800">{(metrics.durationMs / 1000).toFixed(1)}s</div>
              <div className="text-xs text-slate-400 mt-2">Cập nhật: {new Date(metrics.lastRunTime).toLocaleTimeString('vi-VN')}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Phân bổ Sai số Dự đoán (Error Distribution)</h3>
            
            <div className="space-y-6">
              <MetricBar 
                label="Rất chính xác (Sai số 0.0 → 0.5 điểm)" 
                count={metrics.buckets["0.0_to_0.5"]} 
                total={metrics.totalPredictions} 
                color="bg-emerald-500" 
                icon={<CheckCircle2 size={18} className="text-emerald-500" />}
              />
              <MetricBar 
                label="Khá chính xác (Sai số 0.5 → 1.0 điểm)" 
                count={metrics.buckets["0.5_to_1.0"]} 
                total={metrics.totalPredictions} 
                color="bg-blue-500" 
                icon={<Info size={18} className="text-blue-500" />}
              />
              <MetricBar 
                label="Chênh lệch cao (Sai số > 1.0 điểm)" 
                count={metrics.buckets["more_than_1.0"]} 
                total={metrics.totalPredictions} 
                color="bg-rose-500" 
                icon={<AlertTriangle size={18} className="text-rose-500" />}
              />
            </div>
            
            <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-2">💡 Giải thích phương pháp (Methodology)</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Hệ thống sử dụng kỹ thuật <strong>Leave-One-Out Cross-Validation (LOOCV)</strong>. Đối với mỗi điểm số thực tế của sinh viên, hệ thống sẽ tạm thời <i>giấu (mask)</i> điểm đó đi và dùng toàn bộ dữ liệu của các sinh viên khác để huấn luyện mô hình dự đoán. Điểm dự đoán sau đó được đem so sánh với điểm thực tế bị giấu để tính ra sai số tuyệt đối (Absolute Error). Toàn bộ quá trình diễn ra trên RAM và hoàn toàn không làm thay đổi hay giả mạo dữ liệu thật của sinh viên.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MetricBar = ({ label, count, total, color, icon }) => {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(2) : 0;
  
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          {icon} {label}
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-slate-800">{count.toLocaleString()} lượt</span>
          <span className="text-slate-500 text-sm ml-2">({percentage}%)</span>
        </div>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200/50">
        <div className={`h-4 rounded-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

export default AIMetrics;
