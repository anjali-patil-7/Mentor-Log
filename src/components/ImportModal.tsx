import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Upload, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, FileCode, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { closeImportModal } from '../store/uiSlice';
import { parseSpreadsheetImportFile, parseJsonBackupFile, ImportResult, ImportPreviewRow } from '../utils/import';
import { addSessionDB, addStudentDB, restoreBackupDataDB } from '../db/operations';
import { useStudents, useTracks } from '../db/hooks';
import { useToast } from './Toast';

export function ImportModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isImportModalOpen);
  const students = useStudents();
  const tracks = useTracks();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    setErrorMessage('');
    setIsLoading(false);
    dispatch(closeImportModal());
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'json') {
        const backup = await parseJsonBackupFile(file);
        setImportResult({
          fileType: 'json',
          validRows: [],
          invalidRows: [],
          backupData: backup,
        });
      } else {
        const result = await parseSpreadsheetImportFile(file);
        setImportResult(result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse file');
      setImportResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult) return;

    try {
      if (importResult.fileType === 'json' && importResult.backupData) {
        await restoreBackupDataDB(importResult.backupData);
        showToast(
          `Restored backup: ${importResult.backupData.sessions.length} sessions & ${importResult.backupData.students.length} students!`,
          'success'
        );
      } else {
        const validRows = importResult.validRows;
        let sessionsCount = 0;
        let studentsCount = 0;
        let assignmentsCount = 0;

        // Map existing students by lowercase name & ID
        const studentCache = new Map<string, string>();
        students.forEach((s) => {
          studentCache.set(s.studentName.toLowerCase(), s.studentId);
          if (s.studentId) studentCache.set(s.studentId.toLowerCase(), s.studentId);
        });

        // Track max student number for generating STU-xxx IDs
        let maxStudentNum = students.reduce((max, s) => {
          const match = s.studentId ? s.studentId.match(/STU-(\d+)/) : null;
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);

        for (const row of validRows) {
          const nameKey = (row.studentName || '').trim().toLowerCase();
          let studentId = studentCache.get(nameKey);

          // If student does not exist in Dexie yet, auto-create student record
          if (!studentId) {
            maxStudentNum++;
            studentId = `STU-${String(maxStudentNum).padStart(3, '0')}`;
            const newStudent = {
              id: `stu-${studentId.toLowerCase()}`,
              studentId,
              studentName: row.studentName,
              email: `${nameKey.replace(/[^a-z0-9]/g, '')}@example.com`,
              phone: '+1 (555) 019-2834',
              domain: row.trackName || 'Full Stack Development',
              batch: '2026-B1',
              joiningDate: row.date,
              status: 'Active' as const,
              notes: 'Imported via spreadsheet data import.',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await addStudentDB(newStudent);
            studentCache.set(nameKey, studentId);
            studentCache.set(studentId.toLowerCase(), studentId);
            studentsCount++;
          }

          // Resolve trackId
          const matchedTrack = tracks.find(
            (t) => t.name.toLowerCase() === row.trackName.toLowerCase()
          );
          const trackId = matchedTrack ? matchedTrack.id : tracks[0]?.id || 'track-full-stack';

          // Extract resources (URLs from remarks)
          const sessionResources: any[] = [];
          if (row.remarks) {
            const urlMatches = row.remarks.match(/(https?:\/\/[^\s]+)/g);
            if (urlMatches) {
              urlMatches.forEach((url, idx) => {
                sessionResources.push({
                  id: `res-imp-${Date.now()}-${idx}`,
                  type: 'Recording',
                  title: 'Session Recording',
                  url,
                });
              });
            }
          }

          const sessionStatus = (row.classStatus as any) || 'Completed';

          const addedSession = await addSessionDB({
            studentId,
            studentName: row.studentName,
            trackId,
            date: row.date,
            startTime: row.startTime,
            endTime: row.endTime,
            sessionStatus,
            attendance: sessionStatus === 'Completed' ? 'Present' : 'Present',
            topicsTaught: row.topicsTaught || '',
            upcomingTopics: '',
            taskAssignment: row.taskAssignment || '',
            assignmentStatus: row.taskAssignment ? (sessionStatus === 'Completed' ? 'Submitted' : 'Assigned') : 'Completed',
            sessionResources,
            remarks: row.remarks || '',
          });

          if (row.taskAssignment) {
            assignmentsCount++;
          }
          sessionsCount++;
        }

        showToast(
          `Import Complete! ${sessionsCount} sessions, ${studentsCount} new students, and ${assignmentsCount} assignments loaded.`,
          'success'
        );
      }

      handleClose();
    } catch (err: any) {
      showToast(err.message || 'Import failed', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-neutral-900/50 dark:bg-black/75 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10 overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Upload className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Import Data (Excel, CSV, JSON)
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* File Upload Trigger */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!importResult && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-8 text-center cursor-pointer transition-all bg-neutral-50/50 dark:bg-neutral-800/30"
              >
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Click to choose file or drag & drop
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Supports Excel (.xlsx), CSV (.csv), or JSON backup (.json)
                </p>
              </div>
            )}

            {isLoading && (
              <div className="py-8 text-center text-xs text-neutral-500">
                Parsing and validating file contents...
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Import Preview */}
            {importResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-2.5">
                    {importResult.fileType === 'json' ? (
                      <FileCode className="w-5 h-5 text-indigo-500" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {selectedFile?.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {importResult.fileType === 'json'
                          ? `JSON Backup with ${importResult.backupData?.sessions?.length || 0} sessions`
                          : `Found ${importResult.validRows.length + importResult.invalidRows.length} rows`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setImportResult(null);
                      setSelectedFile(null);
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    Change File
                  </button>
                </div>

                {importResult.fileType !== 'json' && (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                          {importResult.validRows.length}
                        </span>
                        <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Valid Rows Ready to Import
                        </span>
                      </div>

                      <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg">
                        <span className="text-lg font-bold text-rose-700 dark:text-rose-300">
                          {importResult.invalidRows.length}
                        </span>
                        <span className="block text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                          Invalid Rows (Will be skipped)
                        </span>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-lg custom-scrollbar">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-600 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                          <tr>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Student Name</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Track</th>
                            <th className="py-2 px-3">Validation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {importResult.validRows.slice(0, 5).map((row) => (
                            <tr key={`valid-${row.rowNumber}`} className="text-neutral-800 dark:text-neutral-200">
                              <td className="py-1.5 px-3 font-mono">{row.rowNumber}</td>
                              <td className="py-1.5 px-3 font-semibold">{row.studentName}</td>
                              <td className="py-1.5 px-3">{row.date}</td>
                              <td className="py-1.5 px-3">{row.trackName}</td>
                              <td className="py-1.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Valid
                              </td>
                            </tr> 
                          ))}
                          {importResult.invalidRows.map((row) => (
                            <tr key={`invalid-${row.rowNumber}`} className="bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300">
                              <td className="py-1.5 px-3 font-mono">{row.rowNumber}</td>
                              <td className="py-1.5 px-3 font-semibold">{row.studentName || '—'}</td>
                              <td className="py-1.5 px-3">{row.date || '—'}</td>
                              <td className="py-1.5 px-3">{row.trackName || '—'}</td>
                              <td className="py-1.5 px-3 text-rose-600 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {row.errorReason}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importResult || (importResult.fileType !== 'json' && importResult.validRows.length === 0)}
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
              >
                <span>Import Records</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
