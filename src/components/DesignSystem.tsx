import React, { useState } from 'react';
import {
  Terminal,
  Code2,
  Layers,
  GitBranch,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Activity,
  FileCode,
  Box,
  Cpu,
  Info,
} from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { StatusIndicator } from './ui/status-indicator';
import { Progress } from './ui/progress';
import { Divider } from './ui/divider';
import { CodeBlock } from './ui/code-block';
import { Metric } from './ui/metric';
import { EmptyState } from './ui/empty-state';
import { Skeleton } from './ui/skeleton';
import { Tooltip } from './ui/tooltip';

import { TechnicalLabel } from './devflow/technical-label';
import { TerminalLine } from './devflow/terminal-line';
import { HealthIndicator } from './devflow/health-indicator';
import { SectionHeader } from './devflow/section-header';

export function DesignSystem() {
  const [progressVal, setProgressVal] = useState(65);
  const [inputValue, setInputValue] = useState('https://github.com/facebook/react');

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans p-4 sm:p-8 lg:p-12 selection:bg-emerald-500/20 selection:text-emerald-400">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Top Header */}
        <div className="space-y-2 border-b border-[#222f43] pb-6">
          <div className="flex items-center gap-2">
            <TechnicalLabel colorVariant="emerald" icon={<Layers className="w-4 h-4" />}>
              DEVFLOW DESIGN SYSTEM FOUNDATION
            </TechnicalLabel>
            <Badge variant="success" size="sm">
              TASK 2 COMPLETE
            </Badge>
          </div>
          <h1 className="text-display text-white tracking-tight flex items-center gap-3">
            DevFlow Design Tokens & UI Components
          </h1>
          <p className="text-body max-w-2xl text-slate-400">
            Dark-first developer-tool UI foundation built with Tailwind CSS, JetBrains Mono, and custom engineering primitives.
          </p>
        </div>

        {/* SECTION 1: Color Tokens */}
        <section className="space-y-4">
          <SectionHeader
            technicalLabel="COLOR SYSTEM"
            title="Semantic Tokens & Color Palette"
            description="Centralized CSS variables supporting dark-first surfaces, subtle borders, and restrained developer green."
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg border border-[#222f43] bg-[#0b0f17] space-y-1.5">
              <div className="w-full h-8 rounded bg-[#0b0f17] border border-[#222f43]" />
              <div className="text-[11px] font-mono text-slate-300 font-semibold">--background</div>
              <div className="text-[10px] font-mono text-slate-500">#0b0f17</div>
            </div>

            <div className="p-3 rounded-lg border border-[#222f43] bg-[#111722] space-y-1.5">
              <div className="w-full h-8 rounded bg-[#111722] border border-[#222f43]" />
              <div className="text-[11px] font-mono text-slate-300 font-semibold">--surface</div>
              <div className="text-[10px] font-mono text-slate-500">#111722</div>
            </div>

            <div className="p-3 rounded-lg border border-[#222f43] bg-[#17202e] space-y-1.5">
              <div className="w-full h-8 rounded bg-[#17202e] border border-[#222f43]" />
              <div className="text-[11px] font-mono text-slate-300 font-semibold">--surface-elevated</div>
              <div className="text-[10px] font-mono text-slate-500">#17202e</div>
            </div>

            <div className="p-3 rounded-lg border border-[#222f43] bg-[#111722] space-y-1.5">
              <div className="w-full h-8 rounded bg-emerald-500" />
              <div className="text-[11px] font-mono text-emerald-400 font-semibold">--primary (Green)</div>
              <div className="text-[10px] font-mono text-slate-500">#10b981</div>
            </div>

            <div className="p-3 rounded-lg border border-[#222f43] bg-[#111722] space-y-1.5">
              <div className="w-full h-8 rounded bg-[#222f43]" />
              <div className="text-[11px] font-mono text-slate-300 font-semibold">--border</div>
              <div className="text-[10px] font-mono text-slate-500">#222f43</div>
            </div>

            <div className="p-3 rounded-lg border border-[#222f43] bg-[#111722] space-y-1.5">
              <div className="w-full h-8 rounded bg-amber-500/20 border border-amber-500/40" />
              <div className="text-[11px] font-mono text-amber-400 font-semibold">--warning</div>
              <div className="text-[10px] font-mono text-slate-500">#f59e0b</div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Typography Hierarchy */}
        <section className="space-y-4">
          <SectionHeader
            technicalLabel="TYPOGRAPHY"
            title="Type Hierarchy & Monospace Metadata"
            description="Plus Jakarta Sans for UI elements and JetBrains Mono for technical metrics, paths, and labels."
          />
          <div className="p-6 rounded-lg bg-[#111722] border border-[#222f43] space-y-4 font-sans">
            <div className="space-y-1">
              <span className="text-tech-label">Display Heading</span>
              <p className="text-display text-white">DevFlow Repository Intelligence</p>
            </div>
            <Divider />
            <div className="space-y-1">
              <span className="text-tech-label">H1 Heading</span>
              <p className="text-h1 text-white">System Architecture & Health Analysis</p>
            </div>
            <Divider />
            <div className="space-y-1">
              <span className="text-tech-label">H2 Heading</span>
              <p className="text-h2 text-white">Dependency Graph & Vulnerabilities</p>
            </div>
            <Divider />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-tech-label">Body Text (UI Sans)</span>
                <p className="text-body text-slate-300">
                  DevFlow automatically parses structural AST trees to map module boundaries, trace imports, and summarize project characteristics.
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-tech-label">Technical Code / Monospace</span>
                <p className="font-mono text-xs text-emerald-400 bg-[#0a0e14] p-3 rounded border border-[#222f43]">
                  pnpm --filter @devflow/worker run build --target=es2022
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Buttons */}
        <section className="space-y-4">
          <SectionHeader
            technicalLabel="INTERACTIVE CONTROLS"
            title="Buttons & States"
            description="Variants, sizes, and interactive states with keyboard accessibility and visual loading indicators."
          />
          <div className="p-6 rounded-lg bg-[#111722] border border-[#222f43] space-y-6">
            
            {/* Variants */}
            <div className="space-y-2">
              <TechnicalLabel>Button Variants</TechnicalLabel>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Green</Button>
                <Button variant="secondary">Secondary Surface</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive Action</Button>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <TechnicalLabel>Button Sizes</TechnicalLabel>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="secondary" leftIcon={<GitBranch className="w-3.5 h-3.5" />}>
                  Small (sm)
                </Button>
                <Button size="md" variant="secondary" leftIcon={<Code2 className="w-4 h-4" />}>
                  Medium (md)
                </Button>
                <Button size="lg" variant="primary" rightIcon={<Terminal className="w-4 h-4" />}>
                  Large (lg)
                </Button>
              </div>
            </div>

            {/* States */}
            <div className="space-y-2">
              <TechnicalLabel>Button States</TechnicalLabel>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" isLoading>
                  Analyzing Repository
                </Button>
                <Button variant="secondary" disabled>
                  Disabled State
                </Button>
                <Tooltip content="Tooltip attached to button action">
                  <Button variant="secondary" leftIcon={<Info className="w-4 h-4" />}>
                    With Tooltip
                  </Button>
                </Tooltip>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 4: Inputs */}
        <section className="space-y-4">
          <SectionHeader
            technicalLabel="FORM ELEMENTS"
            title="Inputs & Field Validation"
            description="Text inputs with labels, helper descriptions, prefix icons, error states, and monospace code modes."
          />
          <div className="p-6 rounded-lg bg-[#111722] border border-[#222f43] grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="GitHub Repository URL"
              description="Provide a public repository link (e.g. github.com/owner/repo)"
              prefixElement={<Search className="w-4 h-4" />}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              isMonospace
            />

            <Input
              label="Branch Name"
              description="Target branch for analysis"
              defaultValue="main"
              isMonospace
            />

            <Input
              label="Invalid Configuration Example"
              error="Repository not found or access token expired."
              defaultValue="github.com/invalid/non-existent"
              isMonospace
            />

            <Input
              label="Disabled Field"
              defaultValue="ReadOnly system parameter"
              disabled
            />
          </div>
        </section>

        {/* SECTION 5: Cards & Badges */}
        <section className="space-y-4">
          <SectionHeader
            technicalLabel="DATA CONTAINERS"
            title="Cards & Badges"
            description="Minimal card primitives with structured header, title, content, and footer regions."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <Card variant="default">
              <CardHeader>
                <CardTitle>
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  AST Parser Service
                </CardTitle>
                <CardDescription>Engine analysis status and worker node pool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Worker Status</span>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Avg Latency</span>
                  <span className="font-mono text-slate-200">142ms</span>
                </div>
              </CardContent>
              <CardFooter>
                <span>Cluster: us-east-1</span>
                <span className="font-mono text-emerald-400 font-semibold">ONLINE</span>
              </CardFooter>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <CardTitle>
                  <Box className="w-4 h-4 text-blue-400" />
                  Interactive Surface Card
                </CardTitle>
                <CardDescription>Hover over this card to inspect interactive border state</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-300 leading-relaxed">
                  DevFlow avoids heavy box shadows in favor of subtle 1px border elevation transitions on user interaction.
                </p>
              </CardContent>
              <CardFooter>
                <span>Clickable container</span>
                <Badge variant="info">INTERACTIVE</Badge>
              </CardFooter>
            </Card>

            <Card variant="muted">
              <CardHeader>
                <CardTitle>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Warning Flag Card
                </CardTitle>
                <CardDescription>Highlighted diagnostic surface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Security Audit</span>
                  <Badge variant="warning">3 DEPRECATED</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">License Type</span>
                  <Badge variant="neutral">MIT</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <span>Scan Completed</span>
                <span className="font-mono text-amber-400">2m ago</span>
              </CardFooter>
            </Card>

          </div>
        </section>

        {/* SECTION 6: Status & Progress */}
        <section className="space-y-4">
          <SectionHeader
            technicalLabel="OBSERVABILITY"
            title="Status Indicators & Progress Bars"
            description="Semantic status pills and progress primitives for tracking analysis execution."
          />
          <div className="p-6 rounded-lg bg-[#111722] border border-[#222f43] space-y-6">
            
            <div className="space-y-2">
              <TechnicalLabel>Status Indicator States</TechnicalLabel>
              <div className="flex flex-wrap items-center gap-3">
                <StatusIndicator status="ready" />
                <StatusIndicator status="running" />
                <StatusIndicator status="completed" />
                <StatusIndicator status="warning" />
                <StatusIndicator status="failed" />
                <StatusIndicator status="idle" />
              </div>
            </div>

            <Divider />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <TechnicalLabel>Determinate Progress ({progressVal}%)</TechnicalLabel>
                <Progress
                  value={progressVal}
                  label="Parsing AST Tokens"
                  showValueText
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setProgressVal(Math.max(0, progressVal - 15))}>
                    -15%
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setProgressVal(Math.min(100, progressVal + 15))}>
                    +15%
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <TechnicalLabel>Indeterminate Progress</TechnicalLabel>
                <Progress
                  isIndeterminate
                  label="Cloning Remote Repository..."
                  showValueText
                />
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 7: Code Blocks & Metrics */}
        <section className="space-y-4">
          <SectionHeader
            technicalLabel="TECHNICAL METRICS"
            title="Code Blocks & System Metrics"
            description="Presentational code container with line numbers and single-metric summary cards."
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CodeBlock
                filename="packages/analysis/src/indexer.ts"
                language="typescript"
                code={`import { analyzeRepository } from '@devflow/ast-parser';

export async function processRepository(repoUrl: string) {
  const result = await analyzeRepository({
    url: repoUrl,
    depth: 'full',
    includeDependencies: true
  });

  return {
    healthScore: result.score,
    filesCount: result.files.length,
    status: 'COMPLETED'
  };
}`}
              />
            </div>

            <div className="space-y-3">
              <Metric
                label="TOTAL FILES ANALYZED"
                value="1,428"
                trend={{ value: '+12%', direction: 'up' }}
                description="Compared to previous repository commit"
                icon={<FileCode className="w-4 h-4" />}
              />
              <Metric
                label="DEPENDENCY VULNERABILITIES"
                value="0"
                trend={{ value: 'Clean', direction: 'neutral' }}
                description="All 84 npm packages passed audit"
                icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
              />
            </div>
          </div>
        </section>

        {/* SECTION 8: DevFlow Visual Primitives */}
        <section className="space-y-4">
          <SectionHeader
            technicalLabel="DEVFLOW SPECIFIC PRIMITIVES"
            title="Terminal Lines & Health Indicators"
            description="Specialized visual primitives for terminal output streams and repository health evaluation."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Terminal Lines Stream */}
            <div className="p-4 rounded-lg bg-[#0a0e14] border border-[#222f43] space-y-1">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#182333] mb-2">
                <TechnicalLabel size="xs" colorVariant="emerald">
                  SIMULATED TERMINAL OUTPUT
                </TechnicalLabel>
                <span className="text-[10px] font-mono text-slate-500">READONLY PRIMITIVE</span>
              </div>
              <TerminalLine status="success" text="Cloned git repository github.com/owner/demo" duration="1.2s" />
              <TerminalLine status="success" text="Detected Node.js TypeScript project structure" duration="0.4s" />
              <TerminalLine status="success" text="Parsed 42 module export trees" duration="2.1s" />
              <TerminalLine status="active" text="Generating architecture dependency graph..." duration="In progress" />
              <TerminalLine status="pending" text="Calculating repository health score" />
            </div>

            {/* Health Indicators */}
            <div className="space-y-3">
              <HealthIndicator status="healthy" score={94} label="REPOSITIORY HEALTH: OPTIMAL" />
              <HealthIndicator status="warning" score={68} label="REPOSITIORY HEALTH: WARNING" />
              <HealthIndicator status="critical" score={32} label="REPOSITIORY HEALTH: CRITICAL" />
            </div>

          </div>
        </section>

        {/* SECTION 9: Loading Skeletons & Empty State */}
        <section className="space-y-4">
          <SectionHeader
            technicalLabel="FALLBACK STATES"
            title="Skeletons & Empty State UI"
            description="Presentational placeholder visuals for async states and zero-data screens."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Skeletons */}
            <div className="p-6 rounded-lg bg-[#111722] border border-[#222f43] space-y-4">
              <TechnicalLabel>Skeleton Placeholders</TechnicalLabel>
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="space-y-2 flex-1">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
              <Skeleton variant="rectangular" height={80} />
            </div>

            {/* Empty State */}
            <EmptyState
              title="No Repository Analyzed Yet"
              description="Provide a GitHub repository link in the search bar above to initiate architecture inspection."
              action={<Button variant="secondary">Browse Sample Repositories</Button>}
            />

          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-[#222f43] text-center text-xs text-slate-500 font-mono space-y-1">
          <p>DevFlow Design System Showcase • Task 2 Implementation Complete</p>
          <p className="text-[11px] text-slate-600">Visual foundation built with zero application or business logic.</p>
        </footer>

      </div>
    </div>
  );
}
