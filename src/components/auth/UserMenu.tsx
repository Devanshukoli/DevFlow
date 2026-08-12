import React, { useState, useRef, useEffect } from 'react';
import { LogIn, LogOut, LayoutDashboard, Settings, User as UserIcon, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';

interface UserMenuProps {
  onNavigateToDashboard?: () => void;
  onNavigateToSettings?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onNavigateToDashboard,
  onNavigateToSettings,
}) => {
  const { user, isAuthenticated, openAuthModal, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => openAuthModal('signin')}
        leftIcon={<LogIn className="w-3.5 h-3.5" />}
        id="header-sign-in-btn"
      >
        Sign In
      </Button>
    );
  }

  const handleDashboardClick = () => {
    setIsOpen(false);
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else {
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleSettingsClick = () => {
    setIsOpen(false);
    if (onNavigateToSettings) {
      onNavigateToSettings();
    } else {
      window.history.pushState({}, '', '/settings');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleSignOutClick = async () => {
    setIsOpen(false);
    await signOut();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl bg-[#121927] border border-[#202c3e] hover:border-emerald-500/50 hover:bg-[#182335] transition-all text-left group"
        id="user-avatar-menu-btn"
        aria-label="User account menu"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-7 h-7 rounded-lg object-cover bg-slate-800 border border-slate-700"
        />
        <span className="hidden sm:inline-block text-xs font-medium text-slate-200 max-w-[100px] truncate">
          {user.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#0e1420] border border-[#222f43] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* User info header */}
          <div className="px-3.5 py-2.5 border-b border-[#1c283a]">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="p-1 space-y-0.5">
            <button
              onClick={handleDashboardClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#182436] rounded-lg transition-colors text-left"
              id="user-menu-dashboard"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={handleSettingsClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#182436] rounded-lg transition-colors text-left"
              id="user-menu-settings"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Account Settings</span>
            </button>

            <button
              onClick={() => {
                toggleTheme();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#182436] rounded-lg transition-colors text-left"
              id="user-menu-theme-toggle"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-400" />
                  <span>Dark Theme</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-[#1c283a]" />

          <div className="p-1">
            <button
              onClick={handleSignOutClick}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
              id="user-menu-signout"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
