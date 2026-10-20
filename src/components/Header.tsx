import React, { useState } from 'react';
import { Menu, Plus, Bell, Shield, User, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from './Sidebar';
import { ServiceRequest } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  onOpenSidebar: () => void;
  onOpenNewModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  recentRequests?: ServiceRequest[];
  onSelectRequest?: (req: ServiceRequest) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenSidebar,
  onOpenNewModal,
  darkMode,
  onToggleDarkMode,
  recentRequests = [],
  onSelectRequest,
}) => {
  const { profile, isAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Citizen Dashboard', subtitle: 'Overview of your municipal service requests and updates' };
      case 'my-requests':
        return { title: 'My Service Requests', subtitle: 'Track and manage your submitted community reports' };
      case 'admin-requests':
        return { title: 'Admin Command Center', subtitle: 'Review, assign, and resolve community requests' };
      case 'analytics':
        return { title: 'Civic Analytics', subtitle: 'System performance, resolution turnaround, and metrics' };
      case 'profile':
        return { title: 'Account Settings', subtitle: 'Manage your personal details and security' };
      default:
        return { title: 'mini eCitizen', subtitle: 'Public Service Portal' };
    }
  };

  const { title, subtitle } = getTitle();

  // Filter recently updated requests (in progress or resolved)
  const notifications = recentRequests
    .filter((r) => r.status !== 'Pending')
    .slice(0, 5);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
              {isAdmin && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Admin
                </span>
              )}
            </div>
            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Request Button */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Request</span>
            <span className="sm:hidden">Report</span>
          </button>

          {/* Dark Mode Quick Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Notifications
                  </span>
                  <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    {notifications.length} recent
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      No new status notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setShowNotifications(false);
                          if (onSelectRequest) onSelectRequest(n);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-2.5"
                      >
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            n.status === 'Resolved' ? 'text-emerald-500' : 'text-blue-500'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {n.category} status updated
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            Marked as <strong className="text-slate-700 dark:text-slate-300">{n.status}</strong>
                          </p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {new Date(n.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Icon indicator */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {profile?.name || 'Citizen'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                {isAdmin ? 'Admin' : 'Citizen'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
