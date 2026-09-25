import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { setDeletingSessionId } from '../store/uiSlice';
import { deleteSessionDB } from '../db/operations';
import { useSessions, useTracks } from '../db/hooks';
import { useToast } from './Toast';

export function DeleteConfirmDialog() {
  const dispatch = useAppDispatch();
  const deletingSessionId = useAppSelector((state) => state.ui.deletingSessionId);
  const sessions = useSessions();
  const tracks = useTracks();
  const { showToast } = useToast();

  const session = sessions.find((s) => s.id === deletingSessionId);
  const trackMap = new Map(tracks.map((t) => [t.id, t]));

  if (!deletingSessionId || !session) return null;

  const handleCancel = () => {
    dispatch(setDeletingSessionId(null));
  };

  const handleConfirm = async () => {
    await deleteSessionDB(session.id);
    dispatch(setDeletingSessionId(null));
    showToast(`Deleted session for ${session.studentName}`, 'info');
  };

  const track = trackMap.get(session.trackId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="fixed inset-0 bg-neutral-900/50 dark:bg-black/75 backdrop-blur-xs"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Delete Mentoring Session?
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Are you sure you want to delete the session with{' '}
                <strong className="text-neutral-900 dark:text-neutral-200">
                  {session.studentName}
                </strong>{' '}
                on {session.date} ({track?.name || 'General'})? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3.5 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Session
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
