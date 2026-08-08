import React, { useState } from 'react';
import { Search, Sun, Moon, Plus, Code2, Menu, X, Sparkles, User as UserIcon } from 'lucide-react';
import { ActiveTab, User } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onOpenAskModal: () => void;
  currentUser: User;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  isDarkMode,
  setIsDarkMode,
  onOpenAskModal,
  currentUser,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            aria-label="Toggle navigation menu"
            id="mobile-menu-toggle-btn"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 text-left group"
            id="brand-logo-btn"
          >
            <div className="p-2 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 dark:from-orange-400 dark:via-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                DevFlow
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50">
                v2.4
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Input */}
        <div className="flex-1 max-w-xl mx-2 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions, tags, topics, developers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              id="global-search-input"
            />
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            id="theme-toggle-btn"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Ask Question Button */}
          <button
            onClick={onOpenAskModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all"
            id="ask-question-header-btn"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Ask Question</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`p-0.5 rounded-full border-2 transition-all ${
              activeTab === 'profile'
                ? 'border-orange-500 ring-2 ring-orange-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-orange-400'
            }`}
            title="View Profile"
            id="user-avatar-btn"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search DevFlow..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            id="mobile-search-input"
          />
        </div>
      </div>
    </header>
  );
};
