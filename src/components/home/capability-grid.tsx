import React from 'react';
import { Layers, Box, Globe, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { TechnicalLabel } from '../devflow/technical-label';
import { SectionHeader } from '../devflow/section-header';

export const CapabilityGrid: React.FC = () => {
  const capabilities = [
    {
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      label: 'ARCHITECTURE',
      title: 'Structural AST Mapping',
      description: 'Understand module boundaries, core file structures, and code component relationships.',
    },
    {
      icon: <Box className="w-4 h-4 text-emerald-400" />,
      label: 'DEPENDENCIES',
      title: 'Package Hierarchy',
      description: 'See direct and transitive package trees, framework usages, and version locks.',
    },
    {
      icon: <Globe className="w-4 h-4 text-emerald-400" />,
      label: 'APIS & ROUTES',
      title: 'Interface Boundaries',
      description: 'Discover HTTP API routes, exported methods, RPC endpoints, and schema declarations.',
    },
    {
      icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
      label: 'HEALTH & RISKS',
      title: 'Engineering Audit',
      description: 'Identify technical debt, security warnings, maintainability signals, and health metrics.',
    },
  ];

  return (
    <section className="py-12 space-y-6">
      <SectionHeader
        technicalLabel="CORE CAPABILITIES"
        title="Deep Repository Analysis"
        description="DevFlow parses codebases to deliver automated architectural intelligence."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {capabilities.map((cap, idx) => (
          <Card key={idx} variant="default" className="flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <TechnicalLabel size="xs" colorVariant="emerald">
                  {cap.label}
                </TechnicalLabel>
                <div className="p-1.5 rounded bg-[#17202e] border border-[#222f43]">
                  {cap.icon}
                </div>
              </div>
              <CardTitle className="text-sm font-semibold text-white">
                {cap.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <CardDescription className="text-xs text-slate-400 leading-relaxed font-sans">
                {cap.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
