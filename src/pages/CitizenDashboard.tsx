import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  PlusCircle,
  Search,
  Filter,
  MapPin,
  Calendar,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ServiceRequest, RequestStatus, RequestCategory, CATEGORIES } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryIcon } from '../components/CategoryIcon';
import { useAuth } from '../context/AuthContext';

interface CitizenDashboardProps {
  requests: ServiceRequest[];
  loading: boolean;
  onOpenNewModal: () => void;
  onSelectRequest: (req: ServiceRequest) => void;
  onViewAllRequests: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  requests,
  loading,
  onOpenNewModal,
  onSelectRequest,
  onViewAllRequests,
}) => {
  const { profile } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Metrics
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const inProgressCount = requests.filter((r) => r.status === 'In Progress').length;
  const resolvedCount = requests.filter((r) => r.status === 'Resolved').length;

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || req.status === selectedStatus;
    const matchesCategory = selectedCategory === 'ALL' || req.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a1128] via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Service Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.name || 'Citizen'}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Report public infrastructure concerns directly to local authorities and track real-time resolution progress.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onOpenNewModal}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Service Request</span>
            </button>
            <button
              onClick={onViewAllRequests}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>View All ({totalCount})</span>
            </button>
          </div>
        </div>

        {/* Ambient background accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Requests</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Filed by your account</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Pending */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending</p>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-300 mt-1">{pendingCount}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Awaiting city review</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* In Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">In Progress</p>
            <h3 className="text-2xl sm:text-3xl font-black text-blue-800 dark:text-blue-300 mt-1">{inProgressCount}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Field crew dispatched</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900">
            <Loader2 className="w-6 h-6" />
          </div>
        </div>

        {/* Resolved */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Resolved</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
              {resolvedCount}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Fixed & verified</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Area: Search & Request List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-6 space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by issue, street, location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Loading your requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No service requests found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {requests.length === 0
                ? "You haven't reported any community issues yet. Click below to submit your first report!"
                : 'No requests match your search or filter criteria.'}
            </p>
            {requests.length === 0 && (
              <button
                onClick={onOpenNewModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit First Request</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className="group py-4 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                    <CategoryIcon category={req.category} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {req.category}
                      </h4>
                      <StatusBadge status={req.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                      {req.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="truncate max-w-[200px]">{req.location}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
