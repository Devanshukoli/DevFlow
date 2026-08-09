import React from 'react';
import { GitBranch, FileCode, Layers, ShieldCheck, Terminal, Cpu } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Metric } from '../ui/metric';
import { HealthIndicator } from '../devflow/health-indicator';
import { TerminalLine } from '../devflow/terminal-line';
import { TechnicalLabel } from '../devflow/technical-label';
import { SectionHeader } from '../devflow/section-header';

export const ProductPreview: React.FC = () => {
  return (
    <section className="py-12 space-y-6">
      <SectionHeader
        technicalLabel="ANALYSIS ENVIRONMENT"
        title="Interactive Repository Report"
        description="A static glimpse of the comprehensive analysis experience DevFlow generates for every codebase."
        action={
          <Badge variant="neutral" size="sm" isMonospace icon={<Terminal className="w-3 h-3 text-emerald-400" />}>
            STATIC PRODUCT PREVIEW
          </Badge>
        }
      />

      {/* Main Preview Container Box */}
      <div className="rounded-xl border border-[#222f43] bg-[#111722] p-4 sm:p-6 space-y-6 shadow-2xl shadow-black/40">
        
        {/* Mock Top Repo Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-[#0b0f17] border border-[#1f2c3f]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-[#17202e] border border-[#222f43] text-emerald-400">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">facebook/react</span>
                <Badge variant="success" size="sm">
                  MAIN
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                The library for web and native user interfaces
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="neutral" isMonospace>
              TypeScript 5.2
            </Badge>
            <Badge variant="info" isMonospace>
              pnpm workspace
            </Badge>
          </div>
        </div>

        {/* Mock Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric
            label="HEALTH SCORE"
            value="84 / 100"
            trend={{ value: '+4 pts', direction: 'up' }}
            description="Optimal architecture rating"
            icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          />
          <Metric
            label="TOTAL FILES"
            value="127"
            description="Parsed TypeScript & JSX files"
            icon={<FileCode className="w-4 h-4 text-slate-400" />}
          />
          <Metric
            label="DEPENDENCIES"
            value="42"
            description="External packages & lockfiles"
            icon={<Layers className="w-4 h-4 text-slate-400" />}
          />
          <Metric
            label="API BOUNDARIES"
            value="18"
            description="Discovered public interfaces"
            icon={<Cpu className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Mock Visual Architecture Flow & Terminal Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Architecture Tree Preview */}
          <Card variant="default">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  ARCHITECTURE MAP
                </CardTitle>
                <TechnicalLabel size="xs" colorVariant="emerald">
                  DIAGNOSTIC
                </TechnicalLabel>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 font-mono text-xs">
              <div className="p-3 rounded bg-[#0b0f17] border border-[#1f2c3f] space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span>[ENTRY] src/index.ts</span>
                  <span className="text-[10px] text-slate-500">ROOT</span>
                </div>
                <div className="pl-4 border-l border-[#222f43] space-y-2 text-slate-300 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span>└── /api/reconciler.ts</span>
                    <span className="text-slate-500">Core Engine</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>└── /packages/scheduler</span>
                    <span className="text-slate-500">Task Pool</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>└── /shared/ReactTypes.ts</span>
                    <span className="text-slate-500">Definitions</span>
                  </div>
                </div>
              </div>

              <HealthIndicator
                status="healthy"
                score={84}
                label="SYSTEM INTEGRITY"
                showDetails={false}
              />
            </CardContent>
          </Card>

          {/* Terminal Output Log Stream Preview */}
          <Card variant="default">
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  ANALYSIS RUNNER
                </CardTitle>
                <TechnicalLabel size="xs" colorVariant="muted">
                  EXECUTION LOG
                </TechnicalLabel>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="p-3 rounded bg-[#0a0e14] border border-[#1f2c3f] space-y-1 font-mono">
                <TerminalLine status="success" text="Cloned repository facebook/react" duration="0.8s" />
                <TerminalLine status="success" text="Detected pnpm workspace & TypeScript" duration="0.3s" />
                <TerminalLine status="success" text="Identified 42 package dependencies" duration="1.1s" />
                <TerminalLine status="success" text="Mapped 18 API route boundaries" duration="0.9s" />
                <TerminalLine status="active" text="Generating architecture graph..." duration="Processing" />
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </section>
  );
};
