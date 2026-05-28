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
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { useSearchParams } from 'react-router-dom';
import '@xyflow/react/dist/style.css';

const metricFormatter = (value, fallback = 'No data') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
};

const getNodeTone = (status) => {
  if (status === 'Failed') {
    return {
      shell: 'border-rose-500/70 bg-rose-950/80 shadow-[0_18px_50px_rgba(225,29,72,0.18)]',
      badge: 'bg-rose-500/15 text-rose-200',
      icon: <ShieldAlert className="text-rose-300" size={16} />,
    };
  }

  if (status === 'Warning') {
    return {
      shell: 'border-amber-500/70 bg-amber-950/70 shadow-[0_18px_50px_rgba(245,158,11,0.16)]',
      badge: 'bg-amber-500/15 text-amber-100',
      icon: <AlertTriangle className="text-amber-300" size={16} />,
    };
  }

  if (status === 'Passed') {
    return {
      shell: 'border-sky-500/70 bg-sky-950/70 shadow-[0_18px_50px_rgba(14,165,233,0.14)]',
      badge: 'bg-sky-500/15 text-sky-100',
      icon: <CheckCircle2 className="text-sky-300" size={16} />,
    };
  }

  if (status === 'Not Started' || status === 'Missing') {
    return {
      shell: 'border-slate-700/50 bg-slate-900/60 shadow-none opacity-80',
      badge: 'bg-slate-800 text-slate-400',
      icon: <BookOpen className="text-slate-500" size={16} />,
    };
  }

  return {
    shell: 'border-slate-600 bg-slate-900/90 shadow-[0_18px_50px_rgba(15,23,42,0.35)]',
    badge: 'bg-slate-700/60 text-slate-200',
    icon: <BookOpen className="text-slate-300" size={16} />,
  };
};

const RiskNode = ({ data }) => {
  const { node, isSelected } = data;
  const tone = getNodeTone(node.status);

  return (
    <div
      className={`w-64 rounded-2xl border p-4 backdrop-blur-sm transition-all ${tone.shell} ${
        isSelected ? 'ring-2 ring-cyan-300/70' : ''
      }`}
      onClick={() => data.onSelect(node.id)}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !bg-slate-300" />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Học kỳ {node.semester ?? 'N/A'}
          </div>
          <div className="mt-1 text-sm font-semibold text-white">{node.code}</div>
          <div className="mt-1 text-xs leading-relaxed text-slate-300">{node.name}</div>
        </div>
        <div className="mt-0.5">{tone.icon}</div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
        <span className={`rounded-full px-2.5 py-1 font-medium ${tone.badge}`}>
          {node.status === 'Failed' ? 'Chưa đạt' : 
           node.status === 'Warning' ? 'Nguy cơ' : 
           node.status === 'Passed' ? 'Đã đạt' : 
           (node.status === 'Missing' || node.status === 'Not Started') ? 'Chưa học' : 'Bình thường'}
        </span>
        <span className="text-slate-400">
          Điểm: <span className="font-semibold text-white">{node.score ?? 'N/A'}</span>
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !bg-slate-300" />
    </div>
  );
};

