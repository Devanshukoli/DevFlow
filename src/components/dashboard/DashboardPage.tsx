import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRecentScans, fetchUserAnalysesFromServer, addOrUpdateRecentScan, RecentScan } from '../../utils/recentScans';
import { 
  GitFork, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Plus, 
  BarChart3, 
  Terminal, 
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { UserMenu } from '../auth/UserMenu';
import { ThemeToggle } from '../ui/ThemeToggle';

interface DashboardPageProps {
  onNavigateHome: () => void;
  onNavigateToSettings: () => void;
  onNavigateToNewAnalysis?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateHome,
  onNavigateToSettings,
  onNavigateToNewAnalysis,
}) => {
  const { user } = useAuth();
  const [recentAnalyses, setRecentAnalyses] = useState<RecentScan[]>([]);

  const handleStartNewAnalysis = () => {
    if (onNavigateToNewAnalysis) {
      onNavigateToNewAnalysis();
    } else {
      window.history.pushState({}, '', '/new-analysis');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (user) {
      const scans = getRecentScans(user.id || user.email);
      setRecentAnalyses(scans);

      fetchUserAnalysesFromServer().then((serverScans) => {
        if (isMounted && serverScans.length > 0) {
          setRecentAnalyses(serverScans);
          serverScans.forEach((scan) => {
            addOrUpdateRecentScan(
              {
                id: scan.id,
                url: scan.url,
                name: scan.name,
                status: scan.status,
                languages: scan.languages,
                date: scan.date,
              },
              user.id || user.email
            );
          });
        }
      });
    } else {
      setRecentAnalyses([]);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0b0f17]/80 backdrop-blur-md border-b border-[#222f43]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">DevFlow</span>
              <Badge variant="success" size="sm" isMonospace>
                Dashboard
              </Badge>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStartNewAnalysis}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Analysis
            </Button>
            <ThemeToggle />
            <UserMenu
              onNavigateToDashboard={() => {}}
              onNavigateToSettings={onNavigateToSettings}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Hero Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-100 to-emerald-500/5 dark:from-[#111927] dark:via-[#142033] dark:to-[#0e1624] bg-white dark:bg-[#111927] border border-emerald-500/20 dark:border-[#202f47] p-6 sm:p-8 overflow-hidden shadow-sm dark:shadow-2xl">
          <div className="absolute top-0 right-0 p-8 text-emerald-500/10 pointer-events-none">
            <Sparkles className="w-32 h-32" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Authenticated Session Active
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name || 'Developer'}!
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm max-w-2xl leading-relaxed">
              Your DevFlow dashboard provides real-time access to repository knowledge maps, FalkorDB graph structures, and AI-grounded codebase intelligence.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleStartNewAnalysis}
                leftIcon={<GitFork className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                id="dashboard-start-analysis-btn"
              >
                Analyze GitHub Repository
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={onNavigateToSettings}
              >
                Manage Account
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#0e1420] border border-[#202d42] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Account Status</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white">Active Member</p>
            <p className="text-[11px] text-slate-400 font-mono">Persisted via Supabase cookie</p>
          </div>

          <div className="p-5 rounded-xl bg-[#0e1420] border border-[#202d42] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Password Security</span>
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-emerald-400 font-mono">Custom SHA-256</p>
            <p className="text-[11px] text-slate-400 font-mono">Web Crypto API digest</p>
          </div>

          <div className="p-5 rounded-xl bg-[#0e1420] border border-[#202d42] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Graph Storage</span>
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white">FalkorDB + Supabase</p>
            <p className="text-[11px] text-slate-400 font-mono">Real-time knowledge graph</p>
          </div>
        </div>

        {/* Recent Analyses Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Recent Repository Analyses</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={handleStartNewAnalysis}>
              New Scan
            </Button>
          </div>

          {recentAnalyses.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0e1420] border border-[#1f2d42] text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No Recent Analyses</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You haven't analyzed any repositories yet. Submit a GitHub repository URL to view real-time architecture, graphs, and codebase intelligence.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartNewAnalysis}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Start First Analysis
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentAnalyses.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => {
                    if (repo.status === 'completed') {
                      window.history.pushState({}, '', `/analysis/${repo.id}/result`);
                    } else {
                      window.history.pushState({}, '', `/analysis/${repo.id}`);
                    }
                    window.dispatchEvent(new Event('popstate'));
                  }}
                  className="p-5 rounded-xl bg-[#0e1420] border border-[#1f2d42] hover:border-emerald-500/40 transition-all space-y-3 group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        <span>{repo.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{repo.date}</p>
                    </div>
                    <Badge
                      variant={repo.status === 'completed' ? 'success' : repo.status === 'failed' ? 'danger' : 'info'}
                      size="sm"
                    >
                      {repo.status}
                    </Badge>
                  </div>

                  {repo.languages && repo.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {repo.languages.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-0.5 rounded bg-[#141f30] border border-[#203048] text-[11px] font-mono text-slate-300"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
};
