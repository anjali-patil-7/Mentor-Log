import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store, useAppSelector } from './store';
import { initAndMigrateDatabase } from './db/index';
import { ToastProvider } from './components/Toast';
import { Sidebar } from './components/Sidebar';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { SessionsPage } from './pages/SessionsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Global Modals & Slide-overs
import { SessionSlideOver } from './components/SessionSlideOver';
import { SessionDetailsModal } from './components/SessionDetailsModal';
import { AddTrackModal } from './components/AddTrackModal';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { StudentModal } from './components/StudentModal';
import { AssignmentModal } from './components/AssignmentModal';
import { ImportModal } from './components/ImportModal';

function MentorLogContent() {
  const theme = useAppSelector((state) => state.ui.theme);

  // Initialize Dexie database and auto-migrate legacy localStorage on boot
  useEffect(() => {
    initAndMigrateDatabase();
  }, []);

  // Theme Sync effect
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col md:flex-row font-sans transition-colors">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Slide-overs & Modals */}
        <SessionSlideOver />
        <SessionDetailsModal />
        <AddTrackModal />
        <DeleteConfirmDialog />
        <StudentModal />
        <AssignmentModal />
        <ImportModal />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <MentorLogContent />
      </ToastProvider>
    </Provider>
  );
}