const AcademicRiskMap = () => {
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
      },
      draggable: false,
      selectable: false,
    }));

    const flowEdges = selectedChain.edges.map((edge, index) => {
      const color = edge.type === 'critical' ? '#fb7185' : '#f59e0b';
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
    <div className="rounded-2xl border border-white/8 bg-slate-900/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${accent}`}>{metricFormatter(value)}</div>
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-semibold text-white">
            <Network size={20} className="text-indigo-400" /> Bản đồ rủi ro học tập
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Hệ thống hỗ trợ ra quyết định học vụ. Chọn một sinh viên, xem tổng quan các rủi ro hiện tại và đi sâu vào từng chuỗi môn học.
          </p>
        </div>
      </div>

      {/* TOP ROW: Search & Overview */}
      <section className="glass-panel flex flex-col lg:flex-row gap-6 rounded-[28px] border border-white/6 bg-slate-950/70 p-5">
        {/* Search */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="mb-3 flex items-center gap-3">
            <User className="text-cyan-300" size={18} />
            <h2 className="text-lg font-semibold text-white">Tìm kiếm sinh viên</h2>
          </div>
          <div className="relative z-50">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo MSSV hoặc tên sinh viên"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cyan-400"
            />
            {/* Absolute Dropdown */}
            {searchQuery.trim() && (
              <div className="absolute left-0 top-[calc(100%+8px)] w-full max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-xl backdrop-blur-xl">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6 text-slate-400">
                    <Loader2 className="animate-spin" size={18} />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-sm text-slate-500">Không tìm thấy sinh viên nào.</div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => {
                          handleStudentSelect(student);
                          setSearchQuery(''); // auto close dropdown
                        }}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          selectedStudent?.id === student.id
                            ? 'border-cyan-400/60 bg-cyan-500/10'
                            : 'border-transparent hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white">{student.id}</div>
                        <div className="text-xs text-slate-400">{student.name || 'Không rõ tên'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block w-px bg-white/10"></div>

        {/* Overview */}
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <Sparkles className="text-cyan-300" size={18} />
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
              Tổng quan sinh viên
            </h3>
          </div>
          {!studentOverview ? (
            <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/60 p-4 text-sm text-slate-500">
              Chọn một sinh viên để xem tổng quan học tập thực tế.
            </div>
          ) : (
            <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-4">
              <div className="flex-shrink-0 w-64 rounded-[20px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),rgba(15,23,42,0.4)_46%,rgba(2,6,23,0.95)_100%)] p-4">
                <div className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/70">
                  {studentOverview.classCode || 'Không rõ lớp'}
                </div>
                <div className="mt-1 text-lg font-semibold text-white truncate" title={studentOverview.name}>
                  {studentOverview.name}
                </div>
                <div className="text-xs text-cyan-100/80">{studentOverview.mssv}</div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 flex-1">
                {renderMetricCard('Điểm TB', studentOverview.gpa, 'text-white')}
                {renderMetricCard('Chuyên cần', studentOverview.attendance, 'text-white')}
                {renderMetricCard('Nợ môn', studentOverview.totalFailedSubjects, 'text-rose-300')}
                {renderMetricCard('Học kỳ', studentOverview.currentSemester, 'text-white')}
                {renderMetricCard('Điểm rủi ro', studentOverview.riskScore, 'text-amber-200')}
                {renderMetricCard('Mức độ', studentOverview.riskLevel, 'text-cyan-200')}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MIDDLE ROW: Risk Chains & AI Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* LEFT COLUMN: Risk Chain Selector */}
        <section className="glass-panel flex flex-col gap-6 rounded-[28px] border border-white/6 bg-slate-950/70 p-5 overflow-y-auto max-h-[400px]">
          
          {/* Risk Chain Selector */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 mb-3">
              Chuỗi rủi ro học tập
            </div>
            <div className="space-y-3">
              {isLoadingStudent ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="animate-spin" size={16} /> Loading data...
                </div>
              ) : riskChains.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/80 p-4 text-sm text-slate-500">
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
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedChainId === chain.id
                        ? 'border-rose-400/60 bg-rose-500/10'
                        : 'border-white/6 bg-slate-950/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-white leading-tight">{chain.title}</div>
                      <div className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        chain.riskLevel === 'HIGH' ? 'bg-rose-500/15 text-rose-200' : chain.riskLevel === 'MEDIUM' ? 'bg-amber-500/15 text-amber-100' : 'bg-cyan-500/15 text-cyan-200'
                      }`}>
                        {chain.riskLevel === 'HIGH' ? 'Rủi ro cao' : chain.riskLevel === 'MEDIUM' ? 'Rủi ro trung bình' : 'Thông tin'}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.1em] text-slate-500">
                      <span>Môn bị ảnh hưởng: {chain.affectedCount}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: AI Narrative */}
        <section className="glass-panel flex flex-col gap-6 rounded-[28px] border border-white/6 bg-slate-950/70 p-5 overflow-y-auto max-h-[400px]">
          {/* AI Narrative */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <BrainCircuit className="text-cyan-300" size={16} />
              <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Hệ thống phân tích</h2>
            </div>
            {!selectedChain ? (
              <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/60 p-4 text-xs text-slate-500">
                Chọn một chuỗi rủi ro để xem phân tích chi tiết.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-[16px] border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(6,182,212,0.12),rgba(15,23,42,0.08))] p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/70">Chuỗi rủi ro đã chọn</div>
                  <div className="mt-1 text-sm font-semibold text-white leading-tight">{selectedChain.title}</div>
                  <div className="mt-1 text-xs text-slate-300">
                    {selectedChain.blockedPath === 'Toàn bộ chương trình' ? 'Toàn bộ chương trình' : selectedChain.blockedPath}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="rounded-xl border border-white/8 bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Nguyên nhân</div>
                    <p className="mt-1 text-xs leading-5 text-slate-200">{selectedChain.explanation?.why}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Ảnh hưởng</div>
                    <p className="mt-1 text-xs leading-5 text-slate-200">{selectedChain.explanation?.impact}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Lộ trình khắc phục</div>
                    <p className="mt-1 text-xs leading-5 text-slate-200">{selectedChain.explanation?.recovery}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/8 bg-slate-900/80 p-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Đề xuất can thiệp</div>
                  <div className="mt-2 space-y-1.5">
                    {(selectedChain.explanation?.interventions || []).map((intervention) => (
                      <div key={intervention} className="rounded-lg border border-white/6 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-200">
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
      <section className="glass-panel relative min-h-[600px] w-full overflow-hidden rounded-[32px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.78),rgba(2,6,23,0.98)_60%)]">
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/6 bg-slate-950/75 px-6 py-4 backdrop-blur-md">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Sơ đồ tập trung</div>
              <div className="mt-1 text-base font-semibold text-white">
                {selectedChain ? selectedChain.title : 'Chọn một chuỗi rủi ro để phân tích'}
              </div>
            </div>
            {selectedChain && (
              <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100">
                <BrainCircuit size={18} /> {selectedChain.blockedPath}
              </div>
            )}
          </div>

          <div className="h-full pt-[78px]">
            {graphError ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <AlertTriangle className="text-rose-400" size={52} />
                <div className="mt-5 text-lg font-semibold text-rose-200">Unable to load graph data</div>
                <p className="mt-2 max-w-md text-sm text-slate-400">{graphError}</p>
              </div>
            ) : isLoadingStudent ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <Loader2 className="animate-spin text-cyan-300" size={52} />
                <div className="mt-5 text-lg font-semibold text-white">Đang tải dữ liệu rủi ro</div>
                <p className="mt-2 text-sm text-slate-500">Hệ thống đang truy xuất chuỗi môn học tiên quyết thực tế.</p>
              </div>
            ) : !selectedStudent ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <BrainCircuit className="text-cyan-400/70" size={58} />
                <div className="mt-5 text-xl font-semibold text-white">Vui lòng chọn một sinh viên</div>
                <p className="mt-3 max-w-md text-sm text-slate-400">
                  Sơ đồ sẽ trống cho đến khi chọn một sinh viên. Điều này giúp tập trung phân tích và tránh quá tải thông tin.
                </p>
              </div>
            ) : riskChains.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <CheckCircle2 className="text-sky-300/80" size={56} />
                <div className="mt-5 text-xl font-semibold text-white">Không có dữ liệu chuỗi rủi ro học thuật</div>
                <p className="mt-3 max-w-md text-sm text-slate-400">
                  Sinh viên này hiện không có chuỗi môn học nào gặp rủi ro cần phân tích.
                </p>
              </div>
            ) : !selectedChain ? (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <Network className="text-cyan-400/70" size={58} />
                <div className="mt-5 text-xl font-semibold text-white">Chọn một chuỗi rủi ro để phân tích</div>
                <p className="mt-3 max-w-md text-sm text-slate-400">
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
                <Background color="#23324d" gap={28} />
                <Panel position="bottom-right" className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/60 shadow-xl text-xs text-slate-300">
                  <div className="font-semibold text-white mb-2 uppercase tracking-wider text-[10px]">Chú thích (Legend)</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500"></div> Chưa đạt / Thiếu môn</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500"></div> Đang học / Nguy cơ</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500/20 border border-sky-500"></div> Đã qua môn</div>
                    <div className="flex items-center gap-2"><div className="w-4 border-t-2 border-rose-400 border-dashed"></div> Rủi ro lây lan (Dây chuyền)</div>
                    <div className="flex items-center gap-2"><div className="w-4 border-t-2 border-amber-400"></div> Rủi ro phụ thuộc (Sẽ học)</div>
                  </div>
                </Panel>
                <MiniMap
                  pannable
                  zoomable
                  className="!border !border-white/10 !bg-slate-950/80"
                  nodeStrokeWidth={3}
                  nodeColor={(node) => {
                    if (node.data?.node?.status === 'Failed') return '#fb7185';
                    if (node.data?.node?.status === 'Warning') return '#f59e0b';
                    if (node.data?.node?.status === 'Passed') return '#38bdf8';
                    return '#64748b';
                  }}
                />
                <Controls className="!border !border-white/10 !bg-slate-950/80 !text-white" />
              </ReactFlow>
            )}
          </div>
        </section>
    </div>
  );
};

export default AcademicRiskMap;
