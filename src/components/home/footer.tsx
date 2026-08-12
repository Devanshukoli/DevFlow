import React from 'react';
import { Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-[#222f43] bg-[#0b0f17] py-12 text-slate-400 font-sans text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-white text-sm tracking-tight">DevFlow</span>
            </div>
            <p className="text-slate-500 max-w-sm text-[12px] leading-relaxed">
              Developer-focused repository intelligence. Understand architecture, dependencies, APIs, and health.
            </p>
          </div>

          {/* Right Links */}
          <div className="flex items-center gap-6 font-mono text-xs">
            <a href="https://github.com/devanshukoli/devflow" target="_blank" rel="noreferrer" className="hover:text-slate-200 transition-colors">
              GitHub
            </a>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
              Privacy
            </a>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-200 transition-colors">
              Terms
            </a>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 border-t border-[#182333] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
          <p>© {new Date().getFullYear()} DevFlow. All rights reserved.</p>
          <p>Built for developer tooling & infrastructure transparency.</p>
        </div>

      </div>
    </footer>
  );
};
