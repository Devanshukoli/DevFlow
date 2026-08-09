import React from 'react';
import { Terminal, Shield, Sparkles } from 'lucide-react';
import { TechnicalLabel } from '../devflow/technical-label';
import { RepositoryInput } from './repository-input';

export interface HeroProps {
  onSubmitUrl?: (url: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSubmitUrl }) => {
  return (
    <section className="py-12 sm:py-20 text-center space-y-8 max-w-4xl mx-auto px-4">
      
      {/* Eyebrow Label */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17202e] border border-[#222f43]">
        <TechnicalLabel colorVariant="emerald" icon={<Terminal className="w-3.5 h-3.5" />}>
          REPOSITORY INTELLIGENCE PLATFORM
        </TechnicalLabel>
      </div>

      {/* Hero Headline */}
      <div className="space-y-4">
        <h1 className="text-display sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Understand any codebase.
        </h1>
        <p className="text-base sm:text-lg text-slate-400 font-sans max-w-2xl mx-auto leading-relaxed">
          Paste a GitHub repository and DevFlow maps its structure, dependencies, APIs, and engineering health.
        </p>
      </div>

      {/* Main Input Component */}
      <div className="pt-2">
        <RepositoryInput onSubmitUrl={onSubmitUrl} />
      </div>

      {/* Minimal Feature Micro-Trust Line */}
      <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>AST Architecture Parser</span>
        </div>
        <span className="text-[#222f43]">•</span>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          <span>Dependency Graph</span>
        </div>
        <span className="text-[#222f43]">•</span>
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-slate-400" />
          <span>Health Risk Audit</span>
        </div>
      </div>

    </section>
  );
};
