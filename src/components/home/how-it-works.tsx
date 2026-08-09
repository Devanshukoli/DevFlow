import React from 'react';
import { SectionHeader } from '../devflow/section-header';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { TechnicalLabel } from '../devflow/technical-label';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      label: 'PASTE',
      title: 'Provide Repository',
      description: 'Paste any public GitHub repository URL into the analysis input.',
    },
    {
      step: '02',
      label: 'ANALYZE',
      title: 'Automated Inspection',
      description: 'DevFlow parses AST trees, imports, dependencies, and API definitions.',
    },
    {
      step: '03',
      label: 'UNDERSTAND',
      title: 'Explore Architecture',
      description: 'Receive real-time health reports, dependency maps, and structural summaries.',
    },
  ];

  return (
    <section className="py-12 space-y-6">
      <SectionHeader
        technicalLabel="WORKFLOW"
        title="How DevFlow Works"
        description="Three simple steps from repository URL to deep engineering understanding."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((item, idx) => (
          <Card key={idx} variant="default" className="relative overflow-hidden">
            <CardHeader className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xl font-extrabold text-emerald-400">
                  {item.step}
                </span>
                <TechnicalLabel size="xs" colorVariant="emerald">
                  {item.label}
                </TechnicalLabel>
              </div>
              <CardTitle className="text-base font-bold text-white">
                {item.title}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 font-sans leading-relaxed">
                {item.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
};
