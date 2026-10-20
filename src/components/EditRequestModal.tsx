import React, { useState } from 'react';
import { X, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { CATEGORIES, RequestCategory, ServiceRequest } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface EditRequestModalProps {
  request: ServiceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdated: (updated: ServiceRequest) => void;
}

export const EditRequestModal: React.FC<EditRequestModalProps> = ({
  request,
  isOpen,
  onClose,
  onRequestUpdated,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<RequestCategory>(request?.category || 'Broken Streetlight');
  const [location, setLocation] = useState(request?.location || '');
  const [description, setDescription] = useState(request?.description || '');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen || !request) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!location.trim() || location.trim().length < 3) {
      newErrors.location = 'Location must be at least 3 characters';
    }
    if (!description.trim() || description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setSubmitting(true);

    try {
      const updatedPayload = {
        category,
        location: location.trim(),
        description: description.trim(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(doc(db, 'requests', request.id), updatedPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `requests/${request.id}`);
      }

      const updatedRequest: ServiceRequest = {
        ...request,
        ...updatedPayload,
      };

      showToast('Request updated successfully', 'success');
      onRequestUpdated(updatedRequest);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-slate-900 dark:text-slate-100">
      <div className="relative w-full max-w-lg my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 sm:px-6 sm:py-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Edit Service Request</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update details while this request is in Pending status
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 max-h-[calc(92vh-90px)] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RequestCategory)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.label} value={cat.label}>
                  {cat.label} — {cat.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Location & Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Corner of Harambee Ave & 4th Street, Building A"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            {errors.location && <p className="text-xs text-rose-500 mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
            />
            {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
