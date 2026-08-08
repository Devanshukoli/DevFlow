import React, { useEffect, useState } from 'react';
import { Server, LayoutGrid, CheckCircle2, Database, Code2, Layers, RefreshCw, Terminal, GitBranch } from 'lucide-react';
import { getSupabaseConfigStatus } from '../../../packages/shared/src/supabase';
import { SystemHealthStatus, SupabaseConfigStatus } from '../../../packages/shared/src/types';

export default function App() {
  const [backendHealth, setBackendHealth] = useState<SystemHealthStatus | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConfigStatus>(getSupabaseConfigStatus());

  const fetchStatus = async () => {
    setLoading(true);
    setBackendError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setBackendHealth(json.data);
    } catch (err: any) {
      setBackendError(err.message || 'Failed to reach backend service');
    } finally {
      setLoading(false);
      setSupabaseStatus(getSupabaseConfigStatus());
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500/20 selection:text-orange-400 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-orange-500 font-mono text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Monorepo Foundation Base</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              DevFlow Monorepo
              <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Foundation Ready
              </span>
            </h1>
            <p className="text-slate-400 text-sm">
              Clean, production-grade monorepo setup pairing React frontend, Express API backend, and Supabase connection setup.
            </p>
          </div>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2.5 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Health Checks
          </button>
        </div>

        {/* Monorepo Architecture Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Package 1: Web Frontend */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">apps/web</h3>
                  <p className="text-xs text-slate-400">React + Vite + TypeScript</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Running
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Client SPA mounted with Tailwind CSS, Lucide icons, and shared workspace package access.
            </p>
          </div>

          {/* Package 2: Backend API */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">apps/api</h3>
                  <p className="text-xs text-slate-400">Node.js + Express API</p>
                </div>
              </div>
              {backendHealth?.status === 'online' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Connecting...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modular REST services with health checks and structured route controllers.
            </p>
          </div>

          {/* Package 3: Shared Workspace */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">packages/shared</h3>
                  <p className="text-xs text-slate-400">Shared Types & Config</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Shared
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Shared TypeScript contracts, Supabase configuration, and utility routines.
            </p>
          </div>

        </div>

        {/* Live System Diagnostics & Supabase Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* API Health Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                Backend API Health Response
              </h2>
              <span className="text-[11px] font-mono text-slate-500">GET /api/health</span>
            </div>

            {loading ? (
              <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs font-mono text-slate-400 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                Querying Express backend...
              </div>
            ) : backendError ? (
              <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300">
                {backendError}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 font-mono text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="text-emerald-400 font-semibold">{backendHealth?.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-emerald-400 font-semibold">{backendHealth?.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uptime:</span>
                  <span className="text-slate-200">{backendHealth?.uptimeSeconds}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Environment:</span>
                  <span className="text-slate-200">{backendHealth?.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="text-slate-400 text-[11px]">{backendHealth?.timestamp}</span>
                </div>
              </div>
            )}
          </div>

          {/* Supabase Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Supabase Client Configuration
              </h2>
              <span className="text-[11px] font-mono text-slate-500">Connection Only</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2">
                {supabaseStatus.configured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></div>
                )}
                <span className="text-xs font-medium text-slate-200">
                  {supabaseStatus.message}
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-xs pt-1 border-t border-slate-800/60">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>SUPABASE_URL</span>
                  <span className={supabaseStatus.urlProvided ? 'text-emerald-400' : 'text-amber-400/80'}>
                    {supabaseStatus.urlProvided ? 'Provided' : 'Placeholder / Missing'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>SUPABASE_ANON_KEY</span>
                  <span className={supabaseStatus.keyProvided ? 'text-emerald-400' : 'text-amber-400/80'}>
                    {supabaseStatus.keyProvided ? 'Provided' : 'Placeholder / Missing'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              `getSupabaseClient()` is initialized safely in `packages/shared/src/supabase.ts` ready for connection when environment secrets are provided.
            </p>
          </div>

        </div>

        {/* Definition of Done Checklist */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Task 1: Definition of Done Checklist
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Monorepo Structure</span>
                <span className="text-slate-400">Organized into `apps/web`, `apps/api`, and `packages/shared`.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Frontend Status</span>
                <span className="text-slate-400">React + Vite + TypeScript application running cleanly.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Backend Status</span>
                <span className="text-slate-400">Express + TypeScript API service serving `/api/health`.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Shared Lint & Supabase</span>
                <span className="text-slate-400">Unified `npm run lint` check and Supabase connection setup.</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
