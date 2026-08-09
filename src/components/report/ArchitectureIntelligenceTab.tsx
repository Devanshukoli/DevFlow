import React, { useState } from 'react';
import {
  RepositoryArchitecture,
  ArchitectureTreeNode,
  ArchitectureDirectory,
  ArchitectureSignal,
  ArchitectureEntryPoint,
  ArchitectureWorkspace
} from '@devflow/shared';
import { motion } from 'motion/react';
import {
  Folder,
  FolderOpen,
  FileCode,
  Terminal,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Cpu,
  Boxes,
  Compass,
  Zap,
  Info
} from 'lucide-react';

interface ArchitectureIntelligenceTabProps {
  architecture: RepositoryArchitecture;
}

export const ArchitectureIntelligenceTab: React.FC<ArchitectureIntelligenceTabProps> = ({
  architecture
}) => {
  const {
    tree = [],
    importantDirectories = [],
    entryPoints = [],
    signals = [],
    workspaceBoundaries = [],
    apiBoundaries = []
  } = architecture;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overview section */}
      <div className="p-6 rounded-xl bg-[#101724] border border-[#1d2a3f] flex items-start gap-4">
        <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white tracking-tight">ARCHITECTURE INTELLIGENCE</h3>
          <p className="text-sm text-slate-400 font-sans leading-relaxed">
            Deterministic analysis of repository layout, directory roles, application boundaries, and architectural design signals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Repository Structure Tree */}
        <div className="lg:col-span-1 p-6 rounded-xl bg-[#101724] border border-[#1d2a3f] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#1c2738]">
            <Compass className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Repository Structure</h4>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Interactive bounded codebase tree. Click directories to expand or collapse.
          </p>
          <div className="p-2 rounded-lg bg-[#0b0f17] border border-[#192437] max-h-[500px] overflow-y-auto custom-scrollbar">
            {tree.length > 0 ? (
              tree.map((node, index) => (
                <TreeNodeComponent key={`${node.path}-${index}`} node={node} depth={0} />
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs font-mono">
                No structure tree available
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Signals, Entry Points, Directories, Workspace, APIs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Architectural Signals */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1c2738]">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Observed Architecture Signals</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {signals.length > 0 ? (
                signals.map((signal, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-[#121927] border border-[#1d2a3f] flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-bold tracking-tight text-slate-100">{signal.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        {signal.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-6 rounded-xl bg-[#121927] border border-[#1d2a3f] text-center text-slate-500 text-xs font-sans">
                  No explicit architectural signals detected.
                </div>
              )}
            </div>
          </div>

          {/* Important Directories & Entry Points Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Entry Points Card */}
            <div className="p-6 rounded-xl bg-[#101724] border border-[#1d2a3f] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1c2738]">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Entry Points</h4>
              </div>
              <div className="space-y-3">
                {entryPoints.length > 0 ? (
                  entryPoints.map((ep, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#0b0f17] border border-[#192437] flex items-start gap-3">
                      {ep.type === 'file' ? (
                        <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Terminal className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <span className="text-xs font-mono text-slate-200 block break-all">{ep.path}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                            ep.type === 'file' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {ep.type}
                          </span>
                          {ep.description && (
                            <span className="text-[10px] text-slate-500 font-sans">{ep.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-xs font-sans">
                    No application entry points found.
                  </div>
                )}
              </div>
            </div>

            {/* API Surface boundaries */}
            <div className="p-6 rounded-xl bg-[#101724] border border-[#1d2a3f] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1c2738]">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">API Surface & Routing</h4>
              </div>
              <div className="space-y-3">
                {apiBoundaries.length > 0 ? (
                  apiBoundaries.map((api, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#0b0f17] border border-[#192437] flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-200">{api}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                        Active Boundary
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-xs font-sans">
                    No active API boundaries observed.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Important Directories List */}
          <div className="p-6 rounded-xl bg-[#101724] border border-[#1d2a3f] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1c2738]">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Classified Directories</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#192437] text-slate-400">
                    <th className="pb-2 font-semibold">Directory Path</th>
                    <th className="pb-2 font-semibold">Classification Role</th>
                    <th className="pb-2 font-semibold text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#192437]">
                  {importantDirectories.length > 0 ? (
                    importantDirectories.map((dir, idx) => (
                      <tr key={idx} className="hover:bg-slate-500/5">
                        <td className="py-2.5 text-slate-200">{dir.path}</td>
                        <td className="py-2.5 text-emerald-400 font-sans">{dir.classification}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                            dir.confidence === 'high'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : dir.confidence === 'medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {dir.confidence}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-500 font-sans">
                        No classified structural directories found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workspace Boundaries List (Only if monorepo) */}
          {workspaceBoundaries.length > 0 && (
            <div className="p-6 rounded-xl bg-[#101724] border border-[#1d2a3f] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#1c2738]">
                <Boxes className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Workspace boundaries</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaceBoundaries.map((ws, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#121927] border border-[#1c2738] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white tracking-tight">{ws.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                        ws.type === 'frontend'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : ws.type === 'backend'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : ws.type === 'library'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {ws.type}
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[10px] text-slate-400">
                      <div><span className="text-slate-500">Path:</span> <span className="text-slate-300">{ws.path}</span></div>
                      {ws.detectedLanguage && (
                        <div><span className="text-slate-500">Language:</span> <span className="text-emerald-400">{ws.detectedLanguage}</span></div>
                      )}
                      {ws.detectedFramework && (
                        <div><span className="text-slate-500">Framework:</span> <span className="text-emerald-400">{ws.detectedFramework}</span></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* Recursive Tree Node rendering with Framer Motion */
interface TreeNodeComponentProps {
  node: ArchitectureTreeNode;
  depth: number;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ node, depth }) => {
  const [isOpen, setIsOpen] = useState(depth < 2); // default open top levels
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <motion.div
        whileHover={{ x: 2, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors text-xs font-mono ${
          node.type === 'directory' ? 'text-slate-200' : 'text-slate-400'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.type === 'directory' ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-emerald-400/80 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-emerald-400/80 flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <FileCode className="w-4 h-4 text-slate-500 flex-shrink-0" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </motion.div>

      {hasChildren && isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden border-l border-slate-800 ml-3.5"
        >
          {node.children!.map((child, i) => (
            <TreeNodeComponent key={`${child.path}-${i}`} node={child} depth={depth + 1} />
          ))}
        </motion.div>
      )}
    </div>
  );
};
