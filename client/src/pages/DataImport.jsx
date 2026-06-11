import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, DatabaseZap, X } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

const DataImport = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [publishStatus, setPublishStatus] = useState(null); // 'loading', 'success', 'error'
  const [mssvInput, setMssvInput] = useState("");
  const [classCodeInput, setClassCodeInput] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      handlePreview(selectedFile);
    } else {
      alert("Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV");
    }
  };

  const handlePreview = async (fileToUpload) => {
    setLoading(true);
    setPreviewData(null);
    setPublishStatus(null);
    
    const formData = new FormData();
    formData.append('file', fileToUpload);
    if (mssvInput.trim() !== '') {
      formData.append('mssv', mssvInput.trim());
    }
    if (classCodeInput.trim() !== '') {
      formData.append('classCode', classCodeInput.trim());
    }

    try {
      const res = await api.post('/v1/data/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setPreviewData(res.data);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi đọc file: ' + (err.response?.data?.error || err.message));
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!previewData || previewData.validRows === 0) return;
    
    setPublishStatus('loading');
    try {
      const payload = { data: previewData.data };
      if (classCodeInput.trim() !== '') {
        payload.classCode = classCodeInput.trim();
      }
      
      const res = await api.post('/v1/data/publish', payload);
      setPublishStatus('success');
    } catch (err) {
      console.error(err);
      setPublishStatus('error');
      alert('Lỗi khi publish dữ liệu: ' + (err.response?.data?.error || err.message));
    }
  };

  const resetFlow = () => {
    setFile(null);
    setPreviewData(null);
    setPublishStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <DatabaseZap className="text-blue-400" /> Nhập liệu điểm (Bulk Import)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Upload file Excel để cập nhật điểm hàng loạt cho sinh viên.</p>
        </div>
      </div>

      {/* STEP 1: Upload */}
      {!previewData && !loading && (
        <div 
          className={`glass-panel p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-slate-200 dark:border-white/10 hover:border-white/20'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <UploadCloud size={40} className="text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Kéo thả file Excel vào đây</h3>
          <p className="text-slate-700 dark:text-slate-400 text-sm mb-6 text-center max-w-md font-semibold">
            Hỗ trợ định dạng .xlsx, .xls. Cấu trúc file cần có các cột: <br/>
            <code className="bg-white dark:bg-blue-900/30 text-[#0F172A] dark:text-blue-300 border border-slate-200 dark:border-transparent px-2.5 py-1 rounded mx-1 mt-2 inline-block font-black shadow-sm">mssv</code> 
            <code className="bg-white dark:bg-blue-900/30 text-[#0F172A] dark:text-blue-300 border border-slate-200 dark:border-transparent px-2.5 py-1 rounded mx-1 mt-2 inline-block font-black shadow-sm">course</code>
            <code className="bg-white dark:bg-blue-900/30 text-[#0F172A] dark:text-blue-300 border border-slate-200 dark:border-transparent px-2.5 py-1 rounded mx-1 mt-2 inline-block font-black shadow-sm">final</code> (hoặc Thang điểm 10)
          </p>
          
          <div className="w-full max-w-md mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mã Lớp (Tùy chọn)</label>
              <input 
                type="text" 
                placeholder="VD: WD18301" 
                value={classCodeInput}
                onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-xs text-slate-500 mt-1">Gán tất cả sinh viên trong file vào lớp này.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">MSSV (Tùy chọn)</label>
              <input 
                type="text" 
                placeholder="VD: PH47261" 
                value={mssvInput}
                onChange={(e) => setMssvInput(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-xs text-slate-500 mt-1">Nếu file cá nhân không có cột MSSV.</p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleChange}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-medium rounded-xl transition-colors shadow-lg shadow-sm dark:shadow-blue-500/20"
          >
            Chọn file từ máy tính
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Đang xử lý dữ liệu...</h3>
          <p className="text-slate-600 dark:text-slate-400">Hệ thống đang parse và validate file Excel của bạn.</p>
        </div>
      )}

      {/* STEP 2: Preview & Validate */}
      {previewData && publishStatus !== 'success' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 border border-slate-200 dark:border-white/5">
            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4">
              <FileSpreadsheet className="text-blue-400" size={32} />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">File</p>
                <p className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{file?.name}</p>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4">
              <DatabaseZap className="text-slate-900 dark:text-white" size={32} />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tổng số dòng</p>
                <p className="font-bold text-slate-900 dark:text-white text-xl">{previewData.totalRows}</p>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-4">
              <CheckCircle2 className="text-green-400" size={32} />
              <div>
                <p className="text-sm text-green-400">Hợp lệ</p>
                <p className="font-bold text-green-400 text-xl">{previewData.validRows}</p>
              </div>
            </div>
            <div className={`p-4 rounded-2xl flex items-center gap-4 ${previewData.invalidRows > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'}`}>
              <AlertCircle className={previewData.invalidRows > 0 ? "text-red-400" : "text-slate-500"} size={32} />
              <div>
                <p className={`text-sm ${previewData.invalidRows > 0 ? 'text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>Lỗi Validation</p>
                <p className={`font-bold text-xl ${previewData.invalidRows > 0 ? 'text-red-400' : 'text-slate-900 dark:text-white'}`}>{previewData.invalidRows}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-bold text-slate-900 dark:text-white">Data Preview (Draft)</h3>
              {previewData.hasErrors && (
                <span className="text-sm text-red-400 bg-red-500/10 px-3 py-1 rounded-full font-medium flex items-center gap-2">
                  <AlertCircle size={14} /> Có lỗi validation. Chỉ các dòng hợp lệ mới được import.
                </span>
              )}
            </div>
            <div className="overflow-auto flex-1 p-0">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-slate-200 dark:bg-black/40 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-white/5">Row</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-white/5">MSSV</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-white/5">Môn học</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-white/5">Điểm tổng kết</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-white/5">Học kỳ</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-white/5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {previewData.data.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-white/5 transition-colors ${!row.isValid ? 'bg-red-500/5' : ''}`}>
                      <td className="p-4 text-slate-500">{row._row}</td>
                      <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{row.mssv}</td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">{row.course}</td>
                      <td className="p-4 text-slate-800 dark:text-slate-200">
                        {row.score !== null ? (
                          <span className={row.score < 5 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{row.score}</span>
                        ) : '-'}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{row.semester}</td>
                      <td className="p-4">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-medium">
                            <CheckCircle2 size={12} /> Hợp lệ
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {row.errors.map((err, eIdx) => (
                              <span key={eIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium">
                                <AlertCircle size={12} /> {err}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button 
              onClick={resetFlow}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-900 dark:text-white font-medium rounded-xl transition-colors"
              disabled={publishStatus === 'loading'}
            >
              Hủy / Upload lại
            </button>
            <button 
              onClick={handlePublish}
              disabled={previewData.validRows === 0 || publishStatus === 'loading'}
              className="px-6 py-3 bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-purple-600 hover:dark:from-blue-500 hover:dark:to-purple-500 text-slate-900 dark:text-white font-bold rounded-xl transition-all shadow-lg shadow-sm dark:shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishStatus === 'loading' ? (
                <><Loader2 size={18} className="animate-spin" /> Đang import...</>
              ) : (
                <><DatabaseZap size={18} /> Công bố {previewData.validRows} bản ghi</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Success Screen */}
      {publishStatus === 'success' && (
        <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
            <CheckCircle2 size={48} className="text-green-400 relative z-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Import Thành Công!</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">Đã lưu {previewData?.validRows} bản ghi vào hệ thống.</p>
          <p className="text-blue-400 text-sm bg-blue-500/10 px-4 py-2 rounded-lg inline-flex items-center gap-2 mb-8 border border-blue-200 dark:border-blue-500/20">
            <Loader2 size={14} className="animate-spin" /> AI đang phân tích dữ liệu và cập nhật Risk Map...
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={resetFlow}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-900 dark:text-white font-medium rounded-xl transition-colors"
            >
              Import Thêm
            </button>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white font-medium rounded-xl transition-colors shadow-lg shadow-sm dark:shadow-blue-500/20"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DataImport;
