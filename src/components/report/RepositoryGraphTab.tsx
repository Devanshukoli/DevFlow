import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  Search,
  Database,
  Terminal,
  Activity,
  AlertTriangle,
  Folder,
  File,
  Cpu,
  Bookmark,
  Network,
  RefreshCw,
  HelpCircle,
  Clock,
  Play
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';

interface RepositoryGraphTabProps {
  jobId: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  properties: Record<string, any>;
}

const TYPE_COLORS: Record<string, string> = {
  Repository: '#F59E0B', // Amber
  Workspace: '#3B82F6',  // Blue
  File: '#10B981',       // Emerald
  Directory: '#8B5CF6',  // Purple
  Language: '#EC4899',   // Pink
  Framework: '#6366F1',  // Indigo
  ApiRoute: '#EF4444',    // Red
  HealthFinding: '#F97316', // Orange
  Package: '#14B8A6',    // Teal
  TestingFramework: '#06B6D4', // Cyan
};

export const RepositoryGraphTab: React.FC<RepositoryGraphTabProps> = ({ jobId }) => {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Predefined Query State
  const [activeQuery, setActiveQuery] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial graph visualization data
  useEffect(() => {
    let active = true;
    const fetchGraph = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(getApiUrl(`/api/analysis/${jobId}/graph`));
        if (!res.ok) throw new Error('Failed to load graph data.');
        const json = await res.json();
        if (json.ok && active) {
          setGraphData(json.data);
          // Set Repository node as default selected if exists
          const repo = json.data.nodes.find((n: any) => n.type === 'Repository');
          if (repo) setSelectedNode(repo);
        } else if (active) {
          setError(json.error?.message || 'Failed to parse graph structure.');
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Error connecting to database graph.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchGraph();
    return () => {
      active = false;
    };
  }, [jobId]);

  // Execute predefined query
  const runQuery = async (queryType: string) => {
    setActiveQuery(queryType);
    setQueryLoading(true);
    setQueryResults(null);
    try {
      const res = await fetch(getApiUrl(`/api/analysis/${jobId}/graph/query?type=${queryType}`));
      if (!res.ok) throw new Error('Query execution failed.');
      const json = await res.json();
      if (json.ok) {
        setQueryResults(json.data);
      } else {
        setQueryResults([]);
      }
    } catch (err) {
      console.error(err);
      setQueryResults([]);
    } finally {
      setQueryLoading(false);
    }
  };

  // D3 force simulation setup
  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 550;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', [0, 0, width, height]);

    // Create deep copy of nodes/links for D3 simulation mutation
    const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));
    const links: GraphLink[] = graphData.links.map((l) => ({ ...l }));

    // Container for zoom/pan
    const g = svg.append('g');

    // Zoom setup
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    // Filter/Highlight tracking
    const highlightNode = (node: GraphNode | null) => {
      if (!node) {
        nodeElements.style('opacity', 1);
        linkElements.style('opacity', 0.4).style('stroke', '#334155');
        textElements.style('opacity', 0.8);
        return;
      }

      // Find connected nodes
      const connectedIds = new Set<string>();
      connectedIds.add(node.id);
      links.forEach((link) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sourceId === node.id) connectedIds.add(targetId);
        if (targetId === node.id) connectedIds.add(sourceId);
      });

      nodeElements.style('opacity', (d) => (connectedIds.has(d.id) ? 1 : 0.15));
      linkElements.style('opacity', (link) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return sourceId === node.id || targetId === node.id ? 1 : 0.05;
      }).style('stroke', (link) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return sourceId === node.id || targetId === node.id ? TYPE_COLORS[node.type] : '#334155';
      });
      textElements.style('opacity', (d) => (connectedIds.has(d.id) ? 1 : 0.1));
    };

    // Forces
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(25));

    // Links (lines)
    const linkElements = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)
      .attr('cursor', 'pointer');

    // Nodes (circles)
    const nodeElements = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Outer circle
    nodeElements.append('circle')
      .attr('r', (d) => (d.type === 'Repository' ? 18 : 10))
      .attr('fill', (d) => TYPE_COLORS[d.type] || '#64748B')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2);

    // Inner glow for repository
    nodeElements.filter((d) => d.type === 'Repository')
      .append('circle')
      .attr('r', 22)
      .attr('fill', 'none')
      .attr('stroke', '#F59E0B')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 2)
      .attr('class', 'animate-pulse');

    // Node labels
    const textElements = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d) => {
        if (d.label.length > 20) return d.label.substring(0, 17) + '...';
        return d.label;
      })
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('fill', '#94a3b8')
      .attr('dx', (d) => (d.type === 'Repository' ? 24 : 14))
      .attr('dy', '4px')
      .attr('pointer-events', 'none')
      .style('opacity', 0.85);

    // Hover & Click Actions
    nodeElements
      .on('click', (event, d) => {
        setSelectedNode(d);
        highlightNode(d);
      })
      .on('mouseover', (event, d) => {
        setHoveredNode(d);
        if (!selectedNode) highlightNode(d);
      })
      .on('mouseout', () => {
        setHoveredNode(null);
        if (selectedNode) {
          highlightNode(selectedNode);
        } else {
          highlightNode(null);
        }
      });

    // Tick function
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

      nodeElements.attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);

      textElements
        .attr('x', (d) => d.x ?? 0)
        .attr('y', (d) => d.y ?? 0);
    });

    // Zoom on repository node initially
    const repoNode = nodes.find((n) => n.type === 'Repository');
    if (repoNode) {
      const transform = d3.zoomIdentity
        .translate(width / 2 - repoNode.x!, height / 2 - repoNode.y!)
        .scale(1.1);
      svg.transition().duration(800).call(zoomBehavior.transform, transform);
    }

    // Drag handlers
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  // Apply search filtering
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!graphData || !val) {
      if (selectedNode) {
        setSelectedNode(selectedNode);
      }
      return;
    }

    const matched = graphData.nodes.find((n) =>
      n.label.toLowerCase().includes(val.toLowerCase()) ||
      n.type.toLowerCase().includes(val.toLowerCase())
    );

    if (matched) {
      setSelectedNode(matched);
    }
  };

  // Helper to render type icons
  const renderTypeIcon = (type: string, className = "w-5 h-5") => {
    switch (type) {
      case 'Repository': return <Database className={`${className} text-amber-500`} />;
      case 'Workspace': return <Cpu className={`${className} text-blue-500`} />;
      case 'File': return <File className={`${className} text-emerald-500`} />;
      case 'Directory': return <Folder className={`${className} text-purple-500`} />;
      case 'Language': return <Terminal className={`${className} text-pink-500`} />;
      case 'Framework': return <Network className={`${className} text-indigo-500`} />;
      case 'ApiRoute': return <Activity className={`${className} text-red-500`} />;
      case 'HealthFinding': return <AlertTriangle className={`${className} text-orange-500`} />;
      case 'Package': return <Bookmark className={`${className} text-teal-500`} />;
      case 'TestingFramework': return <Network className={`${className} text-cyan-500`} />;
      default: return <HelpCircle className={`${className} text-slate-500`} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 font-mono">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-sm text-slate-400">Loading FalkorDB Knowledge Graph projection...</span>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="p-8 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center space-y-4 font-mono max-w-2xl mx-auto my-10">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">FalkorDB Unavailable</h3>
        <p className="text-sm text-slate-400 font-sans">
          {error || 'Unable to load interactive graph model. Verify that FalkorDB is running and accessible.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Tab Header Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#101724] border border-[#1d2a3f] p-4 rounded-xl font-mono">
        <div className="text-center md:border-r md:border-[#1d2a3f] py-2">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Graph Nodes</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{graphData.nodes.length}</div>
        </div>
        <div className="text-center md:border-r md:border-[#1d2a3f] py-2">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Relationships</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{graphData.links.length}</div>
        </div>
        <div className="text-center md:border-r md:border-[#1d2a3f] py-2">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Workspaces</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">
            {graphData.nodes.filter(n => n.type === 'Workspace').length}
          </div>
        </div>
        <div className="text-center py-2">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Status</div>
          <div className="text-xs font-bold text-slate-200 mt-2 inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Synchronized
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Interactive Graph visualization */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#101724] border border-[#1d2a3f] rounded-xl overflow-hidden relative">
            <div className="bg-[#0e1420] px-4 py-3 border-b border-[#1c2738] flex flex-wrap items-center justify-between gap-2 font-mono">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Network className="w-4 h-4 text-emerald-500" />
                D3 FORCE-DIRECTED TOPOLOGY
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search node..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-8 pr-3 py-1 bg-[#162030] border border-[#27374f] rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Interactive D3 Area */}
            <div ref={containerRef} className="bg-[#0b0f17] h-[550px] relative">
              <svg ref={svgRef} className="w-full h-full" />

              {/* Hover overlay indicator */}
              {hoveredNode && (
                <div className="absolute top-4 left-4 p-2 bg-[#0e1420] border border-[#1d2a3f] rounded text-xs font-mono max-w-xs pointer-events-none shadow-xl">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    {renderTypeIcon(hoveredNode.type, "w-4 h-4")}
                    <span>{hoveredNode.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 capitalize">Label: {hoveredNode.type}</div>
                </div>
              )}

              {/* Legend overlay */}
              <div className="absolute bottom-4 left-4 p-3 bg-[#0e1420]/80 border border-[#1d2a3f]/60 rounded-lg text-[10px] font-mono grid grid-cols-2 md:grid-cols-3 gap-2 pointer-events-none backdrop-blur-sm">
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                    <span className="text-slate-400 capitalize">{type.replace('Framework', ' Fw')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Predefined Queries Panel */}
          <div className="bg-[#101724] border border-[#1d2a3f] rounded-xl font-mono">
            <div className="bg-[#0e1420] px-4 py-3 border-b border-[#1c2738]">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" />
                SAFE DETERMINISTIC QUERY TEMPLATES
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => runQuery('frameworks')}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between h-24 ${
                  activeQuery === 'frameworks'
                    ? 'bg-indigo-500/5 border-indigo-500 text-indigo-400'
                    : 'bg-[#0e1420]/50 border-[#1d2a3f] text-slate-400 hover:border-slate-500 hover:bg-[#121927]'
                }`}
              >
                <span className="text-xs font-bold">Framework List</span>
                <span className="text-[10px] leading-relaxed text-slate-500 font-sans mt-1">What frameworks are detected?</span>
                <span className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1 self-end">
                  <Play className="w-3 h-3" /> Run Cypher
                </span>
              </button>

              <button
                onClick={() => runQuery('packages')}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between h-24 ${
                  activeQuery === 'packages'
                    ? 'bg-teal-500/5 border-teal-500 text-teal-400'
                    : 'bg-[#0e1420]/50 border-[#1d2a3f] text-slate-400 hover:border-slate-500 hover:bg-[#121927]'
                }`}
              >
                <span className="text-xs font-bold">Declared Packages</span>
                <span className="text-[10px] leading-relaxed text-slate-500 font-sans mt-1">Which packagist dependencies exist?</span>
                <span className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1 self-end">
                  <Play className="w-3 h-3" /> Run Cypher
                </span>
              </button>

              <button
                onClick={() => runQuery('routes')}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between h-24 ${
                  activeQuery === 'routes'
                    ? 'bg-red-500/5 border-red-500 text-red-400'
                    : 'bg-[#0e1420]/50 border-[#1d2a3f] text-slate-400 hover:border-slate-500 hover:bg-[#121927]'
                }`}
              >
                <span className="text-xs font-bold">API Route Files</span>
                <span className="text-[10px] leading-relaxed text-slate-500 font-sans mt-1">Which files expose API endpoints?</span>
                <span className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1 self-end">
                  <Play className="w-3 h-3" /> Run Cypher
                </span>
              </button>

              <button
                onClick={() => runQuery('findings')}
                className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between h-24 ${
                  activeQuery === 'findings'
                    ? 'bg-orange-500/5 border-orange-500 text-orange-400'
                    : 'bg-[#0e1420]/50 border-[#1d2a3f] text-slate-400 hover:border-slate-500 hover:bg-[#121927]'
                }`}
              >
                <span className="text-xs font-bold">Health Findings</span>
                <span className="text-[10px] leading-relaxed text-slate-500 font-sans mt-1">Which issues exist in the graph?</span>
                <span className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1 self-end">
                  <Play className="w-3 h-3" /> Run Cypher
                </span>
              </button>
            </div>

            {/* Predefined Query Outcomes Rendering */}
            {activeQuery && (
              <div className="px-4 pb-4 border-t border-[#1c2738] bg-[#0c101a] p-4 rounded-b-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-indigo-400 font-bold flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>RESULTS FOR QUERY: {activeQuery.toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => setActiveQuery(null)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors bg-[#182335] px-2 py-0.5 rounded border border-[#2b3d5b]"
                  >
                    Clear Results
                  </button>
                </div>

                {queryLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
                    <span className="text-xs text-slate-400">Executing safe Cypher read on server...</span>
                  </div>
                ) : queryResults && queryResults.length > 0 ? (
                  <div className="overflow-x-auto max-h-64 scrollbar-thin">
                    <table className="w-full text-xs text-slate-300">
                      <thead>
                        <tr className="bg-[#121b2a] border-b border-[#202e45] text-[10px] uppercase tracking-wider text-slate-400 text-left">
                          <th className="py-2 px-3">Property Name</th>
                          <th className="py-2 px-3">Metadata / Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.map((item, idx) => (
                          <tr key={idx} className="border-b border-[#1c2738] hover:bg-[#162133] transition-colors">
                            <td className="py-2 px-3 font-bold text-white">
                              {item.name || item.title || item.path || `Record #${idx + 1}`}
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              <pre className="text-[10px] bg-[#0c101a] p-1 rounded max-w-md overflow-x-auto scrollbar-none font-mono">
                                {JSON.stringify(item, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-500 font-sans">
                    No results or nodes matched this Cypher pattern inside the job graph.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Side detail Pane */}
        <div className="space-y-6">
          <div className="bg-[#101724] border border-[#1d2a3f] rounded-xl overflow-hidden font-mono">
            <div className="bg-[#0e1420] px-4 py-3 border-b border-[#1c2738] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-emerald-500" />
                NODE INSPECTOR
              </span>
              {selectedNode && (
                <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded uppercase">
                  {selectedNode.type}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="p-4 space-y-4">
                {/* Node Title Header */}
                <div className="flex items-start gap-3 bg-[#0d121d] p-3 rounded-lg border border-[#1d2a3f]">
                  {renderTypeIcon(selectedNode.type, "w-6 h-6 mt-0.5")}
                  <div>
                    <h4 className="text-sm font-bold text-white break-all leading-snug">{selectedNode.label}</h4>
                    <span className="text-[10px] text-slate-500 block mt-1 uppercase">ID: {selectedNode.id}</span>
                  </div>
                </div>

                {/* Key Properties List */}
                <div className="space-y-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Node Properties</div>
                  <div className="bg-[#0b0f17] p-3 rounded-lg border border-[#1c2738] text-xs space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
                    {Object.entries(selectedNode.properties).length > 0 ? (
                      Object.entries(selectedNode.properties)
                        .filter(([key]) => key !== 'id') // Hide ID since shown above
                        .map(([key, val]) => (
                          <div key={key} className="border-b border-[#1c2738]/50 pb-2 last:border-0 last:pb-0">
                            <span className="text-slate-500 text-[10px] block capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-slate-200 font-bold break-all">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-2 text-slate-500 italic">No structured properties on this entity.</div>
                    )}
                  </div>
                </div>

                {/* Relational Context Helper */}
                <div className="text-xs text-slate-400 font-sans leading-relaxed border-t border-[#1c2738]/50 pt-3">
                  Hover over surrounding nodes or drag elements to investigate relational topology.
                </div>
              </div>
            ) : (
              <div className="p-10 text-center space-y-3">
                <Network className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Select any node in the topology visualization to inspect properties, configurations, and connections.
                </p>
              </div>
            )}
          </div>

          {/* Graph Architecture Guidelines Info Card */}
          <div className="bg-[#101724]/60 border border-[#1d2a3f]/60 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              ABOUT THIS KNOWLEDGE GRAPH
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              This interactive schema represents **verified repository facts** compiled deterministically. No opinions or model hallucinated relationships are present. 
            </p>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Double-click nodes or use mouse wheel to zoom. Drag items to adjust visualization layout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
