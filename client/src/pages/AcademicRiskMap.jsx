import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Network, AlertTriangle, ArrowRight, ShieldAlert, ShieldCheck, CheckCircle2, User, Loader2, Info } from 'lucide-react';
import { api } from '../lib/api';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node for Course
const CourseNode = ({ data }) => {
  const { node } = data;
  let bgClass = "bg-slate-800 border-slate-600";
  let icon = <CheckCircle2 className="text-green-400" size={18} />;
  
  if (node.status === 'Failed' || node.status === 'Missing') {
     bgClass = "bg-red-950/80 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]";
     icon = <ShieldAlert className="text-red-400" size={18} />;
  } else if (node.status === 'Warning') {
     bgClass = "bg-orange-950/80 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]";
     icon = <AlertTriangle className="text-orange-400" size={18} />;
  } else if (node.status === 'Predicted Risk' || node.status === 'At Risk') {
     bgClass = "bg-rose-950/60 border-rose-500 border-dashed border-2 shadow-[0_0_10px_rgba(244,63,94,0.3)]";
     icon = <ShieldAlert className="text-rose-400" size={18} />;
  }

  return (
    <div 
      className={`rounded-xl p-3 border-2 transition-all w-56 ${bgClass} cursor-pointer hover:brightness-110`}
      onClick={() => data.onSelect(node.id)}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-slate-400" />
      <div className="flex items-start justify-between">
         <div>
            <div className="text-[10px] font-bold text-slate-400 mb-1">HK{node.semester || '?'} • {node.id}</div>
            <div className="font-semibold text-white text-xs leading-tight mb-2">{node.name}</div>
         </div>
         <div className="ml-2 flex-shrink-0">{icon}</div>
      </div>
      <div className="flex items-center justify-between text-[10px] mt-1 pt-2 border-t border-white/10">
         <span className="text-slate-400">Status: <span className="font-medium text-slate-200">{node.status}</span></span>
         <span className="text-slate-400">Score: <span className="font-medium text-white text-xs">{node.score !== null ? node.score : 'N/A'}</span></span>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-slate-400" />
    </div>
  );
};

