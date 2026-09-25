import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  CheckSquare,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Plus,
  Menu,
  X,
} from 'lucide-react';
import { useAppDispatch } from '../store';
import { openAddPanel } from '../store/uiSlice';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Students', path: '/students', icon: Users },
    { label: 'Sessions', path: '/sessions', icon: BookOpen },
    { label: 'Assignments', path: '/assignments', icon: CheckSquare },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const navContent = (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 w-64">
      {/* Sidebar Header Identity */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-900 dark:text-white font-heading tracking-tight leading-tight">
              Mentor Log
            </h1>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Student & Session System
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Action */}
      <div className="p-3">
        <button
          onClick={() => {
            dispatch(openAddPanel());
            setIsMobileOpen(false);
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Log Session</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/' || location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive: linkActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive || linkActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer: Theme Toggle */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
          Theme Preference
        </div>
        <ThemeToggle variant="segmented" />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 h-14 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
            aria-label="Open Navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-neutral-900 dark:text-white text-sm font-heading">
            Mentor Log
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <button
            onClick={() => dispatch(openAddPanel())}
            className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs"
            title="Log Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-10">{navContent}</div>
        </div>
      )}
    </>
  );
}
