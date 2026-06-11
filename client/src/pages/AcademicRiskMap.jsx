import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  GitBranch,
  Loader2,
  Network,
  Search,
  ShieldAlert,
  Sparkles,
  User,
  Info,
} from 'lucide-react';
import dagre from 'dagre';
import { api, requestWithRestartRetry } from '../lib/api';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import '@xyflow/react/dist/style.css';

const metricFormatter = (value, fallback = 'No data') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
};

const getNodeTone = (status, isDark) => {
  if (status === 'Failed') {
    return {
      shell: isDark 
        ? 'border-rose-500/70 bg-rose-950/80 shadow-[0_18px_50px_rgba(225,29,72,0.18)]' 
        : 'border-rose-300 bg-rose-50 shadow-[0_4px_20px_rgba(225,29,72,0.08)]',
      badge: isDark ? 'bg-rose-500/15 text-rose-200' : 'bg-rose-100 text-rose-800',
      icon: <ShieldAlert className={isDark ? 'text-rose-300' : 'text-rose-600'} size={16} />,
    };
  }

  if (status === 'Warning') {
    return {
      shell: isDark 
        ? 'border-amber-500/70 bg-amber-950/70 shadow-[0_18px_50px_rgba(245,158,11,0.16)]' 
        : 'border-amber-300 bg-amber-50 shadow-[0_4px_20px_rgba(245,158,11,0.08)]',
      badge: isDark ? 'bg-amber-500/15 text-amber-100' : 'bg-amber-100 text-amber-900',
      icon: <AlertTriangle className={isDark ? 'text-amber-300' : 'text-amber-600'} size={16} />,
    };
  }

  if (status === 'Passed') {
    return {
      shell: isDark 
        ? 'border-sky-500/70 bg-sky-950/70 shadow-[0_18px_50px_rgba(14,165,233,0.14)]' 
        : 'border-emerald-300 bg-emerald-50 shadow-[0_4px_20px_rgba(16,185,129,0.08)]',
      badge: isDark ? 'bg-sky-500/15 text-sky-100' : 'bg-emerald-100 text-emerald-900',
      icon: <CheckCircle2 className={isDark ? 'text-sky-300' : 'text-emerald-600'} size={16} />,
    };
  }

  if (status === 'Not Started' || status === 'Missing') {
    return {
      shell: isDark 
        ? 'border-slate-700/50 bg-slate-900/60 shadow-none opacity-80' 
        : 'border-slate-300 bg-slate-50 shadow-none opacity-90',
      badge: isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-800',
      icon: <BookOpen className="text-slate-500" size={16} />,
    };
  }

  return {
    shell: isDark 
      ? 'border-slate-600 bg-slate-900/90 shadow-[0_18px_50px_rgba(15,23,42,0.35)]' 
      : 'border-slate-300 bg-white shadow-[0_4px_25px_rgba(15,23,42,0.08)]',
    badge: isDark ? 'bg-slate-700/60 text-slate-200' : 'bg-slate-100 text-slate-800',
    icon: <BookOpen className={isDark ? 'text-slate-300' : 'text-slate-700'} size={16} />,
  };
};

const RiskNode = ({ data }) => {
  const { node, isSelected, isDark } = data;
  const tone = getNodeTone(node.status, isDark);

  return (
    <div
      className={`w-64 rounded-2xl border p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:z-50 ${tone.shell} ${
        isSelected ? 'ring-2 ring-blue-500 dark:ring-cyan-300/70 scale-[1.02] animate-pulse' : ''
      }`}
      onClick={() => data.onSelect(node.id)}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !bg-slate-300 border-2 border-white dark:border-slate-800" />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Học kỳ {node.semester ?? 'N/A'}
          </div>
          <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{node.code}</div>
          <div className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">{node.name}</div>
        </div>
        <div className="mt-0.5">{tone.icon}</div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-3 text-[11px]">
        <span className={`rounded-full px-2.5 py-1 font-bold ${tone.badge}`}>
          {node.status === 'Failed' ? 'Chưa đạt' : 
           node.status === 'Warning' ? 'Nguy cơ' : 
           node.status === 'Passed' ? 'Đã đạt' : 
           (node.status === 'Missing' || node.status === 'Not Started') ? 'Chưa học' : 'Bình thường'}
        </span>
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          Điểm: <span className="font-bold text-slate-900 dark:text-white">{node.score ?? 'N/A'}</span>
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-slate-300 border-2 border-white dark:border-slate-800" />
    </div>
  );
};