const AcademicRiskMap = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [explanations, setExplanations] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // React Flow node types must be memoized
  const nodeTypes = useMemo(() => ({ course: CourseNode }), []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/students-search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleNodeClick = useCallback((nodeId) => {
    setSelectedNodeId(nodeId);
  }, []);

  const loadStudentRisk = async (mssv) => {
    setIsLoadingRisk(true);
    setNodes([]);
    setEdges([]);
    setExplanations([]);
    setSelectedNodeId(null);

    try {
      const res = await api.get(`/graph/student-risk/${mssv}`);
      const data = res.data;
      setExplanations(data.explanations || []);

      // Group nodes by semester to calculate positions
      const nodesBySem = {};
      data.nodes.forEach(n => {
        const s = n.semester || 0;
        if (!nodesBySem[s]) nodesBySem[s] = [];
        nodesBySem[s].push(n);
      });

      const flowNodes = [];
      Object.keys(nodesBySem).forEach(semStr => {
        const sem = parseInt(semStr);
        const semNodes = nodesBySem[sem];
        semNodes.forEach((n, idx) => {
          flowNodes.push({
            id: n.id,
            type: 'course',
            position: { x: (sem > 0 ? sem - 1 : 0) * 300, y: idx * 120 },
            data: { node: n, onSelect: handleNodeClick }
          });
        });
      });

      const flowEdges = data.edges.map((e, idx) => {
        let color = '#94a3b8'; // normal gray
        if (e.type === 'critical') color = '#ef4444'; // red
        else if (e.type === 'warning') color = '#f97316'; // orange

        return {
          id: \`e-\${e.from}-\${e.to}-\${idx}\`,
          source: e.from,
          target: e.to,
          type: 'smoothstep',
          animated: e.type === 'critical' || e.type === 'warning',
          style: { stroke: color, strokeWidth: e.type === 'critical' ? 3 : 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: color,
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      console.error(err);
      alert('Không thể phân tích chuỗi rủi ro cho sinh viên này.');
    } finally {
      setIsLoadingRisk(false);
    }
  };

  const demoStudents = [
    { id: 'PC07988', name: 'Nguyễn Văn A' },
    { id: 'PS27463', name: 'Lê Thị B' },
    { id: 'PS28758', name: 'Trần Văn C' }
  ];

  // Filter explanations for the selected node
  const activeExplanations = selectedNodeId 
    ? explanations.filter(e => e.course === selectedNodeId)
    : explanations;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Network className="text-blue-500" size={32} />
            Academic Risk Map
          </h1>
          <p className="text-slate-400 mt-2">Guided Academic Risk Flow Graph</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* LEFT COLUMN: Student Selection */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-5 border border-white/5 flex flex-col h-full">
          <h2 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
            <User size={18} className="text-blue-400" /> Chọn Sinh Viên
          </h2>
          
          <input
            type="text"
            placeholder="Tìm MSSV (vd: PC07988)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none mb-4"
          />

          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {(searchQuery ? searchResults : demoStudents).map(st => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedStudent(st);
                  loadStudentRisk(st.id);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedStudent?.id === st.id 
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <div className="font-semibold text-slate-200">{st.id}</div>
                {st.name && <div className="text-xs text-slate-400 mt-1">{st.name}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: React Flow Timeline */}
        <div className="lg:col-span-6 glass-panel rounded-2xl border border-white/5 relative overflow-hidden flex flex-col bg-[#0f172a]">
          {isLoadingRisk ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Loader2 size={48} className="mb-4 animate-spin text-blue-500" />
              <p>Đang tải Academic Dependency Map...</p>
            </div>
          ) : !selectedStudent ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Network size={48} className="mb-4 opacity-50" />
              <p>Chọn sinh viên để xem luồng học tập</p>
            </div>
          ) : nodes.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <ShieldCheck size={48} className="mb-4 text-green-500 opacity-50" />
              <p>Không có chuỗi rủi ro nào được phát hiện.</p>
            </div>
          ) : (
            <div className="w-full h-full relative">
              <div className="absolute top-4 left-4 z-10 flex gap-4 text-xs font-semibold text-slate-400">
                 <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> High Risk</div>
                 <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Dependency</div>
                 <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-500"></span> Normal</div>
              </div>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.5}
                maxZoom={1.5}
                className="bg-slate-900"
              >
                <Background color="#334155" gap={20} />
                <Controls className="!bg-slate-800 !border-slate-700 !fill-white" />
              </ReactFlow>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Explanation & Actions */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 border border-blue-500/20 bg-blue-900/10 shadow-[0_0_30px_rgba(59,130,246,0.05)] flex-1 overflow-y-auto">
            <h2 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
              <Info size={18} className="text-blue-400" /> Risk Narrative
            </h2>
            
            {!selectedStudent || !nodes.length ? (
              <p className="text-sm text-slate-400">Chờ dữ liệu phân tích...</p>
            ) : (
              <div className="space-y-4">
                {selectedNodeId && (
                   <div className="text-xs text-blue-400 mb-2 font-medium">Đang xem: {selectedNodeId}</div>
                )}
                {activeExplanations.length > 0 ? (
                  activeExplanations.map((exp, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={14} className="text-rose-400" />
                        <span className="text-sm font-bold text-slate-200">{exp.course}</span>
                      </div>
                      <p className="text-xs text-rose-300 font-medium mb-1">Căn nguyên: {exp.impact}</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{exp.explanation}</p>
                    </div>
                  ))
                ) : (
                   <div className="text-sm text-slate-400">Bấm vào một môn học bị cảnh báo để xem AI Explanation.</div>
                )}
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-white/5">
             <h2 className="font-semibold text-lg text-white mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-orange-400" /> Suggested Actions
            </h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Đăng ký Mentor</div>
                  <div className="text-xs text-slate-500">Khắc phục hổng kiến thức</div>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900" />
                <div>
                  <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Gửi cảnh báo SMS</div>
                  <div className="text-xs text-slate-500">Báo động nguy cơ kẹt tín chỉ</div>
                </div>
              </label>
            </div>
            <button className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]">
              Ghi nhận Can thiệp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicRiskMap;
