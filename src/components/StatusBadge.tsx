import React from 'react';
import { RequestStatus } from '../types';
import { Clock, Loader2, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const config = {
    Pending: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      icon: Clock,
      label: 'Pending',
      dot: 'bg-amber-500',
    },
    'In Progress': {
      bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      icon: Loader2,
      label: 'In Progress',
      dot: 'bg-blue-500',
    },
    Resolved: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      icon: CheckCircle2,
      label: 'Resolved',
      dot: 'bg-emerald-500',
    },
  }[status] || {
    bg: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: Clock,
    label: status,
    dot: 'bg-slate-400',
  };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs transition-colors ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'In Progress' ? 'animate-pulse' : ''}`} />
      <IconComponent className={`w-3.5 h-3.5 ${status === 'In Progress' ? 'animate-spin' : ''}`} />
      <span>{config.label}</span>
    </span>
  );
};
