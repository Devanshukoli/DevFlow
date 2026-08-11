import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  KeyRound, 
  LogOut, 
  Layers, 
  ArrowLeft, 
  CheckCircle2,
  Database
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { UserMenu } from '../auth/UserMenu';

interface SettingsPageProps {
  onNavigateHome: () => void;
  onNavigateToDashboard: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onNavigateHome,
  onNavigateToDashboard,
}) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onNavigateHome();
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#0b0f17]/80 backdrop-blur-md border-b border-[#222f43]/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToDashboard}
              className="p-2 rounded-lg bg-[#141c2b] border border-[#222f43] text-slate-400 hover:text-white hover:bg-[#1a2538] transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">DevFlow Settings</span>
              <Badge variant="neutral" size="sm" isMonospace>
                Security
              </Badge>
            </div>
          </div>

          <UserMenu
            onNavigateToDashboard={onNavigateToDashboard}
            onNavigateToSettings={() => {}}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Profile Card */}
        <div className="bg-[#0e1420] border border-[#202d42] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1c283a] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Account Overview</h2>
                <p className="text-xs text-slate-400">Personal details and session info</p>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Verified
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 object-cover shadow-lg"
            />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">{user?.name}</h3>
              <p className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user?.email}
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                Member ID: {user?.id}
              </p>
            </div>
          </div>
        </div>

        {/* Security & Custom Hashing Details */}
        <div className="bg-[#0e1420] border border-[#202d42] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-[#1c283a] pb-4">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Password Security & Hashing</h2>
              <p className="text-xs text-slate-400">Future-proof credential protection architecture</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#121a28] border border-[#1f2d42] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Custom SHA-256 Digest
              </div>
              <p className="text-xs text-slate-300">
                Passwords are salted and hashed using standard Web Crypto SHA-256 before verification.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#121a28] border border-[#1f2d42] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                <Database className="w-4 h-4" />
                Supabase Session Cookie
              </div>
              <p className="text-xs text-slate-300">
                Authenticated session tokens are stored in secure HTTP-only cookies and synced across app restarts.
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out Card */}
        <div className="bg-[#0e1420] border border-[#202d42] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Sign Out of DevFlow</h3>
            <p className="text-xs text-slate-400">End your current authenticated session on this device</p>
          </div>
          <Button
            variant="destructive"
            size="md"
            onClick={handleSignOut}
            leftIcon={<LogOut className="w-4 h-4" />}
            id="settings-signout-btn"
          >
            Sign Out
          </Button>
        </div>

      </main>

    </div>
  );
};
