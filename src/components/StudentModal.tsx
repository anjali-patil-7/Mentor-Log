import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { closeAddStudentModal } from '../store/uiSlice';
import { addStudentDB, updateStudentDB } from '../db/operations';
import { useStudents, useTracks, useStudentById } from '../db/hooks';
import { Student } from '../types';
import { useToast } from './Toast';

export function StudentModal() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isAddStudentModalOpen);
  const editingStudentId = useAppSelector((state) => state.ui.editingStudentId);
  const existingStudents = useStudents();
  const tracks = useTracks();
  const editingStudent = useStudentById(editingStudentId || '');
  const { showToast } = useToast();

  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [domain, setDomain] = useState('');
  const [batch, setBatch] = useState('2026-B1');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Completed'>('Active');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (editingStudent) {
      setStudentName(editingStudent.studentName);
      setEmail(editingStudent.email || '');
      setPhone(editingStudent.phone || '');
      setDomain(editingStudent.domain || (tracks[0]?.name || 'Full Stack'));
      setBatch(editingStudent.batch || '2026-B1');
      setJoiningDate(editingStudent.joiningDate || new Date().toISOString().slice(0, 10));
      setStatus(editingStudent.status || 'Active');
      setNotes(editingStudent.notes || '');
    } else {
      setStudentName('');
      setEmail('');
      setPhone('');
      setDomain(tracks[0]?.name || 'Full Stack');
      setBatch('2026-B1');
      setJoiningDate(new Date().toISOString().slice(0, 10));
      setStatus('Active');
      setNotes('');
    }
    setErrors({});
  }, [isOpen, editingStudent, tracks]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }
    if (!domain.trim()) {
      newErrors.domain = 'Track / Domain is required';
    }
    if (email.trim() && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!editingStudent) {
      const duplicate = existingStudents.some(
        (s) => s.studentName.toLowerCase() === studentName.trim().toLowerCase()
      );
      if (duplicate) {
        newErrors.studentName = 'A student with this name already exists';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editingStudent) {
        const updated: Student = {
          ...editingStudent,
          studentName: studentName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          domain: domain.trim(),
          batch: batch.trim(),
          joiningDate,
          status,
          notes: notes.trim(),
        };
        await updateStudentDB(updated);
        showToast(`Updated profile for ${studentName.trim()}`, 'success');
      } else {
        const newStudent = await addStudentDB({
          studentId: '', // Auto generated STU-001
          studentName: studentName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          domain: domain.trim(),
          batch: batch.trim(),
          joiningDate,
          status,
          notes: notes.trim(),
        });
        showToast(`Added student ${newStudent.studentName} (${newStudent.studentId})`, 'success');
      }
      dispatch(closeAddStudentModal());
    } catch (err: any) {
      showToast(err.message || 'Failed to save student', 'error');
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
          onClick={() => dispatch(closeAddStudentModal())}
          className="fixed inset-0 bg-neutral-900/50 dark:bg-black/75 backdrop-blur-xs"
        />

        {/* Dialog Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10 overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <UserPlus className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {editingStudent ? 'Edit Student Details' : 'Add New Student'}
              </h3>
            </div>
            <button
              onClick={() => dispatch(closeAddStudentModal())}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar px-1">
            {/* Student Name */}
            <div>
              <label htmlFor="modal-student-name" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Student Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="modal-student-name"
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (errors.studentName) setErrors((prev) => ({ ...prev, studentName: '' }));
                }}
                placeholder="e.g. Priya Sharma"
                className={`w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 ${
                  errors.studentName
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-neutral-200 dark:border-neutral-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
              {errors.studentName && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.studentName}
                </p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-student-email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Email
                </label>
                <input
                  id="modal-student-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="priya@example.com"
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="modal-student-phone" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Phone Number
                </label>
                <input
                  id="modal-student-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Domain & Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-student-domain" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Domain / Track <span className="text-rose-500">*</span>
                </label>
                <select
                  id="modal-student-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                  <option value="AI / Machine Learning">AI / Machine Learning</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Data Engineering">Data Engineering</option>
                </select>
              </div>

              <div>
                <label htmlFor="modal-student-batch" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Batch
                </label>
                <input
                  id="modal-student-batch"
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="2026-B1"
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Joining Date & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="modal-student-joining-date" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Joining Date
                </label>
                <input
                  id="modal-student-joining-date"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="modal-student-status" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Student Status
                </label>
                <select
                  id="modal-student-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="modal-student-notes" className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                Notes
              </label>
              <textarea
                id="modal-student-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Target goals, learning style, special notes..."
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => dispatch(closeAddStudentModal())}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
              >
                {editingStudent ? 'Save Changes' : 'Create Student'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
