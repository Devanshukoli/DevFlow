import React from 'react';
import { Navbar } from './navbar';
import { Hero } from './hero';
import { CapabilityGrid } from './capability-grid';
import { ProductPreview } from './product-preview';
import { HowItWorks } from './how-it-works';
import { Footer } from './footer';

export interface HomePageProps {
  onNavigateToDashboard?: () => void;
  onNavigateToSettings?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToDashboard,
  onNavigateToSettings,
}) => {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-400 flex flex-col justify-between">
      <div>
        <Navbar
          onNavigateToDashboard={onNavigateToDashboard}
          onNavigateToSettings={onNavigateToSettings}
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 py-8">
          <Hero />
          <CapabilityGrid />
          <ProductPreview />
          <HowItWorks />
        </main>
      </div>

      <Footer />
    </div>
  );
};
