import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KnowledgeGraphDashboard = () => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const graphRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const [graphRes, riskRes] = await Promise.all([
          axios.get('http://localhost:3000/api/v1/graph/dependencies'),
          axios.get('http://localhost:3000/api/v1/graph/risk-analysis')
        ]);
        
        // Data format from Neo4j may require minor transformation for react-force-graph-2d
        const nodes = graphRes.data.nodes.map(n => ({
          ...n,
          val: n.difficulty ? parseFloat(n.difficulty) : 1
        }));
        
        const links = graphRes.data.edges.map(e => ({
          source: e.from,
          target: e.to,
          name: e.label
        }));

        setGraphData({ nodes, links });
        setRiskData(riskRes.data.bottlenecks || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching graph data:", err);
        setError("Không thể tải dữ liệu Knowledge Graph. Vui lòng kiểm tra Neo4j Backend.");
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-white text-xl animate-pulse">Loading Academic Knowledge Graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-red-500">
        <AlertTriangle size={64} className="mb-4" />
        <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Sidebar for Risk Analysis */}
      <div className="w-1/4 bg-slate-800 border-r border-slate-700 flex flex-col z-10 shadow-2xl">
        <div className="p-4 border-b border-slate-700 flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            Graph Dashboard
          </h1>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-rose-400">
            <AlertTriangle size={18} className="mr-2" />
            Risk Bottlenecks
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Các môn học là điều kiện tiên quyết cho nhiều môn học khác. Sinh viên trượt các môn này sẽ có nguy cơ chậm tiến độ cao.
          </p>

          <div className="space-y-3">
            {riskData.length > 0 ? riskData.map((risk, idx) => (
              <div key={idx} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-blue-300">{risk.courseCode}</span>
                  <span className="bg-rose-500/20 text-rose-300 text-xs px-2 py-1 rounded font-mono">
                    {risk.dependentCount} links
                  </span>
                </div>
                <div className="text-sm text-slate-300 line-clamp-1" title={risk.courseName}>
                  {risk.courseName}
                </div>
              </div>
            )) : (
              <div className="text-slate-500 text-sm italic">Không tìm thấy bottleneck nào.</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Graph View */}
      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-10 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-slate-700 text-sm">
          <strong>Nút:</strong> Môn học <br/>
          <strong>Mũi tên:</strong> Điều kiện tiên quyết <br/>
          <em>* Kích thước nút = Độ khó (Difficulty)</em>
        </div>

        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="title"
          nodeColor={node => {
            const bottlenecks = riskData.map(r => r.courseCode);
            if (bottlenecks.includes(node.id)) return '#f43f5e'; // Rose-500 for high risk
            return '#3b82f6'; // Blue-500 for normal
          }}
          nodeRelSize={6}
          linkColor={() => 'rgba(148, 163, 184, 0.4)'} // slate-400 with opacity
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          onNodeClick={node => {
            // Focus on node
            const distance = 40;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
            if (graphRef.current) {
              graphRef.current.centerAt(node.x, node.y, 1000);
              graphRef.current.zoom(8, 2000);
            }
          }}
          // Auto-zoom to fit when loaded
          onEngineStop={() => {
            if (graphRef.current) {
              graphRef.current.zoomToFit(400);
            }
          }}
        />
      </div>
    </div>
  );
};

export default KnowledgeGraphDashboard;
