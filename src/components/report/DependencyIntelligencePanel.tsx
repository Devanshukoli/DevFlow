import React, { useState, useMemo } from 'react';
import { RepositoryDependency, DependencyType } from '@devflow/shared';
import { Layers, Search, FileCode, CheckCircle2, PackageCheck } from 'lucide-react';

export interface DependencyIntelligencePanelProps {
  dependencies?: RepositoryDependency[];
  dependencyCount?: number;
  productionDependencyCount?: number;
  developmentDependencyCount?: number;
  optionalDependencyCount?: number;
  peerDependencyCount?: number;
  dependencyManifests?: string[];
}

export const DependencyIntelligencePanel: React.FC<DependencyIntelligencePanelProps> = ({
  dependencies = [],
  dependencyCount = 0,
  productionDependencyCount = 0,
  developmentDependencyCount = 0,
  optionalDependencyCount = 0,
  peerDependencyCount = 0,
  dependencyManifests = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'production' | 'development' | 'other'>('all');
  const [showAll, setShowAll] = useState(false);

  // Group dependencies by manifest source for manifest panel counts
  const manifestCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const manifest of dependencyManifests) {
      counts[manifest] = 0;
    }
    for (const dep of dependencies) {
      if (dep.source) {
        counts[dep.source] = (counts[dep.source] || 0) + 1;
      }
    }
    return counts;
  }, [dependencyManifests, dependencies]);

  // Filter dependencies based on search and type filter
  const filteredDependencies = useMemo(() => {
    return dependencies.filter((dep) => {
      // Type filter check
      if (typeFilter === 'production' && dep.type !== 'production') return false;
      if (typeFilter === 'development' && dep.type !== 'development') return false;
      if (typeFilter === 'other' && dep.type !== 'optional' && dep.type !== 'peer') return false;

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = dep.name.toLowerCase().includes(query);
        const versionMatch = dep.version.toLowerCase().includes(query);
        const sourceMatch = dep.source.toLowerCase().includes(query);
        return nameMatch || versionMatch || sourceMatch;
      }

      return true;
    });
  }, [dependencies, searchQuery, typeFilter]);

  const visibleDependencies = showAll ? filteredDependencies : filteredDependencies.slice(0, 20);

  // Helper badge color
  const getTypeBadgeClass = (type: DependencyType) => {
    switch (type) {
      case 'production':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'development':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'peer':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'optional':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getTypeLabel = (type: DependencyType) => {
    switch (type) {
      case 'production':
        return 'Production';
      case 'development':
        return 'Development';
      case 'peer':
        return 'Peer';
      case 'optional':
        return 'Optional';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-[#101724] border border-[#1d2a3f] rounded-xl p-6 space-y-6 font-mono">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c283c] pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">DEPENDENCY INTELLIGENCE</h3>
            <p className="text-xs text-slate-400 font-sans">
              Deterministic manifest-based dependency extraction
            </p>
          </div>
        </div>

        {/* Summary Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-[#182335] text-slate-300 border border-[#273854]">
            <span className="font-bold text-white">{dependencyCount}</span> declarations
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <span className="font-bold">{productionDependencyCount}</span> production
          </span>
          <span className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <span className="font-bold">{developmentDependencyCount}</span> dev
          </span>
          {peerDependencyCount > 0 && (
            <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <span className="font-bold">{peerDependencyCount}</span> peer
            </span>
          )}
          {optionalDependencyCount > 0 && (
            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <span className="font-bold">{optionalDependencyCount}</span> optional
            </span>
          )}
        </div>
      </div>

      {/* Dependency Manifests Panel */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span>DEPENDENCY MANIFESTS ({dependencyManifests.length})</span>
        </h4>

        {dependencyManifests.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#0d131f] border border-[#1b2638] text-xs text-slate-400 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-slate-500" />
            <span>No dependency manifests detected.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {dependencyManifests.map((manifest) => (
              <div
                key={manifest}
                className="p-3 rounded-lg bg-[#0d131f] border border-[#1b2638] flex items-center justify-between gap-2"
              >
                <div className="truncate text-xs text-slate-200 font-medium" title={manifest}>
                  {manifest}
                </div>
                <div className="text-[11px] px-2 py-0.5 rounded bg-[#182335] text-slate-400 border border-[#253650] shrink-0">
                  {manifestCounts[manifest] ?? 0} deps
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      {dependencies.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dependencies..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0d131f] border border-[#1e2c42] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#0d131f] p-1 rounded-lg border border-[#1e2c42] text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                typeFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({dependencies.length})
            </button>
            <button
              onClick={() => setTypeFilter('production')}
              className={`px-2.5 py-1 rounded transition-colors ${
                typeFilter === 'production'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prod ({productionDependencyCount})
            </button>
            <button
              onClick={() => setTypeFilter('development')}
              className={`px-2.5 py-1 rounded transition-colors ${
                typeFilter === 'development'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dev ({developmentDependencyCount})
            </button>
            {(peerDependencyCount > 0 || optionalDependencyCount > 0) && (
              <button
                onClick={() => setTypeFilter('other')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  typeFilter === 'other'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Other ({peerDependencyCount + optionalDependencyCount})
              </button>
            )}
          </div>

        </div>
      )}

      {/* Dependency Inventory Table */}
      {dependencies.length === 0 ? (
        <div className="p-6 rounded-lg bg-[#0d131f] border border-[#1b2638] text-center text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">No dependencies declared.</p>
          <p className="text-slate-500">Manifests were discovered but do not declare external dependencies.</p>
        </div>
      ) : filteredDependencies.length === 0 ? (
        <div className="p-6 rounded-lg bg-[#0d131f] border border-[#1b2638] text-center text-xs text-slate-400">
          No dependencies matching filter "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-[#1e2c42] bg-[#0d131f]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#121a2a] text-slate-400 border-b border-[#1e2c42]">
                  <th className="py-2.5 px-4 font-semibold">Dependency</th>
                  <th className="py-2.5 px-4 font-semibold">Declared Version</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold">Source Manifest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182336] text-slate-300">
                {visibleDependencies.map((dep, index) => (
                  <tr key={`${dep.name}-${dep.source}-${index}`} className="hover:bg-[#121c2e] transition-colors">
                    <td className="py-2.5 px-4 font-bold text-white font-mono">{dep.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-300">{dep.version}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getTypeBadgeClass(
                          dep.type
                        )}`}
                      >
                        {getTypeLabel(dep.type)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] font-mono truncate max-w-[200px]" title={dep.source}>
                      {dep.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination / Show All toggle */}
          {filteredDependencies.length > 20 && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                Showing {visibleDependencies.length} of {filteredDependencies.length} dependencies
              </span>
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-3 py-1 rounded bg-[#182335] hover:bg-[#202f47] text-emerald-400 border border-[#2b3e5c] transition-colors font-medium"
              >
                {showAll ? 'Show top 20' : `Show all (${filteredDependencies.length})`}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
