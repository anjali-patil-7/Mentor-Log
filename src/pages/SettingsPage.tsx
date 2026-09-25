import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { setTheme, openImportModal } from '../store/uiSlice';
import { getCompleteBackupData, restoreBackupDataDB } from '../db/operations';
import { parseJsonBackupFile } from '../utils/import';
import { exportToJsonBackup } from '../utils/export';
import { BackupData } from '../types';
import { RestoreConfirmModal } from '../components/RestoreConfirmModal';
import { useToast } from '../components/Toast';

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const { showToast } = useToast();

  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);

  const handleDownloadBackup = async () => {
    try {
      const backup = await getCompleteBackupData();
      exportToJsonBackup(backup);
      showToast('Downloaded complete JSON backup file', 'success');
    } catch (err: any) {
      showToast('Failed to generate backup file', 'error');
    }
  };

  const handleFileRestoreSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const backup = await parseJsonBackupFile(file);
      setPendingBackup(backup);
    } catch (err: any) {
      showToast(err.message || 'Invalid backup file', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white font-heading tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Manage theme preferences, local database backup/restore, and spreadsheet imports
        </p>
      </div>

      {/* Section 1: Appearance & Theme */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Appearance & Theme</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => dispatch(setTheme('light'))}
            className={`p-4 rounded-xl border text-center transition-all ${
              theme === 'light'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
          >
            <Sun className="w-6 h-6 mx-auto mb-2 text-amber-500" />
            <span className="text-xs font-bold block text-neutral-900 dark:text-white">Light Mode</span>
          </button>

          <button
            onClick={() => dispatch(setTheme('dark'))}
            className={`p-4 rounded-xl border text-center transition-all ${
              theme === 'dark'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
          >
            <Moon className="w-6 h-6 mx-auto mb-2 text-indigo-400" />
            <span className="text-xs font-bold block text-neutral-900 dark:text-white">Dark Mode</span>
          </button>

          <button
            onClick={() => dispatch(setTheme('system'))}
            className={`p-4 rounded-xl border text-center transition-all ${
              theme === 'system'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
            }`}
          >
            <Laptop className="w-6 h-6 mx-auto mb-2 text-neutral-400" />
            <span className="text-xs font-bold block text-neutral-900 dark:text-white">System Default</span>
          </button>
        </div>
      </div>

      {/* Section 2: Local Storage & Backup / Restore */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <span>IndexedDB Backup & Restore</span>
        </h3>

        <p className="text-xs text-neutral-500 leading-relaxed">
          Mentor Log stores all data locally inside your web browser's IndexedDB database via Dexie.js. Download JSON backups to save or transfer data across browsers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Download Backup */}
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Download Backup</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">Save complete JSON backup containing all students, sessions, assignments, and tracks.</p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Restore Backup</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">Upload JSON backup file with automatic schema validation and record preview.</p>
            </div>

            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-neutral-500" />
              <span>Select JSON Backup File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileRestoreSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Section 3: Spreadsheet Import */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading">
              Bulk Data Import (Excel / CSV)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Import sessions and student records directly from Excel spreadsheets or CSV files with row validation preview.
            </p>
          </div>

          <button
            onClick={() => dispatch(openImportModal())}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Open Data Importer</span>
          </button>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      <RestoreConfirmModal
        backupData={pendingBackup}
        onClose={() => setPendingBackup(null)}
      />
    </div>
  );
}
