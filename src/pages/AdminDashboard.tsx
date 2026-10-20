import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Mail,
  Send,
  Loader2,
  TrendingUp,
  BarChart2,
  PieChart,
} from 'lucide-react';
import { ServiceRequest, RequestStatus, RequestCategory, CATEGORIES } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon } from '../components/CategoryIcon';
import { exportRequestsToCSV } from '../utils/exportCsv';
import { useToast } from '../components/Toast';

interface AdminDashboardProps {
  requests: ServiceRequest[];
  loading: boolean;
  onSelectRequest: (req: ServiceRequest) => void;
  onUpdateStatus: (req: ServiceRequest, newStatus: RequestStatus, note?: string) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  requests,
  loading,
  onSelectRequest,
  onUpdateStatus,
}) => {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');

  // Quick update modal or inline note
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Email notification feedback simulation
  const [lastDispatchedEmail, setLastDispatchedEmail] = useState<{
    recipient: string;
    status: RequestStatus;
    category: string;
  } | null>(null);

  // Date filtering helper
  const now = new Date();
  const filtered = requests.filter((r) => {
    const matchesSearch =
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.userName && r.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;

    let matchesDate = true;
    const reqDate = new Date(r.createdAt);
    if (dateRange === 'TODAY') {
      matchesDate = reqDate.toDateString() === now.toDateString();
    } else if (dateRange === '7DAYS') {
      const diffTime = Math.abs(now.getTime() - reqDate.getTime());
      matchesDate = diffTime <= 7 * 24 * 60 * 60 * 1000;
    } else if (dateRange === '30DAYS') {
      const diffTime = Math.abs(now.getTime() - reqDate.getTime());
      matchesDate = diffTime <= 30 * 24 * 60 * 60 * 1000;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  // Analytics Metrics
  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'Pending').length;
  const inProgress = requests.filter((r) => r.status === 'In Progress').length;
  const resolved = requests.filter((r) => r.status === 'Resolved').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Category counts for visual breakdown
  const categoryCounts = CATEGORIES.map((cat) => {
    const count = requests.filter((r) => r.category === cat.label).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { ...cat, count, percentage };
  });

  const handleStatusChange = async (req: ServiceRequest, nextStatus: RequestStatus) => {
    setUpdatingId(req.id);
    try {
      await onUpdateStatus(req, nextStatus, req.adminNote);
      showToast(`Status updated to "${nextStatus}"`, 'success');

      // Trigger simulated email notification dispatch
      setLastDispatchedEmail({
        recipient: req.userEmail || 'citizen@miniecitizen.org',
        status: nextStatus,
        category: req.category,
      });

      // Auto dismiss email banner after 6 seconds
      setTimeout(() => {
        setLastDispatchedEmail(null);
      }, 6000);
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNote = async (req: ServiceRequest) => {
    setUpdatingId(req.id);
    try {
      await onUpdateStatus(req, req.status, tempNote);
      setEditingNoteId(null);
      showToast('Admin note saved', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save note', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExport = () => {
    exportRequestsToCSV(filtered, 'all_citizen_requests_admin');
    showToast('Exported filtered requests to CSV', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Email Dispatch Notification Banner */}
      {lastDispatchedEmail && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>Automatic Citizen Notification Dispatched</span>
              </p>
              <p className="text-sm font-semibold">
                Status update email sent to{' '}
                <span className="underline decoration-blue-400">{lastDispatchedEmail.recipient}</span> for{' '}
                <strong>{lastDispatchedEmail.category}</strong> (Marked as {lastDispatchedEmail.status})
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastDispatchedEmail(null)}
            className="text-xs text-blue-300 hover:text-white px-2 py-1 rounded-md"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Header with Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pipeline</span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{total}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Community tickets across city</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Pending Action
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-300 mt-1">{pending}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Needs triage or review</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/40 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Active in Field
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-300 mt-1">{inProgress}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Under investigation/repair</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Resolution Rate
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {resolutionRate}%
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{resolved} resolved tickets</p>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span>Requests by Community Category</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Real-time breakdown</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {categoryCounts.map((cat) => (
            <div
              key={cat.label}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{cat.label}</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {cat.count} ({cat.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Admin Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Controls Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search citizen, email, location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Filter selectors */}
          <div className="w-full lg:w-auto flex flex-wrap items-center gap-2">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Statuses ({total})</option>
              <option value="Pending">Pending ({pending})</option>
              <option value="In Progress">In Progress ({inProgress})</option>
              <option value="Resolved">Resolved ({resolved})</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Submitted Today</option>
              <option value="7DAYS">Past 7 Days</option>
              <option value="30DAYS">Past 30 Days</option>
            </select>

            {/* Export CSV */}
            <button
              onClick={handleExport}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV ({filtered.length})</span>
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4">Citizen</th>
                <th className="py-3 px-4">Issue Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Admin Note / Dispatch</th>
                <th className="py-3 px-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No citizen requests found matching the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Citizen Info */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        <span>{req.userName || 'Anonymous'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{req.userEmail || 'N/A'}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                        <CategoryIcon category={req.category} className="w-4 h-4 text-blue-600" />
                        <span>{req.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                        {req.description}
                      </p>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1 max-w-xs truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{req.location}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>

                    {/* Admin Note Inline Editor */}
                    <td className="py-3 px-4">
                      {editingNoteId === req.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            placeholder="Add resolution note..."
                            className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs w-48 text-slate-900 dark:text-slate-100"
                          />
                          <button
                            onClick={() => handleSaveNote(req)}
                            disabled={updatingId === req.id}
                            className="px-2 py-1 bg-blue-600 text-white rounded-md text-[11px] font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-md text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingNoteId(req.id);
                            setTempNote(req.adminNote || '');
                          }}
                          className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 hover:text-blue-600 group"
                          title="Click to edit admin note"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                          <span className="text-[11px] italic max-w-xs truncate">
                            {req.adminNote || 'Click to add note...'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actions: Status Dropdown & Detail Modal */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status switcher */}
                        <select
                          disabled={updatingId === req.id}
                          value={req.status}
                          onChange={(e) => handleStatusChange(req, e.target.value as RequestStatus)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>

                        <button
                          onClick={() => onSelectRequest(req)}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
