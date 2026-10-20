import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  User,
  ShieldCheck,
  LogOut,
  Building2,
  BarChart3,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'dashboard' | 'new-request' | 'my-requests' | 'admin-requests' | 'analytics' | 'profile';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenNewModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  onOpenNewModal,
}) => {
  const { profile, user, isAdmin, logout } = useAuth();

  const handleNav = (tab: NavTab) => {
    if (tab === 'new-request') {
      onOpenNewModal();
    } else {
      onSelectTab(tab);
    }
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Deep Dark Navy styling */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0a1128] text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/30 ring-1 ring-white/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">mini eCitizen</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Public Service Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Report Action */}
        <div className="p-4">
          <button
            onClick={() => handleNav('new-request')}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-900/40 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Request</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Citizen Services
          </div>

          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleNav('my-requests')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'my-requests'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Requests</span>
          </button>

          <button
            onClick={() => handleNav('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentTab === 'profile'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>

          {/* Admin Management Navigation (Only visible/accessible to Admin) */}
          {isAdmin && (
            <div className="pt-4 space-y-1">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center justify-between">
                <span>Admin Console</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>

              <button
                onClick={() => handleNav('admin-requests')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'admin-requests'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>All Citizen Requests</span>
              </button>

              <button
                onClick={() => handleNav('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'analytics'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Analytics & Reports</span>
              </button>
            </div>
          )}
        </nav>

        {/* Footer controls: Dark mode & User profile */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {/* Theme switcher */}
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800/70 transition-colors"
          >
            <span className="flex items-center gap-2">
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {darkMode ? 'DARK' : 'LIGHT'}
            </span>
          </button>

          {/* User profile card */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-700/60 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(profile?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{profile?.name || 'Citizen'}</p>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isAdmin ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 font-medium truncate capitalize">
                    {isAdmin ? 'Administrator' : 'Citizen'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out"
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
