import React, { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  Mail,
  Edit3,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Shield,
  MessageSquare,
  Copy,
  Check,
  AlertTriangle,
  Image as ImageIcon,
} from 'lucide-react';
import { ServiceRequest, RequestStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface RequestDetailModalProps {
  request: ServiceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (req: ServiceRequest) => void;
  onDelete: (req: ServiceRequest) => void;
  onUpdateStatus?: (req: ServiceRequest, newStatus: RequestStatus, note?: string) => Promise<void>;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
}) => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [copied, setCopied] = useState(false);
  const [adminNoteText, setAdminNoteText] = useState(request?.adminNote || '');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !request) return null;

  const isOwner = user?.uid === request.userId;
  const isPending = request.status === 'Pending';

  const copyId = () => {
    navigator.clipboard.writeText(request.id);
    setCopied(true);
    showToast('Request ID copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdminStatusChange = async (newStatus: RequestStatus) => {
    if (!onUpdateStatus) return;
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(request, newStatus, adminNoteText);
      showToast(`Request status updated to "${newStatus}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Timeline Steps
  const getTimelineSteps = () => {
    const isSubmitted = true;
    const isInProgress = request.status === 'In Progress' || request.status === 'Resolved';
    const isResolved = request.status === 'Resolved';

    return [
      {
        title: 'Request Submitted',
        date: new Date(request.createdAt).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        completed: isSubmitted,
        active: isPending,
        desc: 'Issue logged and dispatched to municipal review queue',
      },
      {
        title: 'Under Review & Dispatched',
        date: isInProgress ? 'Verified by Works Dept' : 'Pending verification',
        completed: isInProgress,
        active: request.status === 'In Progress',
        desc: 'Maintenance engineers assigned to investigate site',
      },
      {
        title: 'Issue Resolved',
        date: isResolved
          ? new Date(request.updatedAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Pending completion',
        completed: isResolved,
        active: isResolved,
        desc: request.adminNote || 'Resolution verified by municipal administration',
      },
    ];
  };

  const steps = getTimelineSteps();

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center justify-center shrink-0">
                <CategoryIcon category={request.category} className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{request.category}</h2>
                  <StatusBadge status={request.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>ID: #{request.id.slice(0, 8)}</span>
                  <button
                    onClick={copyId}
                    className="p-1 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Copy full ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Location & Citizen Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{request.location}</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reported By</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{request.userName || 'Citizen'}</span>
                  {isAdmin && request.userEmail && (
                    <span className="text-slate-400 font-normal">({request.userEmail})</span>
                  )}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Issue Description</h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                {request.description}
              </p>
            </div>

            {/* Attached Photo / Evidence */}
            {((request.imageBase64 && request.imageBase64.trim() !== '') || request.imageUrl) && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>Attached Photo / Evidence</span>
                </h3>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2">
                  <img
                    src={request.imageBase64 || request.imageUrl}
                    alt="Citizen submitted issue photo"
                    className="max-h-80 w-auto max-w-full rounded-lg object-contain shadow-xs"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Resolution Note if present */}
            {request.adminNote && (
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
                <div className="flex items-center gap-2 mb-1 text-blue-800 dark:text-blue-300 font-semibold text-xs">
                  <MessageSquare className="w-4 h-4" />
                  <span>Admin Resolution Note</span>
                </div>
                <p className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">{request.adminNote}</p>
              </div>
            )}

            {/* Progress Timeline Stepper */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Service Timeline</h3>
              <div className="space-y-4 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {steps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 transition-colors flex items-center justify-center ${
                        step.completed
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : step.active
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {step.completed && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-bold ${
                            step.completed || step.active
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {step.title}
                        </p>
                        <span className="text-[11px] text-slate-400 font-medium">{step.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Management Panel inside detail view */}
            {isAdmin && (
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-xs">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Administrator Actions</span>
                  </div>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">Status & Feedback Workflow</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Add or Update Resolution Note:
                  </label>
                  <input
                    type="text"
                    value={adminNoteText}
                    onChange={(e) => setAdminNoteText(e.target.value)}
                    placeholder="e.g. Repair crew dispatched; Completed on Oct 19."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    disabled={updatingStatus || request.status === 'Pending'}
                    onClick={() => handleAdminStatusChange('Pending')}
                    className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-semibold hover:bg-amber-200 transition-colors disabled:opacity-40"
                  >
                    Set Pending
                  </button>

                  <button
                    disabled={updatingStatus || request.status === 'In Progress'}
                    onClick={() => handleAdminStatusChange('In Progress')}
                    className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors disabled:opacity-40"
                  >
                    Set In Progress
                  </button>

                  <button
                    disabled={updatingStatus || request.status === 'Resolved'}
                    onClick={() => handleAdminStatusChange('Resolved')}
                    className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-40"
                  >
                    Set Resolved
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {/* Delete/Cancel for Citizen while pending, or Admin anytime */}
            {(isOwner && isPending) || isAdmin ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Confirm delete?
                  </span>
                  <button
                    onClick={() => {
                      onDelete(request);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-md hover:bg-rose-700"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md"
                  >
                    Back
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isOwner ? 'Cancel Request' : 'Delete Request'}</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {isOwner && isPending && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(request);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Request</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
