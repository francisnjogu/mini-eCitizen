import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { ServiceRequest, CATEGORIES } from '../types';
import { exportRequestsToCSV } from '../utils/exportCsv';
import { useToast } from '../components/Toast';

interface AnalyticsPageProps {
  requests: ServiceRequest[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ requests }) => {
  const { showToast } = useToast();
  const [timeframe, setTimeframe] = useState<'30days' | '90days' | 'all'>('all');

  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'Pending').length;
  const inProgress = requests.filter((r) => r.status === 'In Progress').length;
  const resolved = requests.filter((r) => r.status === 'Resolved').length;
  const resolutionPercentage = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Breakdown by category
  const categoryStats = CATEGORIES.map((cat) => {
    const catRequests = requests.filter((r) => r.category === cat.label);
    const catTotal = catRequests.length;
    const catResolved = catRequests.filter((r) => r.status === 'Resolved').length;
    const catPending = catRequests.filter((r) => r.status === 'Pending').length;
    const catRate = catTotal > 0 ? Math.round((catResolved / catTotal) * 100) : 0;
    return {
      category: cat.label,
      total: catTotal,
      resolved: catResolved,
      pending: catPending,
      rate: catRate,
    };
  }).sort((a, b) => b.total - a.total);

  const handleExport = () => {
    exportRequestsToCSV(requests, 'ecitizen_civic_analytics_data');
    showToast('Analytics summary exported as CSV', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Municipal Performance Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time public service resolution indices and community category breakdown
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inflow</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{total}</h3>
          <p className="text-xs text-slate-500 mt-1">Total issues logged into system</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Resolved Cases
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-2">{resolved}</h3>
          <p className="text-xs text-slate-500 mt-1">{resolutionPercentage}% overall completion rate</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Active in Work
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-2">{inProgress}</h3>
          <p className="text-xs text-slate-500 mt-1">Field engineers assigned</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Queue
            </span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-2">{pending}</h3>
          <p className="text-xs text-slate-500 mt-1">Awaiting dispatch review</p>
        </div>
      </div>

      {/* Visual Resolution Ratio Gauge & Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">
              Resolution Efficiency
            </h3>
            <p className="text-xs text-slate-500 mb-4">Proportion of closed citizen requests</p>

            <div className="my-6 text-center">
              <div className="inline-flex items-baseline gap-1 text-5xl font-black text-emerald-600 dark:text-emerald-400">
                <span>{resolutionPercentage}</span>
                <span className="text-2xl font-bold">%</span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                {resolved} of {total} requests resolved
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Resolved:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{resolved}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                In Progress:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{inProgress}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Pending:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{pending}</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">
            Department Performance By Category
          </h3>
          <p className="text-xs text-slate-500 mb-4">Volume and closure percentage</p>

          <div className="space-y-4">
            {categoryStats.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.category}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-white">{item.total}</strong> total • {item.rate}% resolved
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${item.total > 0 ? (item.resolved / item.total) * 100 : 0}%` }}
                    title={`Resolved: ${item.resolved}`}
                  />
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${item.total > 0 ? (item.total - item.resolved - item.pending) / item.total * 100 : 0}%` }}
                    title={`In Progress`}
                  />
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${item.total > 0 ? (item.pending / item.total) * 100 : 0}%` }}
                    title={`Pending: ${item.pending}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
