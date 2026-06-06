import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useStore } from '../store';
import {
  KanbanSquare, CheckCircle, Clock, AlertCircle, Sparkles, Loader2,
  FolderGit2, Award, Calendar, RefreshCw, ChevronRight, ChevronLeft,
  Link2, PlusCircle, Play, Info, ArrowUpRight, Trophy
} from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} style={{ width: props.size, height: props.size }}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const SKILL_TIERS_FRONTEND = {
  "node.js": 15, "react": 15, "postgresql": 12, "sql": 10, "javascript": 15,
  "html": 10, "css": 10, "git and github": 10, "rest api": 12, "docker": 10,
  "typescript": 12, "next.js": 12, "state management": 10, "tailwind": 8,
  "performance": 8, "seo": 8, "testing": 10, "prompt engineering": 8
};

function getSkillImpact(skillName) {
  const clean = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, val] of Object.entries(SKILL_TIERS_FRONTEND)) {
    if (clean.includes(key) || key.includes(clean)) return val;
  }
  return 8; // Default impact score
}

function getDaysOfLearning(task) {
  if (!task || !task.started_at) return 0;
  const start = new Date(task.started_at);
  const end = task.completed_at ? new Date(task.completed_at) : new Date();
  const diffTime = Math.max(0, end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 1;
}

export default function CareerRoadmapBoard() {
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  
  const [careers, setCareers] = useState([]);
  const [selectedCareerId, setSelectedCareerId] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Roadmap Tasks State
  const [tasks, setTasks] = useState([]);
  
  // Evidence Modal State
  const [evidenceModalTask, setEvidenceModalTask] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  
  // Drag and drop state
  const [dragOverCol, setDragOverCol] = useState(null);
  
  const studentId = currentUser?.id || 'SE182001';
  const mode = currentUser?.role === 'STUDENT' ? 'STUDENT' : 'GUEST';

  // 1. Fetch careers list
  useEffect(() => {
    const fetchCareers = async () => {
      try {
        let res;
        try {
          res = await api.get('/v1/knowledge/careers');
        } catch {
          res = await api.get('/knowledge/careers');
        }
        const list = res.data.data || [];
        setCareers(list);
        if (list.length > 0) {
          // Default to Backend Developer or first item
          const defaultCareer = list.find(c => c.careerName.toLowerCase().includes('backend')) || list[0];
          setSelectedCareerId(defaultCareer.id);
        }
      } catch (err) {
        console.error('Failed to load careers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCareers();
  }, []);

  // 2. Fetch analysis when career changes
  useEffect(() => {
    if (!selectedCareerId) return;
    
    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      try {
        let res;
        try {
          res = await api.get(`/v1/knowledge/careers/${selectedCareerId}/analyze/${studentId}`);
        } catch {
          res = await api.get(`/knowledge/careers/${selectedCareerId}/analyze/${studentId}`);
        }
        const data = res.data.data || null;
        setAnalysis(data);
        
        // 3. Initialize or load tasks from Backend API
        const loadTasks = async () => {
          let loadedTasks = null;
          try {
            const res = await api.get(`/learning/board/${studentId}/${selectedCareerId}`);
            if (res.data && res.data.length > 0) {
              loadedTasks = res.data;
            }
          } catch (e) {
            console.warn("Không thể tải tasks từ DB (Có thể chưa bật DB):", e);
            // Cố gắng khôi phục từ localStorage nếu DB lỗi
            const storageKey = `eduguard_roadmap_tasks_${studentId}_${selectedCareerId}`;
            const storedTasks = localStorage.getItem(storageKey);
            if (storedTasks) {
              loadedTasks = JSON.parse(storedTasks);
            }
          }

          if (loadedTasks) {
            setTasks(loadedTasks);
          } else if (data) {
            // Map skills from backend analysis to tasks
            const allCore = data.industryRequirements?.core || [];
            const allAdv = data.industryRequirements?.advanced || [];
            const allSkills = [
              ...allCore.map(s => ({ name: s, type: 'core' })), 
              ...allAdv.map(s => ({ name: s, type: 'advanced' })),
              { name: 'Portfolio Project', type: 'advanced' },
              { name: 'Internship Ready', type: 'advanced' }
            ];
            
            const initialTasks = allSkills.map((s, idx) => {
              const clean = s.name.toLowerCase();
              const haveCore = (data.skillGap?.core?.have || []).map(x => x.toLowerCase());
              const haveAdv = (data.skillGap?.advanced?.have || []).map(x => x.toLowerCase());
              
              let status = 'TODO';
              if (haveCore.includes(clean) || haveAdv.includes(clean)) {
                status = 'DONE';
              }
              
              // Check if course teaches it and is currently IN_PROGRESS
              const isStudying = (data.academicProgress || []).some(
                c => c.status === 'IN_PROGRESS' && c.skills.some(x => x.toLowerCase() === clean)
              );
              if (isStudying && status !== 'DONE') {
                status = 'IN_PROGRESS';
              }
              
              return {
                id: `${selectedCareerId}_task_${idx}`,
                title: s.name,
                type: s.type,
                status,
                impact: getSkillImpact(s.name),
                duration: s.type === 'core' ? '4-6 ngày' : '7-10 ngày',
                started_at: status === 'IN_PROGRESS' ? new Date().toISOString().split('T')[0] : null,
                completed_at: status === 'DONE' ? new Date().toISOString().split('T')[0] : null,
                updated_at: new Date().toISOString().split('T')[0],
                github: null,
                demo: null,
                screenshot: null,
                evidenceStatus: status === 'DONE' ? 'VERIFIED' : 'NONE',
                verified: status === 'DONE'
              };
            });
            
            setTasks(initialTasks);
            try {
              await api.put(`/learning/board/${studentId}/${selectedCareerId}`, { tasks: initialTasks });
            } catch (e) {
              console.warn("Không thể lưu tasks lên DB, lưu tạm vào localStorage");
              localStorage.setItem(`eduguard_roadmap_tasks_${studentId}_${selectedCareerId}`, JSON.stringify(initialTasks));
            }
          }
        };
        loadTasks();
      } catch (err) {
        console.error('Failed to load analysis:', err);
      } finally {
        setLoadingAnalysis(false);
      }
    };
    fetchAnalysis();
  }, [selectedCareerId, studentId]);

  // Save tasks state to Backend API (fallback to localStorage if DB down)
  const saveTasks = async (updatedTasks) => {
    setTasks(updatedTasks);
    try {
      await api.put(`/learning/board/${studentId}/${selectedCareerId}`, { tasks: updatedTasks });
    } catch (e) {
      console.warn("Lỗi khi lưu tasks lên DB, lưu tạm vào localStorage:", e);
      localStorage.setItem(`eduguard_roadmap_tasks_${studentId}_${selectedCareerId}`, JSON.stringify(updatedTasks));
    }
  };

  // Move task to a new status
  const moveTask = (task, newStatus) => {
    if (newStatus === 'DONE') {
      // Prompt for evidence modal
      setEvidenceModalTask(task);
      setGithubUrl(task.github || '');
      setDemoUrl(task.demo || '');
    } else {
      const updated = tasks.map(t => {
        if (t.id === task.id) {
          recordLearningEvent(t.title, t.status, newStatus);
          return {
            ...t,
            status: newStatus,
            started_at: newStatus === 'IN_PROGRESS' ? (t.started_at || new Date().toISOString().split('T')[0]) : null,
            completed_at: null,
            updated_at: new Date().toISOString().split('T')[0],
            github: null,
            demo: null,
            screenshot: null,
            evidenceStatus: 'NONE',
            verified: false
          };
        }
        return t;
      });
      saveTasks(updated);
    }
  };

  // Submit Evidence
  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceModalTask) return;
    
    let isVerified = false;
    let evidenceStatus = githubUrl ? 'PENDING' : 'NONE';
    let extraPoints = 0;
    
    // Auto Verify via GitHub API if a github link is provided
    if (githubUrl) {
      try {
        const res = await api.post('/github/verify', { githubUrl });
        if (res.data && res.data.success) {
          isVerified = true;
          evidenceStatus = 'VERIFIED';
          extraPoints = res.data.data.pointsAwarded || 0;
          alert(`🎉 Xác thực GitHub thành công! Bạn nhận được ${extraPoints} điểm kinh nghiệm từ dự án này.\n\nCông nghệ phát hiện: ${res.data.data.languages.join(', ')}`);
        }
      } catch (err) {
        console.warn('Lỗi xác thực GitHub:', err);
        alert('Không thể xác thực tự động. Link GitHub của bạn sẽ được giảng viên duyệt tay.');
      }
    }
    
    const updated = tasks.map(t => {
      if (t.id === evidenceModalTask.id) {
        recordLearningEvent(t.title, t.status, 'DONE');
        return {
          ...t,
          status: 'DONE',
          completed_at: new Date().toISOString().split('T')[0],
          started_at: t.started_at || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          github: githubUrl || null,
          demo: demoUrl || null,
          screenshot: screenshotUrl || null,
          evidenceStatus,
          verified: isVerified,
          points: extraPoints
        };
      }
      return t;
    });
    
    await saveTasks(updated);
    setEvidenceModalTask(null);
  };

  // Complete Without Evidence
  const handleCompleteWithoutEvidence = () => {
    if (!evidenceModalTask) return;
    
    const updated = tasks.map(t => {
      if (t.id === evidenceModalTask.id) {
        recordLearningEvent(t.title, t.status, 'DONE');
        return {
          ...t,
          status: 'DONE',
          completed_at: t.completed_at || new Date().toISOString().split('T')[0],
          started_at: t.started_at || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0],
          github: null,
          demo: null,
          screenshot: null,
          evidenceStatus: 'NONE',
          verified: false
        };
      }
      return t;
    });
    
    saveTasks(updated);
    setEvidenceModalTask(null);
  };

  // Helper to record learning events in LocalStorage
  const recordLearningEvent = (skillName, fromStatus, toStatus) => {
    const eventsKey = `eduguard_learning_events_${studentId}`;
    const stored = localStorage.getItem(eventsKey);
    const events = stored ? JSON.parse(stored) : [];
    const newEvent = {
      id: `event_${Date.now()}`,
      careerId: selectedCareerId,
      skill: skillName,
      from: fromStatus,
      to: toStatus,
      timestamp: new Date().toISOString()
    };
    const updated = [newEvent, ...events];
    localStorage.setItem(eventsKey, JSON.stringify(updated));
  };

  // Simulate Teacher/Admin Verification Review
  const simulateEvidenceReview = (taskId, reviewStatus) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          evidenceStatus: reviewStatus,
          verified: reviewStatus === 'VERIFIED',
          updated_at: new Date().toISOString().split('T')[0]
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    if (dragOverCol !== status) {
      setDragOverCol(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      moveTask(task, newStatus);
    }
  };

  // Reset Board Tasks
  const handleResetBoard = () => {
    if (window.confirm("Bạn có chắc chắn muốn thiết lập lại bảng lộ trình này để đồng bộ với các môn học ở trường không?")) {
      localStorage.removeItem(`eduguard_roadmap_tasks_${studentId}_${selectedCareerId}`);
      // Trigger reload by resetting state
      setSelectedCareerId('');
      setTimeout(() => {
        const defaultCareer = careers.find(c => c.id === selectedCareerId) || careers[0];
        if (defaultCareer) setSelectedCareerId(defaultCareer.id);
      }, 50);
    }
  };

  // 4. Calculate Dynamic UI Values (Overlaying local Kanban tasks state on top of backend Analysis)
  const computedMetrics = useMemo(() => {
    if (!analysis || tasks.length === 0) return { progressPercent: 0, readinessScore: 0, forecasts: [] };
    
    const total = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'DONE');
    const progressPercent = Math.round((doneTasks.length / total) * 100);
    
    // Calculate new readiness score
    const academicScore = analysis.scores?.academic || 0;
    
    // Industry Score: based on local done tasks
    const totalWeight = tasks.reduce((sum, t) => sum + t.impact, 0);
    const acquiredWeight = doneTasks.reduce((sum, t) => sum + t.impact, 0);
    const industryScore = totalWeight > 0 ? (acquiredWeight / totalWeight) * 100 : 0;
    
    // Portfolio: based on tasks with Github evidence
    const verifiedTasksCount = doneTasks.filter(t => t.evidenceStatus === 'VERIFIED').length;
    const portfolioScore = Math.min(100, verifiedTasksCount * 33);
    
    // Behavior: remains unchanged from backend
    const behaviorScore = analysis.scores?.behavior || 0;
    
    const readinessScore = Math.round(
      (academicScore * 0.3) + 
      (industryScore * 0.4) + 
      (portfolioScore * 0.2) + 
      (behaviorScore * 0.1)
    );
    
    // Determine target forecasts (skills in IN_PROGRESS or top TODO)
    const activeMissing = tasks.filter(t => t.status !== 'DONE')
                               .sort((a,b) => b.impact - a.impact);
    const forecasts = activeMissing.slice(0, 2).map(t => ({
      action: `Hoàn thành học ${t.title}`,
      points: Math.round((t.impact / (totalWeight || 1)) * 100 * 0.4)
    }));
    
    // Add portfolio gain forecast if portfolio is not full
    if (portfolioScore < 100) {
      forecasts.push({
        action: "Nộp minh chứng GitHub cho 1 kỹ năng",
        points: 7 // +7 points to readiness
      });
    }

    return {
      progressPercent,
      readinessScore: Math.min(100, Math.max(0, readinessScore)),
      forecasts,
      academicScore,
      industryScore: Math.round(industryScore),
      portfolioScore: Math.round(portfolioScore),
      behaviorScore,
      doneTasksCount: doneTasks.length,
      totalTasksCount: total
    };
  }, [analysis, tasks]);

  // Group tasks by status for Kanban columns
  const columns = useMemo(() => {
    return {
      TODO: tasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      DONE: tasks.filter(t => t.status === 'DONE')
    };
  }, [tasks]);

  // AI Coach Warning Alerts
  const aiCoachAlerts = useMemo(() => {
    const alerts = [];
    if (!analysis) return [];
    
    const inProgress = columns.IN_PROGRESS;
    if (inProgress.length > 0) {
      alerts.push({
        type: 'warning',
        message: `Bạn đã học ${inProgress[0].title} được 8 ngày. Thời gian hoàn thành trung bình là 4-6 ngày. Bạn có gặp khó khăn với bài thực hành nào không? Hãy hỏi Chatbot hoặc nhắn tin cho giảng viên hướng dẫn!`
      });
    }
    
    const todoList = columns.TODO.sort((a,b) => b.impact - a.impact);
    if (todoList.length > 0) {
      const top = todoList[0];
      alerts.push({
        type: 'priority',
        message: `HỌC NGAY: Hãy bắt đầu học ${top.title} (+${top.impact} điểm). Đây là kỹ năng cốt lõi quan trọng giúp tăng nhanh Điểm Phù hợp của bạn.`
      });
      
      if (todoList.length > 1) {
        const secondary = todoList[1];
        alerts.push({
          type: 'info',
          message: `HỌC SAU: Xem xét chuẩn bị học kỹ năng ${secondary.title} (+${secondary.impact} điểm) sau khi bạn hoàn thành ${top.title}.`
        });
      }
    }
    
    return alerts;
  }, [columns, analysis]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <KanbanSquare size={20} className="text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Học tập & Vận hành</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Bảng Lộ trình Học tập</h1>
        </div>

        {/* Career Selection & Sync */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCareerId}
            onChange={(e) => setSelectedCareerId(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500/50"
          >
            {careers.map(c => (
              <option key={c.id} value={c.id}>{c.careerName}</option>
            ))}
          </select>

          <button
            onClick={handleResetBoard}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
          >
            <RefreshCw size={13} />
            Đồng bộ từ trường học
          </button>
        </div>
      </div>

      {loading || loadingAnalysis ? (
        <div className="h-96 w-full flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 size={32} className="text-blue-500 animate-spin" />
            <p className="text-slate-400 font-medium">Đang đồng bộ dữ liệu học tập...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Summary Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Target Career & Progress */}
            <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mục tiêu nghề nghiệp</p>
                <h3 className="text-base font-black text-slate-900 dark:text-white truncate mt-1">
                  {careers.find(c => c.id === selectedCareerId)?.careerName || 'N/A'}
                </h3>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Tiến độ Lộ trình</span>
                  <span>{computedMetrics.progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${computedMetrics.progressPercent}%` }} />
                </div>
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Đã hoàn thành: {computedMetrics.doneTasksCount}/{computedMetrics.totalTasksCount} kỹ năng</p>
              </div>
            </div>

            {/* Readiness score */}
            <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-2 text-center flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Độ sẵn sàng hiện tại</p>
              <div className="text-4xl font-black text-blue-600 dark:text-blue-400">{computedMetrics.readinessScore}<span className="text-xs text-slate-500 font-normal">/100</span></div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 uppercase">
                {getReadinessConfig(computedMetrics.readinessScore).label}
              </span>
            </div>

            {/* Projected score Forecast */}
            <div className="glass-card rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-5 bg-emerald-500/5 space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Sparkles size={11} /> Dự báo tăng điểm sẵn sàng</p>
                <div className="space-y-1.5 mt-2">
                  {computedMetrics.forecasts.length > 0 ? (
                    computedMetrics.forecasts.map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        <span className="truncate pr-2">• {f.action}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">+{f.points}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">Tất cả mục tiêu đã hoàn thành!</p>
                  )}
                </div>
              </div>
              <div className="border-t border-emerald-500/10 pt-2 flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400">
                <span>Dự phóng cao nhất:</span>
                <span>{Math.min(100, computedMetrics.readinessScore + computedMetrics.forecasts.reduce((sum, f) => sum + f.points, 0))}/100</span>
              </div>
            </div>

            {/* Time Estimate */}
            <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời gian dự kiến</p>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {analysis?.estimatedMonthsText || 'N/A'}
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                Được tính toán dựa trên số lượng kỹ năng còn lại trên bảng lộ trình và thời gian tự học trung bình 1-2h/ngày.
              </p>
            </div>

          </div>

          {/* AI Coach Insights Panel */}
          {aiCoachAlerts.length > 0 && (
            <div className="glass-card rounded-2xl border border-blue-200 dark:border-blue-500/20 p-5 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 space-y-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Sparkles size={16} />
                <h3 className="font-extrabold text-sm">Nhận xét từ AI Coach</h3>
              </div>
              <div className="space-y-2">
                {aiCoachAlerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="shrink-0 mt-0.5">
                      {alert.type === 'warning' ? '⚠️' : alert.type === 'priority' ? '🔥' : '💡'}
                    </span>
                    <p className="leading-relaxed font-semibold">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kanban Board Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: TODO */}
            <div 
              onDragOver={(e) => handleDragOver(e, 'TODO')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'TODO')}
              className={`glass-card rounded-2xl border p-5 space-y-4 transition-all duration-200 ${
                dragOverCol === 'TODO' 
                  ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">TO DO</h3>
                </div>
                <span className="text-xs font-black bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-slate-500">{columns.TODO.length}</span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {columns.TODO.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="glass-card bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-white/5 p-4 space-y-3 hover:border-blue-500/30 transition-all group cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{task.title}</h4>
                      <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">+{task.impact} Pt</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Dự kiến: {task.duration}</span>
                      <button 
                        onClick={() => moveTask(task, 'IN_PROGRESS')}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Bắt đầu học <Play size={10} />
                      </button>
                    </div>
                  </div>
                ))}
                {columns.TODO.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-8">Không còn kỹ năng nào cần học!</p>
                )}
              </div>
            </div>

            {/* Column 2: IN PROGRESS */}
            <div 
              onDragOver={(e) => handleDragOver(e, 'IN_PROGRESS')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
              className={`glass-card rounded-2xl border p-5 space-y-4 transition-all duration-200 ${
                dragOverCol === 'IN_PROGRESS' 
                  ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">IN PROGRESS</h3>
                </div>
                <span className="text-xs font-black bg-blue-500/10 px-2 py-0.5 rounded text-blue-500">{columns.IN_PROGRESS.length}</span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {columns.IN_PROGRESS.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="glass-card bg-white dark:bg-slate-900/60 rounded-xl border border-blue-500/20 dark:border-blue-500/30 p-4 space-y-3 shadow-sm shadow-blue-500/5 cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{task.title}</h4>
                      <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shrink-0">+{task.impact} Pt</span>
                    </div>
                    {task.started_at && (
                      <div className="flex flex-col gap-0.5 text-[9px] text-slate-400 font-bold">
                        <p className="flex items-center gap-1"><Calendar size={10} /> Ngày bắt đầu: {task.started_at}</p>
                        <p className="flex items-center gap-1">⏱️ Thời gian học: {getDaysOfLearning(task)} ngày</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
                      <button 
                        onClick={() => moveTask(task, 'TODO')}
                        className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <ChevronLeft size={10} /> Hủy
                      </button>
                      <button 
                        onClick={() => moveTask(task, 'DONE')}
                        className="text-[10px] font-black text-emerald-500 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        Xong <CheckCircle size={10} />
                      </button>
                    </div>
                  </div>
                ))}
                {columns.IN_PROGRESS.length === 0 && (
                  <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-xl p-8 text-center text-slate-500 italic text-xs">
                    Kéo thả thẻ vào đây hoặc nhấn "Bắt đầu học"
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: DONE */}
            <div 
              onDragOver={(e) => handleDragOver(e, 'DONE')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'DONE')}
              className={`glass-card rounded-2xl border p-5 space-y-4 transition-all duration-200 ${
                dragOverCol === 'DONE' 
                  ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                  : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/20'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">DONE</h3>
                </div>
                <span className="text-xs font-black bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-500">{columns.DONE.length}</span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {columns.DONE.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="glass-card bg-white dark:bg-slate-900/60 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30 p-4 space-y-3 hover:border-emerald-500/40 transition-all cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                        {task.title}
                      </h4>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                        task.evidenceStatus === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-200 text-emerald-600 dark:text-emerald-400' :
                        task.evidenceStatus === 'REJECTED' ? 'bg-rose-500/10 border-rose-200 text-rose-600 dark:text-rose-400' :
                        task.evidenceStatus === 'PENDING' ? 'bg-amber-500/10 border-amber-200 text-amber-600 dark:text-amber-400 animate-pulse' :
                        'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        {task.evidenceStatus === 'VERIFIED' ? 'Đã xác thực' :
                         task.evidenceStatus === 'REJECTED' ? 'Bị từ chối' :
                         task.evidenceStatus === 'PENDING' ? 'Đang chờ duyệt' :
                         'Đã hoàn thành'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[9px] text-slate-400 font-bold">
                      {task.completed_at && (
                        <div className="flex flex-col gap-0.5">
                          <p className="flex items-center gap-1"><Calendar size={10} /> Hoàn thành: {task.completed_at}</p>
                          {task.started_at && <p className="flex items-center gap-1">⏱️ Thời gian học: {getDaysOfLearning(task)} ngày</p>}
                        </div>
                      )}
                      {task.github ? (
                        <div className="flex flex-col gap-1 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/5 space-y-1">
                          <div className="text-[9px] uppercase tracking-wider text-slate-500">Minh chứng học tập:</div>
                          <a href={task.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                            <GithubIcon size={10} /> Kho lưu trữ GitHub <ArrowUpRight size={8} />
                          </a>
                          {task.demo && (
                            <a href={task.demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                              <Link2 size={10} /> Bản demo chạy trực tiếp <ArrowUpRight size={8} />
                            </a>
                          )}
                          {task.screenshot && (
                            <a href={task.screenshot} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                              <Link2 size={10} /> Ảnh chụp màn hình <ArrowUpRight size={8} />
                            </a>
                          )}

                          {task.evidenceStatus === 'VERIFIED' && (
                            <span className="inline-flex items-center gap-1 text-[8px] font-extrabold text-emerald-500 mt-1"><Award size={8} /> Đã cộng điểm dự án cá nhân (+{Math.round(task.impact * 0.3)} điểm)</span>
                          )}

                          {task.evidenceStatus === 'PENDING' && (
                            <div className="flex gap-1 pt-1.5">
                              <button
                                onClick={() => simulateEvidenceReview(task.id, 'VERIFIED')}
                                className="flex-1 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[8px] font-black rounded cursor-pointer text-center"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => simulateEvidenceReview(task.id, 'REJECTED')}
                                className="flex-1 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[8px] font-black rounded cursor-pointer text-center"
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                          <button
                            onClick={() => moveTask(task, 'DONE')}
                            className="inline-flex items-center gap-1 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            <PlusCircle size={10} /> Thêm minh chứng GitHub
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {columns.DONE.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-8">Chưa có kỹ năng nào hoàn thành</p>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {/* EVIDENCE SUBMISSION MODAL */}
      {evidenceModalTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 animate-scaleUp">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award size={18} className="text-emerald-500" /> Nộp minh chứng học tập
              </h3>
              <p className="text-xs text-slate-500 mt-1">Cung cấp minh chứng thực hành kỹ năng **{evidenceModalTask.title}** để tăng điểm dự án cá nhân.</p>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Kho lưu trữ GitHub (Bắt buộc)</label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/username/project"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Demo trực tiếp / Link YouTube (Không bắt buộc)</label>
                <input
                  type="url"
                  placeholder="https://my-demo-app.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Link ảnh chụp màn hình (Không bắt buộc)</label>
                <input
                  type="url"
                  placeholder="https://imgur.com/my-screenshot.png"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2 justify-end text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEvidenceModalTask(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCompleteWithoutEvidence}
                  className="px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5 cursor-pointer"
                >
                  Hoàn thành không cần minh chứng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-2"
                >
                  <Award size={14} /> Xác thực & Hoàn thành
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const READINESS_LEVELS = [
  { min: 0, max: 20, label: 'Khám phá', color: '#64748b' },
  { min: 21, max: 40, label: 'Nền tảng', color: '#f59e0b' },
  { min: 41, max: 60, label: 'Thực tập sinh Sơ cấp', color: '#3b82f6' },
  { min: 61, max: 80, label: 'Sẵn sàng Thực tập', color: '#10b981' },
  { min: 81, max: 100, label: 'Sẵn sàng Đi làm', color: '#8b5cf6' },
];

function getReadinessConfig(score) {
  return READINESS_LEVELS.find(l => score >= l.min && score <= l.max) || READINESS_LEVELS[0];
}