const AcademicRiskMap = () => {
  const { theme } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [graphError, setGraphError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentOverview, setStudentOverview] = useState(null);
  const [riskChains, setRiskChains] = useState([]);
  const [selectedChainId, setSelectedChainId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const reactFlowRef = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({ riskNode: RiskNode }), []);

  const selectedChain = useMemo(
    () => riskChains.find((chain) => chain.id === selectedChainId) || null,
    [riskChains, selectedChainId]
  );

  const selectedNode = useMemo(
    () => selectedChain?.nodes?.find((node) => node.id === selectedNodeId) || null,
    [selectedChain, selectedNodeId]
  );

  const selectedMssv = searchParams.get('mssv') || '';

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await requestWithRestartRetry(() =>
          api.get(`/students-search?q=${encodeURIComponent(searchQuery)}`)
        );
        setSearchResults(response.data.slice(0, 8));
      } catch (error) {
        console.error('[AcademicRiskMap] Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedMssv) {
      return;
    }

    if (selectedStudent?.id === selectedMssv && studentOverview?.mssv === selectedMssv) {
      return;
    }

    loadStudentRisk({
      id: selectedMssv,
      name: selectedStudent?.id === selectedMssv ? selectedStudent.name : `Sinh viên ${selectedMssv}`,
      classCode: selectedStudent?.id === selectedMssv ? selectedStudent.classCode : null,
    });
  }, [selectedMssv]);

  useEffect(() => {
    if (!selectedChain) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      return;
    }

    const rawNodes = selectedChain.nodes.map((node) => ({
      id: node.id,
      type: 'riskNode',
      position: { x: 0, y: 0 },
      data: {
        node,
        isSelected: node.id === selectedNodeId,
        onSelect: setSelectedNodeId,
        isDark: theme === 'dark',
      },
      draggable: false,
      selectable: false,
    }));

    const flowEdges = selectedChain.edges.map((edge, index) => {
      const isDark = theme === 'dark';
      const color = edge.type === 'critical' 
        ? (isDark ? '#fb7185' : '#e11d48') 
        : (isDark ? '#f59e0b' : '#d97706');
      return {
        id: `edge-${edge.from}-${edge.to}-${index}`,
        source: edge.from,
        target: edge.to,
        type: 'smoothstep',
        animated: true,
        selectable: false,
        style: {
          stroke: color,
          strokeWidth: edge.type === 'critical' ? 3 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
        },
      };
    });

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', align: 'UL', ranker: 'longest-path' });

    rawNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 320, height: 180 });
    });

    flowEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const orderedFlowNodes = rawNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        targetPosition: 'left',
        sourcePosition: 'right',
        position: {
          x: nodeWithPosition.x - 320 / 2,
          y: nodeWithPosition.y - 180 / 2,
        },
      };
    });

    setNodes(orderedFlowNodes);
    setEdges(flowEdges);
    
    // Auto-select the first node if nothing is selected or if selected node is not in current chain
    // Exception: For full graph, we might not want to select anything initially, but it's fine.
    setSelectedNodeId((current) =>
      selectedChain.nodes.some((node) => node.id === current)
        ? current
        : selectedChain.nodes[0]?.id || null
    );

    // Automatically fit view when the layout updates
    setTimeout(() => {
      if (reactFlowRef.current) {
        reactFlowRef.current.fitView({ padding: 0.2, duration: 800 });
      }
    }, 50);
  }, [selectedChain, selectedNodeId, setEdges, setNodes]);

  useEffect(() => {
    if (!selectedChain || !reactFlowRef.current || nodes.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      reactFlowRef.current?.fitView({
        padding: 0.2,
        duration: 800,
        minZoom: 0.1,
        maxZoom: 1.2,
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedChain, nodes.length]);

  const loadStudentRisk = async (student) => {
    setSelectedStudent(student);
    setStudentOverview(null);
    setRiskChains([]);
    setSelectedChainId(null);
    setSelectedNodeId(null);
    setGraphError(null);
    setIsLoadingStudent(true);

    try {
      const response = await requestWithRestartRetry(() =>
        api.get(`/v1/graph/student-risk/${student.id}`)
      );

      setStudentOverview(response.data.student || null);
      
      const chains = response.data.riskChains || [];
      if (response.data.fullGraph) {
        chains.unshift(response.data.fullGraph);
      }
      setRiskChains(chains);
      
      // Căn chỉnh khung nhìn tự động sau 100ms khi load đồ thị mới
      setTimeout(() => {
        if (reactFlowRef.current) {
          reactFlowRef.current.fitView({ padding: 0.2, duration: 800 });
        }
      }, 100);
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.details ||
        error.message ||
        'Unable to load academic dependency data.';
      console.error('[AcademicRiskMap] Graph load error:', message, error);
      setGraphError(message);
    } finally {
      setIsLoadingStudent(false);
    }
  };

  const handleStudentSelect = (student) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('mssv', student.id);
    setSearchParams(nextParams, { replace: false });
    setSelectedStudent(student);
  };

  const renderMetricCard = (label, value, accent) => (
    <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${accent}`}>{metricFormatter(value)}</div>
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-semibold text-slate-900 dark:text-white">
            <Network size={20} className="text-indigo-400" /> Bản đồ rủi ro học tập
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            Hệ thống hỗ trợ ra quyết định học vụ. Chọn một sinh viên, xem tổng quan các rủi ro hiện tại và đi sâu vào từng chuỗi môn học.
          </p>
        </div>
      </div>

      {/* TOP ROW: Search & Overview */}
      <section className="bg-[#F8FAFC] dark:bg-slate-950/70 flex flex-col lg:flex-row gap-6 rounded-[28px] border border-slate-200 dark:border-white/6 p-5 shadow-sm animate-slide-up" style={{animationDelay: '0.1s'}}>
        {/* Search */}
        <div className="w-full lg:w-80 shrink-0 relative">
          <div className="mb-3 flex items-center gap-3">
            <User className="text-[#1D4ED8] dark:text-cyan-300" size={18} />
            <h2 className="text-lg font-extrabold text-[#0F172A] dark:text-white">Tìm kiếm sinh viên</h2>
          </div>
          <div className="relative z-50">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo MSSV hoặc tên sinh viên"
              className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-[#0F172A] dark:text-white outline-none transition focus:border-[#1D4ED8]"
            />
            {/* Absolute Dropdown */}
            {searchQuery.trim() && (
              <div className="absolute left-0 top-[calc(100%+8px)] w-full max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/95 p-2 shadow-2xl z-[9999] backdrop-blur-xl">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6 text-slate-600 dark:text-slate-400">
                    <Loader2 className="animate-spin text-[#1D4ED8]" size={18} />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-sm text-slate-600 font-bold">Không tìm thấy sinh viên nào.</div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => {
                          handleStudentSelect(student);
                          setSearchQuery(''); // auto close dropdown
                        }}
                        className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer ${
                          selectedStudent?.id === student.id
                            ? 'border-[#1D4ED8] bg-blue-50 text-blue-900 dark:border-cyan-400/60 dark:bg-cyan-500/10 dark:text-white'
                            : 'border-slate-100 dark:border-transparent bg-white hover:bg-blue-50 hover:border-blue-200 dark:bg-transparent dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{student.id}</div>
                        <div className="text-xs text-slate-700 dark:text-slate-400 font-semibold mt-0.5">{student.name || 'Không rõ tên'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block w-px bg-slate-200 dark:bg-white/10"></div>

        {/* Overview */}
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <Sparkles className="text-[#1D4ED8] dark:text-cyan-300" size={18} />
            <h3 className="text-sm font-black uppercase tracking-[0.24em] text-slate-800 dark:text-slate-300">
              Tổng quan sinh viên
            </h3>
          </div>
          {!studentOverview ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 p-4 text-sm text-slate-500 font-semibold">
              Chọn một sinh viên để xem tổng quan học tập thực tế.
            </div>
          ) : (
            <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-4">
              <div className="flex-shrink-0 w-64 rounded-[20px] border border-blue-200 dark:border-cyan-400/20 bg-gradient-to-br from-blue-600 to-indigo-700 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),rgba(15,23,42,0.4)_46%,rgba(2,6,23,0.95)_100%)] p-4 shadow-md">
                <div className="text-[10px] uppercase tracking-[0.24em] text-blue-100 dark:text-cyan-100/70 font-bold">
                  {studentOverview.classCode || 'Không rõ lớp'}
                </div>
                <div className="mt-1 text-lg font-black text-white truncate" title={studentOverview.name}>
                  {studentOverview.name}
                </div>
                <div className="text-xs text-blue-100 dark:text-cyan-100/80 font-semibold">{studentOverview.mssv}</div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 flex-1">
                {renderMetricCard('Điểm TB', studentOverview.gpa, 'text-[#0F172A] dark:text-white font-extrabold')}
                {renderMetricCard('Chuyên cần', studentOverview.attendance, 'text-[#0F172A] dark:text-white font-extrabold')}
                {renderMetricCard('Nợ môn', studentOverview.totalFailedSubjects, 'text-[#DC2626] dark:text-rose-300 font-black')}
                {renderMetricCard('Điểm rủi ro', studentOverview.riskScore, 'text-[#D97706] dark:text-amber-200 font-black')}
                {renderMetricCard('Mức độ', studentOverview.riskLevel, 'text-[#1D4ED8] dark:text-cyan-200 font-black')}
                {renderMetricCard('AI Confidence', `${studentOverview.confidenceScore || 85}%`, 'text-indigo-600 dark:text-indigo-400 font-black')}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MIDDLE ROW: Risk Chains & AI Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* LEFT COLUMN: Risk Chain Selector */}
        <section className="bg-white dark:bg-[#1F2937] flex flex-col gap-6 rounded-[28px] border border-slate-200 dark:border-slate-700 p-5 overflow-y-auto max-h-[400px] shadow-sm dark:shadow-lg animate-slide-up" style={{animationDelay: '0.2s'}}>
          
          {/* Risk Chain Selector */}
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300 mb-3">
              Chuỗi rủi ro học tập
            </div>
            <div className="space-y-3">
              {isLoadingStudent ? (
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Loader2 className="animate-spin text-blue-600 dark:text-cyan-300" size={16} /> Loading data...
                </div>
              ) : riskChains.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 text-sm text-slate-500 dark:text-slate-400 font-bold">
                  Không có dữ liệu chuỗi rủi ro học thuật.
                </div>
              ) : (
                riskChains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => {
                      setSelectedChainId(chain.id);
                      setSelectedNodeId(null);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      selectedChainId === chain.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/80 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`text-xs font-black leading-tight ${selectedChainId === chain.id ? 'text-rose-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>{chain.title}</div>
                      <div className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm ${
                        chain.riskLevel === 'HIGH' ? 'bg-[#DC2626]' : chain.riskLevel === 'MEDIUM' ? 'bg-[#D97706]' : 'bg-[#059669]'
                      }`}>
                        {chain.riskLevel === 'HIGH' ? 'Rủi ro cao' : chain.riskLevel === 'MEDIUM' ? 'Rủi ro trung bình' : 'Thông tin'}
                      </div>
                    </div>
                    <div className={`mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.1em] font-bold ${selectedChainId === chain.id ? 'text-rose-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>
                      <span>Môn bị ảnh hưởng: <span className="text-amber-600 dark:text-amber-400 font-black text-xs">{chain.affectedCount}</span></span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: AI Narrative */}
        <section className="glass-panel flex flex-col gap-6 rounded-[28px] border border-slate-200 dark:border-white/6 bg-white dark:bg-slate-950/70 p-5 overflow-y-auto max-h-[400px] shadow-sm dark:shadow-lg animate-slide-up" style={{animationDelay: '0.3s'}}>
          {/* AI Narrative */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit className="text-indigo-600 dark:text-cyan-300" size={16} />
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">Hệ thống phân tích</h2>
            </div>
            {!selectedChain ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/60 p-4 text-xs text-slate-500 font-medium">
                Chọn một chuỗi rủi ro để xem phân tích chi tiết.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-[16px] border border-blue-400/20 bg-blue-50/50 dark:border-cyan-400/20 dark:bg-[linear-gradient(180deg,rgba(6,182,212,0.12),rgba(15,23,42,0.08))] p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-blue-800 dark:text-cyan-100/70 font-bold">Chuỗi rủi ro đã chọn</div>
                  <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white leading-tight">{selectedChain.title}</div>
                  <div className="mt-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {selectedChain.blockedPath === 'Toàn bộ chương trình' ? 'Toàn bộ chương trình' : selectedChain.blockedPath}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Nguyên nhân</div>
                    <p className="mt-1 text-xs leading-5 text-slate-800 dark:text-slate-200 font-medium">{selectedChain.explanation?.why}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Ảnh hưởng</div>
                    <p className="mt-1 text-xs leading-5 text-slate-800 dark:text-slate-200 font-medium">{selectedChain.explanation?.impact}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Lộ trình khắc phục</div>
                    <p className="mt-1 text-xs leading-5 text-slate-800 dark:text-slate-200 font-medium">{selectedChain.explanation?.recovery}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-slate-900/80 p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Đề xuất can thiệp</div>
                  <div className="mt-2 space-y-1.5">
                    {(selectedChain.explanation?.interventions || []).map((intervention) => (
                      <div key={intervention} className="rounded-lg border border-slate-200 dark:border-white/6 bg-white dark:bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold shadow-sm">
                        {intervention}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* BOTTOM ROW: Graph (Full Width) */}
      <section className="relative min-h-[600px] w-full overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] shadow-lg animate-slide-up" style={{animationDelay: '0.4s'}}>
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1F2937]/90 px-6 py-4 backdrop-blur-md">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-600 dark:text-slate-300 font-extrabold">Sơ đồ tập trung</div>
              <div className="mt-1 text-base font-black text-slate-900 dark:text-white">
                {selectedChain ? selectedChain.title : 'Chọn một chuỗi rủi ro để phân tích'}
              </div>
            </div>
            {selectedChain && (
              <div className="flex items-center gap-2 rounded-full border border-blue-400 bg-blue-600 px-3.5 py-1.5 text-xs text-white font-black shadow-sm">
                <BrainCircuit size={18} /> {selectedChain.blockedPath}
              </div>
            )}
          </div>

          <div className="h-full pt-[78px]">
            {graphError ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <AlertTriangle className="text-rose-500 dark:text-rose-400" size={52} />
                <div className="mt-5 text-lg font-bold text-slate-900 dark:text-rose-200">Unable to load graph data</div>
                <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400 font-medium">{graphError}</p>
              </div>
            ) : isLoadingStudent ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-600 dark:text-slate-400 animate-in fade-in duration-500">
                <Loader2 className="animate-spin text-blue-600 dark:text-cyan-300" size={52} />
                <div className="mt-5 text-lg font-bold text-slate-900 dark:text-white">Đang tải dữ liệu rủi ro</div>
                <p className="mt-2 text-sm text-slate-500 font-medium">Hệ thống đang truy xuất chuỗi môn học tiên quyết thực tế.</p>
              </div>
            ) : !selectedStudent ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center animate-in zoom-in fade-in duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                  <BrainCircuit className="text-blue-600 dark:text-cyan-400/70 relative z-10" size={64} />
                </div>
                <div className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Vui lòng chọn một sinh viên</div>
                <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Sơ đồ sẽ trống cho đến khi chọn một sinh viên. Điều này giúp tập trung phân tích và tránh quá tải thông tin.
                </p>
              </div>
            ) : riskChains.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <CheckCircle2 className="text-emerald-600 dark:text-sky-300/80" size={56} />
                <div className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Không có dữ liệu chuỗi rủi ro học thuật</div>
                <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Sinh viên này hiện không có chuỗi môn học nào gặp rủi ro cần phân tích.
                </p>
              </div>
            ) : !selectedChain ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center animate-in zoom-in fade-in duration-500">
                <Network className="text-blue-600 dark:text-cyan-400/70 mb-4 animate-pulse" size={64} />
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Chọn một chuỗi rủi ro để phân tích</div>
                <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Xem danh sách các chuỗi rủi ro ở bên trái, sau đó mở một chuỗi. Sơ đồ sẽ chỉ hiển thị chuỗi đó và tự động canh chỉnh.
                </p>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onInit={(instance) => {
                  reactFlowRef.current = instance;
                }}
                fitView
                minZoom={0.1}
                maxZoom={1.35}
                className="bg-transparent"
                proOptions={{ hideAttribution: true }}
              >
                <Background color={theme === 'dark' ? '#23324d' : '#cbd5e1'} gap={28} />
                <Panel position="bottom-right" className="bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-300 dark:border-slate-700/60 shadow-xl text-xs text-slate-800 dark:text-slate-300 z-50">
                  <div className="font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider text-[10px]">Chú thích (Legend)</div>
                  <div className="space-y-2 font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500"></div> Chưa đạt / Thiếu môn</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500"></div> Đang học / Nguy cơ</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div> Đã qua môn</div>
                    <div className="flex items-center gap-2"><div className="w-4 border-t-2 border-rose-400 border-dashed"></div> Rủi ro lây lan (Dây chuyền)</div>
                    <div className="flex items-center gap-2"><div className="w-4 border-t-2 border-amber-400"></div> Rủi ro phụ thuộc (Sẽ học)</div>
                  </div>
                </Panel>
                <MiniMap
                  pannable
                  zoomable
                  className="!border !border-slate-300 dark:!border-white/10 !bg-white dark:!bg-slate-950/80 shadow-md"
                  nodeStrokeWidth={3}
                  nodeColor={(node) => {
                    if (node.data?.node?.status === 'Failed') return '#fb7185';
                    if (node.data?.node?.status === 'Warning') return '#f59e0b';
                    if (node.data?.node?.status === 'Passed') return '#10b981';
                    return '#64748b';
                  }}
                />
                <Controls className="!border !border-slate-300 dark:!border-white/10 !bg-white dark:!bg-slate-950/80 !text-slate-800 dark:!text-white" />
              </ReactFlow>
            )}
          </div>
        </section>
    </div>
  );
};

export default AcademicRiskMap;
