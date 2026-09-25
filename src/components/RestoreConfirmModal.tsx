import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { BackupData } from '../types';
import { restoreBackupDataDB } from '../db/operations';
import { useToast } from './Toast';

interface RestoreConfirmModalProps {
  backupData: BackupData | null;
  onClose: () => void;
}

export function RestoreConfirmModal({ backupData, onClose }: RestoreConfirmModalProps) {
  const { showToast } = useToast();

  if (!backupData) return null;

  const studentCount = backupData.students?.length || 0;
  const sessionCount = backupData.sessions?.length || 0;
  const assignmentCount = backupData.assignments?.length || 0;
  const trackCount = backupData.tracks?.length || 0;

  const handleConfirm = async () => {
    try {
      await restoreBackupDataDB(backupData);
      showToast(
        `Restored backup successfully: ${studentCount} students, ${sessionCount} sessions, ${assignmentCount} assignments!`,
        'success'
      );
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to restore backup data', 'error');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
            <div className="p-2.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Restore Application Backup?
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                The selected backup file contains the following validated dataset:
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs py-1">
                <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                  <span className="font-bold text-neutral-900 dark:text-white">{studentCount}</span> Students
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                  <span className="font-bold text-neutral-900 dark:text-white">{sessionCount}</span> Sessions
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                  <span className="font-bold text-neutral-900 dark:text-white">{assignmentCount}</span> Assignments
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
                  <span className="font-bold text-neutral-900 dark:text-white">{trackCount}</span> Tracks
                </div>
              </div>

              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800">
                Warning: Restoring this backup will replace existing database records.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Restore Backup Data
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
