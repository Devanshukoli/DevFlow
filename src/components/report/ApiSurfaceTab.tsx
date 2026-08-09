import React, { useState, useMemo } from 'react';
import {
  RepositoryApiSurface,
  ApiRoute
} from '@devflow/shared';
import {
  Network,
  Globe,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Workflow,
  Code
} from 'lucide-react';

export interface ApiSurfaceTabProps {
  apiSurface?: RepositoryApiSurface;
}

export const ApiSurfaceTab: React.FC<ApiSurfaceTabProps> = ({ apiSurface }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('ALL');
  const [expandedGrpc, setExpandedGrpc] = useState<Record<string, boolean>>({});

  // Fallback to empty default structure if undefined
  const data = useMemo<RepositoryApiSurface>(() => {
    return apiSurface || {
      frameworks: [],
      routes: [],
      graphql: [],
      rpc: [],
      signals: []
    };
  }, [apiSurface]);

  const toggleGrpc = (serviceName: string) => {
    setExpandedGrpc((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName]
    }));
  };

  // Get unique HTTP methods
  const methods = useMemo(() => {
    const list = new Set<string>();
    data.routes.forEach((r: ApiRoute) => {
      if (r.method) list.add(r.method.toUpperCase());
    });
    return ['ALL', ...Array.from(list).sort()];
  }, [data.routes]);

  // Get unique route frameworks
  const routeFrameworks = useMemo(() => {
    const list = new Set<string>();
    data.routes.forEach((r: ApiRoute) => {
      if (r.framework) list.add(r.framework);
    });
    return ['ALL', ...Array.from(list).sort()];
  }, [data.routes]);

  // Filter routes
  const filteredRoutes = useMemo(() => {
    return data.routes.filter((route: ApiRoute) => {
      const matchesSearch =
        searchTerm === '' ||
        (route.path !== null && route.path.toLowerCase().includes(searchTerm.toLowerCase())) ||
        route.sourceFile.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod =
        methodFilter === 'ALL' ||
        (route.method !== null && route.method.toUpperCase() === methodFilter);

      const matchesFramework =
        frameworkFilter === 'ALL' ||
        route.framework === frameworkFilter;

      return matchesSearch && matchesMethod && matchesFramework;
    });
  }, [data.routes, searchTerm, methodFilter, frameworkFilter]);

  const getMethodBadgeColor = (method?: string | null) => {
    if (!method) return 'bg-[#1e293b] text-slate-300 border-[#334155]';
    const m = method.toUpperCase();
    switch (m) {
      case 'GET':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'POST':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'PUT':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'PATCH':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const getConfidenceBadgeColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HTTP ROUTES</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{data.routes.length}</span>
            <span className="text-[10px] text-emerald-400">DETECTED</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">API FRAMEWORKS</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{data.frameworks.length}</span>
            <span className="text-[10px] text-purple-400">ACTIVE</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GRAPHQL SCHEMA</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{data.graphql.length}</span>
            <span className="text-[10px] text-blue-400">{data.graphql.length > 0 ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">gRPC SERVICES</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{data.rpc.length}</span>
            <span className="text-[10px] text-amber-400">{data.rpc.length > 0 ? 'ACTIVE' : 'INACTIVE'}</span>
          </div>
        </div>
      </div>

      {/* 2. Main API Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns (Span 2): Searchable Routes List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-xl bg-[#121927] border border-[#202c40] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1c283c] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  HTTP ROUTE REGISTRY
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">
                {filteredRoutes.length} of {data.routes.length} ROUTED
              </span>
            </div>

            {/* Filters bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search routes or files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#0b0f17] border border-[#202c40] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
              </div>

              {/* Method filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-[#0b0f17] border border-[#202c40] rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/40 transition-colors"
              >
                <option value="ALL">All Methods</option>
                {methods.filter((m) => m !== 'ALL').map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* Framework filter */}
              <select
                value={frameworkFilter}
                onChange={(e) => setFrameworkFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-[#0b0f17] border border-[#202c40] rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/40 transition-colors"
              >
                <option value="ALL">All Frameworks</option>
                {routeFrameworks.filter((f) => f !== 'ALL').map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Routes Content */}
            {filteredRoutes.length > 0 ? (
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredRoutes.map((route: ApiRoute, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-lg bg-[#0b0f17] border border-[#1a2538] hover:border-[#2b3d5c] transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {/* Method badge */}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getMethodBadgeColor(route.method)} shrink-0`}>
                          {route.method || 'GET'}
                        </span>
                        
                        {/* Route Path */}
                        <span className="text-xs font-semibold text-slate-100 select-all truncate">
                          {route.path === null ? (
                            <span className="text-slate-500 italic">[Dynamic / Unresolvable Route]</span>
                          ) : (
                            route.path
                          )}
                        </span>
                      </div>

                      {/* Confidence badge */}
                      <span className={`px-2 py-0.5 rounded text-[8px] border shrink-0 ${getConfidenceBadgeColor(route.confidence)}`}>
                        {route.confidence.toUpperCase()} CONFIDENCE
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 gap-4">
                      {/* Source file & line */}
                      <span className="truncate hover:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {route.sourceFile}{route.line ? `:${route.line}` : ''}
                        </span>
                      </span>

                      {/* Framework badge */}
                      <span className="text-[10px] text-slate-500 bg-[#161e2d] px-2 py-0.5 rounded border border-[#202c40] shrink-0 uppercase tracking-wider font-bold">
                        {route.framework}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#0b0f17] border border-[#1a2538] rounded-lg flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-6 h-6 text-slate-600" />
                <span>No matching routes or endpoints found inside the codebase.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Schema Detectors & Framework Signals */}
        <div className="space-y-6">
          
          {/* 1. GraphQL details if found */}
          {data.graphql.length > 0 && (
            <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1c283c] pb-3">
                <Code className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  GRAPHQL ENGINE
                </h3>
              </div>

              {data.graphql.map((gql: any, i: number) => (
                <div key={i} className="p-3.5 rounded-lg bg-[#0b0f17] border border-[#1a2538] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 capitalize">
                      {gql.provider}
                    </span>
                    <span className="text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      SCHEMA DETECTED
                    </span>
                  </div>

                  <div className="text-[10px] space-y-1.5 text-slate-400">
                    <div className="flex justify-between">
                      <span>Endpoint</span>
                      <span className="text-slate-200 text-right font-semibold select-all">
                        {gql.endpoint || '/graphql (guessed)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence</span>
                      <span className="text-slate-200 capitalize">{gql.confidence}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. gRPC RPC details if found */}
          {data.rpc.length > 0 && (
            <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1c283c] pb-3">
                <Workflow className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  gRPC PROTOS
                </h3>
              </div>

              <div className="space-y-2.5">
                {data.rpc.map((srv: any, i: number) => {
                  const isOpen = expandedGrpc[srv.serviceName];
                  return (
                    <div key={i} className="p-3 rounded-lg bg-[#0b0f17] border border-[#1a2538] space-y-2">
                      <button
                        onClick={() => toggleGrpc(srv.serviceName)}
                        className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-200 hover:text-white"
                      >
                        <span className="truncate">{srv.serviceName}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-normal text-slate-400">
                            {srv.methods.length} RPCs
                          </span>
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="pl-2 pt-2 border-t border-[#1c283c] space-y-1.5">
                          {srv.methods.map((method: string, mi: number) => (
                            <div key={mi} className="text-[10px] text-slate-300 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="font-semibold select-all">{method}</span>
                            </div>
                          ))}
                          <div className="pt-1.5 text-[9px] text-slate-500 truncate">
                            File: {srv.sourceFile}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. API Surface Signals / Evidence */}
          <div className="p-5 rounded-xl bg-[#121927] border border-[#202c40] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#1c283c] pb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                SURFACE EVIDENCE
              </h3>
            </div>

            {data.signals.length > 0 ? (
              <div className="space-y-3">
                {data.signals.map((sig: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-[#0b0f17] border border-[#1a2538] space-y-2">
                    <span className="text-xs font-bold text-slate-200 block leading-relaxed">
                      {sig.signal}
                    </span>
                    <div className="space-y-1 pl-2 border-l border-[#1c283c]">
                      {sig.evidence.map((ev: string, ei: number) => (
                        <span key={ei} className="text-[9px] text-slate-400 block truncate leading-relaxed">
                          • {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No specific static surface evidence discovered.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
