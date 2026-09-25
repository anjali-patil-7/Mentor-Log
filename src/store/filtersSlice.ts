import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterState, SessionStatus, AttendanceStatus, AssignmentStatus, DatePreset, SortField } from '../types';

const initialState: FilterState = {
  searchQuery: '',
  studentId: 'all',
  trackId: 'all',
  sessionStatus: 'all',
  attendance: 'all',
  assignmentStatus: 'all',
  datePreset: 'all',
  startDate: '',
  endDate: '',
  sortField: 'date',
  sortDirection: 'desc',
};

export const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStudentFilter: (state, action: PayloadAction<string>) => {
      state.studentId = action.payload;
    },
    setTrackFilter: (state, action: PayloadAction<string>) => {
      state.trackId = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<'all' | SessionStatus>) => {
      state.sessionStatus = action.payload;
    },
    setAttendanceFilter: (state, action: PayloadAction<'all' | AttendanceStatus>) => {
      state.attendance = action.payload;
    },
    setAssignmentStatusFilter: (state, action: PayloadAction<'all' | AssignmentStatus>) => {
      state.assignmentStatus = action.payload;
    },
    setDatePreset: (state, action: PayloadAction<DatePreset>) => {
      state.datePreset = action.payload;
      if (action.payload !== 'custom') {
        state.startDate = '';
        state.endDate = '';
      }
    },
    setCustomDateRange: (
      state,
      action: PayloadAction<{ startDate: string; endDate: string }>
    ) => {
      state.datePreset = 'custom';
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
    },
    toggleSort: (state, action: PayloadAction<SortField>) => {
      if (state.sortField === action.payload) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortField = action.payload;
        state.sortDirection = action.payload === 'studentName' ? 'asc' : 'desc';
      }
    },
    resetFilters: (state) => {
      state.searchQuery = '';
      state.studentId = 'all';
      state.trackId = 'all';
      state.sessionStatus = 'all';
      state.attendance = 'all';
      state.assignmentStatus = 'all';
      state.datePreset = 'all';
      state.startDate = '';
      state.endDate = '';
      state.sortField = 'date';
      state.sortDirection = 'desc';
    },
  },
});

export const {
  setSearchQuery,
  setStudentFilter,
  setTrackFilter,
  setStatusFilter,
  setAttendanceFilter,
  setAssignmentStatusFilter,
  setDatePreset,
  setCustomDateRange,
  toggleSort,
  resetFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;
