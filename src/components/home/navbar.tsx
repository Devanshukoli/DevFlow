import React from 'react';
import { Layers, Github, FileText, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { UserMenu } from '../auth/UserMenu';

export interface NavbarProps {
  onToggleDesignSystem?: () => void;
  showDesignSystem?: boolean;
  onNavigateToDashboard?: () => void;
  onNavigateToSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleDesignSystem,
  showDesignSystem = false,
  onNavigateToDashboard,
  onNavigateToSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0f17]/80 backdrop-blur-md border-b border-[#222f43]/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <a href="/" className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 rounded-md p-1">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base tracking-tight font-sans">DevFlow</span>
            <Badge variant="neutral" size="sm" isMonospace>
              v0.1.0
            </Badge>
          </div>
        </a>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-3">
          <a
            href="https://github.com/devanshukoli/devflow"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors px-2.5 py-1.5 rounded-md hover:bg-[#17202e]"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          {onToggleDesignSystem && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleDesignSystem}
              leftIcon={<LayoutGrid className="w-3.5 h-3.5" />}
            >
              {showDesignSystem ? 'View Homepage' : 'Design System'}
            </Button>
          )}

          <UserMenu
            onNavigateToDashboard={onNavigateToDashboard}
            onNavigateToSettings={onNavigateToSettings}
          />
        </nav>

      </div>
    </header>
  );
};
