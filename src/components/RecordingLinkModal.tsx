import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video,
  X,
  ExternalLink,
  Check,
  Clipboard,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Session } from '../types';
import { formatDateDisplay } from '../utils/dateTime';
import { updateSessionRecordingDB, removeSessionRecordingDB } from '../db/operations';
import { useToast } from './Toast';

interface RecordingLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
}

export function RecordingLinkModal({ isOpen, onClose, session }: RecordingLinkModalProps) {
  const { showToast } = useToast();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session) {
      const existingUrl =
        session.recordingClassLink ||
        session.sessionResources?.find((r) => r.type === 'Recording')?.url ||
        session.sessionResources?.[0]?.url ||
        '';
      setUrl(existingUrl);
      setError('');
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  const currentSavedUrl =
    session.recordingClassLink ||
    session.sessionResources?.find((r) => r.type === 'Recording')?.url ||
    session.sessionResources?.[0]?.url ||
    '';

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setError('');
      }
    } catch {
      showToast('Could not read from clipboard', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();

    if (trimmed && !trimmed.match(/^https?:\/\/.+/i)) {
      setError('Please enter a valid web URL starting with http:// or https://');
      return;
    }

    try {
      setIsSaving(true);
      await updateSessionRecordingDB(session.id, trimmed);
      if (trimmed) {
        showToast('Recording link saved successfully', 'success');
      } else {
        showToast('Recording link removed', 'info');
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save recording link', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsSaving(true);
      await removeSessionRecordingDB(session.id);
      showToast('Recording link removed', 'info');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove recording link', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white font-heading">
                  {currentSavedUrl ? 'Edit Recording Link' : 'Add Recording Link'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {session.studentName} • {formatDateDisplay(session.date)}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div>
              <label htmlFor="recording-url-input" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Recording URL / Meeting Link
              </label>
              <div className="relative">
                <input
                  id="recording-url-input"
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="https://meet.google.com/... or Zoom, Loom, Drive"
                  className={`w-full pl-3 pr-20 py-2 text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800 border rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 ${
                    error
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 focus:ring-indigo-500/20'
                  }`}
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {url && (
                    <button
                      type="button"
                      onClick={() => setUrl('')}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="p-1 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {error ? (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </p>
              ) : (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5">
                  Paste the Google Meet, Zoom, Loom, YouTube, or Google Drive session recording URL.
                </p>
              )}
            </div>

            {/* Test link preview */}
            {url.trim() && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs">
                <span className="truncate text-neutral-600 dark:text-neutral-300 font-mono text-[11px] pr-2">
                  {url}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-md hover:bg-indigo-100 shrink-0"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
              <div>
                {currentSavedUrl && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Link</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Recording'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
