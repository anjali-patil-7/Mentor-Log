import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Users,
  CheckSquare,
  Filter,
  Check,
  Search,
} from 'lucide-react';
import { useStudents, useSessions, useTracks, useFilteredSessions } from '../db/hooks';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleSelectStudent, setSelectedStudents, clearSelectedStudents } from '../store/uiSlice';
import {
  exportSessionsToExcel,
  exportSessionsToCsv,
  exportStudentPdfReport,
  exportStudentsToExcel,
  exportStudentsToCsv,

} 
from '../utils/export';
import { useToast } from '../components/Toast';

export function ReportsPage() {
  const dispatch = useAppDispatch();
  const students = useStudents();
  const sessions = useSessions();
  const tracks = useTracks();
  const filters = useAppSelector((state) => state.filters);
  const selectedStudentIds = useAppSelector((state) => state.ui.selectedStudentIds);
  const { showToast } = useToast();

  const { filteredSessions } = useFilteredSessions(filters);
  const [individualStudentId, setIndividualStudentId] = useState(students[0]?.studentId || '');
  const [studentSearch, setStudentSearch] = useState('');

  const individualStudent = students.find((s) => s.studentId === individualStudentId) || students[0] || null;
  const individualSessions = sessions.filter(
    (s) => s.studentId === individualStudentId || (individualStudent && s.studentName === individualStudent.studentName)
  );

  // Selected Students Export Dataset
  const selectedStudents = students.filter((s) => selectedStudentIds.includes(s.studentId));
  const selectedSessions = sessions.filter((s) => selectedStudentIds.includes(s.studentId));

  const filteredStudentList = students.filter((s) =>
    s.studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.studentId.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      dispatch(clearSelectedStudents());
    } else {
      dispatch(setSelectedStudents(students.map((s) => s.studentId)));
    }
  };

  // Export handlers
  const handleExportFiltered = (format: 'pdf' | 'xlsx' | 'csv') => {
    if (filteredSessions.length === 0) {
      showToast('No sessions matching current filters to export', 'error');
      return;
    }
    const tag = new Date().toISOString().slice(0, 10);
    if (format === 'pdf') {
      exportStudentPdfReport(null, filteredSessions, tracks, `filtered-sessions-${tag}.pdf`);
    } else if (format === 'xlsx') {
      exportSessionsToExcel(filteredSessions, tracks, `filtered-sessions-${tag}.xlsx`);
    } else {
      exportSessionsToCsv(filteredSessions, tracks, `filtered-sessions-${tag}.csv`);
    }
    showToast(`Exported ${filteredSessions.length} filtered sessions to ${format.toUpperCase()}`, 'success');
  };

  const handleExportIndividual = (format: 'pdf' | 'xlsx' | 'csv') => {
    if (!individualStudent) {
      showToast('Please select a student', 'error');
      return;
    }
    const tag = individualStudent.studentId;
    if (format === 'pdf') {
      exportStudentPdfReport(individualStudent, individualSessions, tracks, `${tag}-progress-report.pdf`);
    } else if (format === 'xlsx') {
      exportSessionsToExcel(individualSessions, tracks, `${tag}-sessions.xlsx`);
    } else {
      exportSessionsToCsv(individualSessions, tracks, `${tag}-sessions.csv`);
    }
    showToast(`Exported report for ${individualStudent.studentName} to ${format.toUpperCase()}`, 'success');
  };

  const handleExportSelected = (format: 'pdf' | 'xlsx' | 'csv') => {
    if (selectedStudentIds.length === 0) {
      showToast('Please select at least one student via checkboxes below', 'error');
      return;
    }

    const tag = new Date().toISOString().slice(0, 10);
    if (format === 'pdf') {
      exportStudentPdfReport(null, selectedSessions, tracks, `selected-students-${tag}.pdf`);
    } else if (format === 'xlsx') {
      exportSessionsToExcel(selectedSessions, tracks, `selected-students-${tag}.xlsx`);
    } else {
      exportSessionsToCsv(selectedSessions, tracks, `selected-students-${tag}.csv`);
    }
    showToast(`Exported ${selectedStudentIds.length} selected students to ${format.toUpperCase()}`, 'success');
  };

  const handleExportAllStudents = (format: 'xlsx' | 'csv') => {
    if (format === 'xlsx') {
      exportStudentsToExcel(students);
    } else {
      exportStudentsToCsv(students);
    }
    showToast(`Exported all ${students.length} students to ${format.toUpperCase()}`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white font-heading tracking-tight">
          Reports & Export Hub
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Generate human-readable PDF progress reports, Excel worksheets, or CSV files for students and sessions
        </p>
      </div>

      {/* Grid: 4 Export Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module 1: Export Current Filtered View */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Filter className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading">
                  1. Export Current Filtered View
                </h3>
                <p className="text-xs text-neutral-500">
                  Exports ONLY the {filteredSessions.length} sessions matching active filters
                </p>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-xs space-y-1 my-3">
              <div>Active Filter Count: <strong>{filteredSessions.length} sessions</strong></div>
              <div className="text-[11px] text-neutral-400">
                Includes active search term, student filter, track filter, and date range.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => handleExportFiltered('pdf')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Report</span>
            </button>
            <button
              onClick={() => handleExportFiltered('xlsx')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleExportFiltered('csv')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Module 2: Export Individual Student Report */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading">
                  2. Export Individual Student Progress Report
                </h3>
                <p className="text-xs text-neutral-500">
                  Includes header details (Student ID, Name, Domain, Email) + session log
                </p>
              </div>
            </div>

            <div className="my-3">
              <label htmlFor="report-student-select" className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
                Select Student:
              </label>
              <select
                id="report-student-select"
                value={individualStudentId}
                onChange={(e) => setIndividualStudentId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white font-semibold"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.studentId}>
                    {s.studentName} ({s.studentId}) — {s.domain}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => handleExportIndividual('pdf')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>PDF Progress Report</span>
            </button>
            <button
              onClick={() => handleExportIndividual('xlsx')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Module 3: Export Selected Students */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <CheckSquare className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading">
                3. Export Selected Students ({selectedStudentIds.length} selected)
              </h3>
              <p className="text-xs text-neutral-500">Check boxes below to export specific student groups</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllStudents}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100"
            >
              {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
            </button>

            <button
              onClick={() => handleExportSelected('pdf')}
              disabled={selectedStudentIds.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={() => handleExportSelected('xlsx')}
              disabled={selectedStudentIds.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 disabled:opacity-40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Student Selector List */}
        <div className="space-y-2">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search students to select..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
            {filteredStudentList.map((s) => {
              const isChecked = selectedStudentIds.includes(s.studentId);
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer text-xs font-medium transition-colors ${
                    isChecked
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200'
                      : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => dispatch(toggleSelectStudent(s.studentId))}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="truncate">
                    <span className="font-bold">{s.studentName}</span>
                    <span className="text-[10px] text-neutral-400 block">{s.studentId} • {s.domain}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Module 4: Export All Students Master Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white font-heading">
            4. Export All Students Master Directory ({students.length} students)
          </h3>
          <p className="text-xs text-neutral-500">
            Exports complete student roster with Student ID, Name, Email, Phone, Domain, Batch, Joining Date, and Status
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleExportAllStudents('xlsx')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>All Students to Excel</span>
          </button>
          <button
            onClick={() => handleExportAllStudents('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <span>All Students to CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
}
