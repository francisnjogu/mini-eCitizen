import React, { useState, useRef } from 'react';
import {
  X,
  MapPin,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Clock,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { CATEGORIES, RequestCategory, ServiceRequest } from '../types';
import { useToast } from './Toast';
import { CategoryIcon } from './CategoryIcon';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated: (newReq: ServiceRequest) => void;
  onViewMyRequests?: () => void;
}

/**
 * Compresses and resizes an image in the browser:
 * - Max 800px width (aspect ratio maintained)
 * - JPEG quality ~0.7
 * - Final Base64 size under 500 KB (512,000 bytes)
 * - If still too large, throws: "Image is too large. Please choose a smaller one."
 */
const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      reject(new Error('Please select a JPG or PNG image only.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.onload = () => {
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }

        // Fill background white for PNG transparency handling
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Quality ~0.7 JPEG
        let base64 = canvas.toDataURL('image/jpeg', 0.7);

        const getByteSize = (dataUrl: string) => {
          const raw = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          return Math.ceil((raw.length * 3) / 4);
        };

        let byteSize = getByteSize(base64);

        // If slightly over 500 KB (512,000 bytes), try a slightly lower quality pass
        if (byteSize > 500 * 1024) {
          base64 = canvas.toDataURL('image/jpeg', 0.5);
          byteSize = getByteSize(base64);
        }

        // If still over 500 KB, reject with friendly message
        if (byteSize > 500 * 1024) {
          reject(new Error('Image is too large. Please choose a smaller one.'));
          return;
        }

        resolve(base64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestCreated,
  onViewMyRequests,
}) => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [category, setCategory] = useState<RequestCategory>('Broken Streetlight');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Success view state after submission
  const [submittedRequest, setSubmittedRequest] = useState<ServiceRequest | null>(null);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!category) newErrors.category = 'Please choose an issue category';
    if (!location.trim()) {
      newErrors.location = 'Please provide a location, street address or landmark';
    } else if (location.trim().length < 3) {
      newErrors.location = 'Location must be at least 3 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Please describe the community problem';
    } else if (description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setCompressing(true);

    try {
      const compressedDataUrl = await compressAndResizeImage(file);
      setImageBase64(compressedDataUrl);
      showToast('Image attached and optimized successfully', 'info');
    } catch (err: any) {
      const msg = err.message || 'Image is too large. Please choose a smaller one.';
      setImageError(msg);
      setImageBase64('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImageBase64('');
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setLocation('');
    setDescription('');
    setCategory('Broken Streetlight');
    setImageBase64('');
    setImageError('');
    setErrors({});
    setSubmittedRequest(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const requestPayload: Omit<ServiceRequest, 'id'> = {
        userId: user.uid,
        userName: profile?.name || user.displayName || 'Citizen',
        userEmail: profile?.email || user.email || 'citizen@miniecitizen.org',
        category,
        location: location.trim(),
        description: description.trim(),
        imageBase64: imageBase64 || '', // empty if no image as requested
        status: 'Pending',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, 'requests'), requestPayload);
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.CREATE, 'requests');
        throw dbErr;
      }

      const created: ServiceRequest = {
        id: docRef.id,
        ...requestPayload,
      };

      // Optimistically push to requests list
      onRequestCreated(created);
      showToast('Public service request submitted successfully!', 'success');

      // Display confirmation screen
      setSubmittedRequest(created);
    } catch (err: any) {
      console.error('Error submitting request:', err);
      showToast(err.message || 'Could not submit request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100">

        {/* ============================================================== */}
        {/* SUCCESS CONFIRMATION SCREEN                                   */}
        {/* ============================================================== */}
        {submittedRequest ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Request Submitted Successfully!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your report has been logged with municipal services. You can monitor its progress in real time.
              </p>
            </div>

            {/* Submitted Details Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Ticket Reference
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                  #{submittedRequest.id.slice(0, 8)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Category:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CategoryIcon category={submittedRequest.category} className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{submittedRequest.category}</span>
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">Location & Address:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[240px]">
                  {submittedRequest.location}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Current Status:</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Pending Review</span>
                </span>
              </div>

              {submittedRequest.imageBase64 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Photo Attached:</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Included in Report</span>
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Description
                </span>
                <p className="text-slate-700 dark:text-slate-300 text-xs italic line-clamp-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  "{submittedRequest.description}"
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Submit Another Request
              </button>

              <button
                type="button"
                onClick={() => {
                  handleModalClose();
                  if (onViewMyRequests) onViewMyRequests();
                }}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View in My Requests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* REQUEST SUBMISSION FORM                                        */
          /* ============================================================== */
          <div>
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Submit Service Request</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Report a community issue for municipal resolution
                </p>
              </div>
              <button
                onClick={handleModalClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Category <span className="text-rose-500">*</span>
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
                {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category}</p>}
              </div>

              {/* Location & Address Input */}
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
                    placeholder="e.g. Corner of Harambee Ave & 4th Street, Building A, or local landmark"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                {errors.location && <p className="text-xs text-rose-500 mt-1">{errors.location}</p>}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">{description.length}/2000</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide specific details about the issue (e.g. exact spot, how long it has been broken, urgency level, safety risk)..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                />
                {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
              </div>

              {/* Optional Image Upload Field (JPG/PNG only, client-side compressed & Base64 stored in Firestore) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Photo / Evidence <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">JPG or PNG (max 500 KB)</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* If an image is selected and compressed, show small preview with Remove image button */}
                {imageBase64 ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-900">
                        <img
                          src={imageBase64}
                          alt="Selected preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          Photo attached
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Optimized & ready to save
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-rose-200 dark:border-rose-900/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove image</span>
                    </button>
                  </div>
                ) : (
                  /* Upload button area */
                  <div>
                    <button
                      type="button"
                      disabled={compressing}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 px-4 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 cursor-pointer disabled:opacity-60"
                    >
                      {compressing ? (
                        <>
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                            Optimizing and resizing image...
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Upload className="w-4 h-4 text-blue-500" />
                            <span>Choose a photo (JPG / PNG)</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Auto-compressed to under 500 KB directly in your browser
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Image error message if too large or unsupported */}
                {imageError && (
                  <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={submitting || compressing}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || compressing}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-900/20 flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
