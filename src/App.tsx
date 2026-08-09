import React, { useState } from 'react';
import { HomePage } from './components/home/HomePage';
import { DesignSystem } from './components/DesignSystem';

export default function App() {
  const [showDesignSystem, setShowDesignSystem] = useState(false);

  return (
    <>
      {showDesignSystem ? (
        <div>
          <div className="bg-[#111722] border-b border-[#222f43] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold">DEVFLOW DESIGN SYSTEM SHOWCASE</span>
            <button
              onClick={() => setShowDesignSystem(false)}
              className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
            >
              ← Back to Homepage
            </button>
          </div>
          <DesignSystem />
        </div>
      ) : (
        <HomePage
          onToggleDesignSystem={() => setShowDesignSystem(true)}
          showDesignSystem={showDesignSystem}
        />
      )}
    </>
  );
}
