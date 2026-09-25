import React, { useState, useRef } from 'react';
import {
  GraduationCap,
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Sun,
  Moon,
  Laptop,
  ChevronDown,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { openAddPanel, setTheme, openImportModal } from '../store/uiSlice';
import { useSessions, useTracks, useFilteredSessions } from '../db/hooks';
import { getCompleteBackupData, restoreBackupDataDB } from '../db/operations';
import {
  exportSessionsToCsv,
  exportSessionsToExcel,
  exportToJsonBackup,
} from '../utils/export';
import { parseJsonBackupFile } from '../utils/import';
import { useToast } from './Toast';

export function Header() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const filters = useAppSelector((state) => state.filters);
  const rawSessions = useSessions();
  const { filteredSessions } = useFilteredSessions(filters);
  const tracks = useTracks();
  const { showToast } = useToast();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = (format: 'xlsx' | 'csv', scope: 'filtered' | 'all') => {
    setIsExportOpen(false);
    const data = scope === 'filtered' ? filteredSessions : rawSessions;
    if (data.length === 0) {
      showToast('No sessions to export in this selection', 'error');
      return;
    }

    const dateTag = new Date().toISOString().slice(0, 10);
    const filename = `mentor-log-${scope}-${dateTag}.${format}`;

    if (format === 'xlsx') {
      exportSessionsToExcel(data, tracks, filename);
    } else {
      exportSessionsToCsv(data, tracks, filename);
    }
    showToast(`Exported ${data.length} sessions to ${format.toUpperCase()}`, 'success');
  };

  const handleBackup = async () => {
    const backup = await getCompleteBackupData();
    exportToJsonBackup(backup);
    showToast('Downloaded complete JSON backup', 'success');
  };

  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const backupData = await parseJsonBackupFile(file);
      await restoreBackupDataDB(backupData);
      showToast(
        `Restored ${backupData.sessions.length} sessions & ${backupData.students.length} students successfully!`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to restore backup file', 'error');
    }
  };

  const cycleTheme = () => {
    if (theme === 'system') dispatch(setTheme('dark'));
    else if (theme === 'dark') dispatch(setTheme('light'));
    else dispatch(setTheme('system'));
  };

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-heading tracking-tight leading-tight">
                Mentor Log
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                IndexedDB DB
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
              Daily session tracking, curriculum logs & student assignments
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              title="Export sessions to Excel or CSV"
            >
              <Download className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden md:inline">Export</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {isExportOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsExportOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-700 py-1.5 z-30 text-xs">
                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Export Filtered ({filteredSessions.length})
                  </div>
                  <button
                    onClick={() => handleExport('xlsx', 'filtered')}
                    className="w-full px-3 py-2 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Filtered to Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv', 'filtered')}
                    className="w-full px-3 py-2 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Filtered to CSV (.csv)</span>
                  </button>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />

                  <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Export All ({rawSessions.length})
                  </div>
                  <button
                    onClick={() => handleExport('xlsx', 'all')}
                    className="w-full px-3 py-2 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>All to Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv', 'all')}
                    className="w-full px-3 py-2 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>All to CSV (.csv)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Backup Button */}
          <button
            onClick={handleBackup}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            title="Download JSON backup"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Backup</span>
          </button>

          {/* Restore Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleRestoreClick}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            title="Restore from JSON backup"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-500" />
            <span>Restore</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title={`Current theme: ${theme}. Click to switch.`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Laptop className="w-4 h-4" />
            )}
          </button>

          {/* Log Session Action */}
          <button
            onClick={() => dispatch(openAddPanel())}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Session</span>
          </button>
        </div>
      </div>
    </header>
  );
}
