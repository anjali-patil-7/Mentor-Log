import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../types';

function getInitialTheme(): 'system' | 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('mentor_log_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    // fallback
  }
  return 'system';
}

const initialState: UIState = {
  isPanelOpen: false,
  editingSessionId: null,
  duplicatingSessionId: null,
  viewingSessionId: null,
  theme: getInitialTheme(),
  isAddTrackModalOpen: false,
  isAddStudentModalOpen: false,
  isAddAssignmentModalOpen: false,
  isImportModalOpen: false,
  editingStudentId: null,
  editingAssignmentId: null,
  deletingSessionId: null,
  deletingStudentId: null,
  deletingAssignmentId: null,
  selectedStudentIds: [],
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddPanel: (state) => {
      state.isPanelOpen = true;
      state.editingSessionId = null;
      state.duplicatingSessionId = null;
    },
    openEditPanel: (state, action: PayloadAction<string>) => {
      state.isPanelOpen = true;
      state.editingSessionId = action.payload;
      state.duplicatingSessionId = null;
    },
    openDuplicatePanel: (state, action: PayloadAction<string>) => {
      state.isPanelOpen = true;
      state.editingSessionId = null;
      state.duplicatingSessionId = action.payload;
    },
    closePanel: (state) => {
      state.isPanelOpen = false;
      state.editingSessionId = null;
      state.duplicatingSessionId = null;
    },
    setViewingSessionId: (state, action: PayloadAction<string | null>) => {
      state.viewingSessionId = action.payload;
    },
    setTheme: (state, action: PayloadAction<'system' | 'light' | 'dark'>) => {
      state.theme = action.payload;
      try {
        localStorage.setItem('mentor_log_theme', action.payload);
      } catch (e) {
        // ignore
      }
    },
    openAddTrackModal: (state) => {
      state.isAddTrackModalOpen = true;
    },
    closeAddTrackModal: (state) => {
      state.isAddTrackModalOpen = false;
    },
    openAddStudentModal: (state, action: PayloadAction<string | null | undefined>) => {
      state.isAddStudentModalOpen = true;
      state.editingStudentId = action.payload || null;
    },
    closeAddStudentModal: (state) => {
      state.isAddStudentModalOpen = false;
      state.editingStudentId = null;
    },
    openAddAssignmentModal: (state, action: PayloadAction<string | null | undefined>) => {
      state.isAddAssignmentModalOpen = true;
      state.editingAssignmentId = action.payload || null;
    },
    closeAddAssignmentModal: (state) => {
      state.isAddAssignmentModalOpen = false;
      state.editingAssignmentId = null;
    },
    openImportModal: (state) => {
      state.isImportModalOpen = true;
    },
    closeImportModal: (state) => {
      state.isImportModalOpen = false;
    },
    setDeletingSessionId: (state, action: PayloadAction<string | null>) => {
      state.deletingSessionId = action.payload;
    },
    setDeletingStudentId: (state, action: PayloadAction<string | null>) => {
      state.deletingStudentId = action.payload;
    },
    setDeletingAssignmentId: (state, action: PayloadAction<string | null>) => {
      state.deletingAssignmentId = action.payload;
    },
    toggleSelectStudent: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedStudentIds.includes(id)) {
        state.selectedStudentIds = state.selectedStudentIds.filter((sId) => sId !== id);
      } else {
        state.selectedStudentIds.push(id);
      }
    },
    setSelectedStudents: (state, action: PayloadAction<string[]>) => {
      state.selectedStudentIds = action.payload;
    },
    clearSelectedStudents: (state) => {
      state.selectedStudentIds = [];
    },
  },
});

export const {
  openAddPanel,
  openEditPanel,
  openDuplicatePanel,
  closePanel,
  setViewingSessionId,
  setTheme,
  openAddTrackModal,
  closeAddTrackModal,
  openAddStudentModal,
  closeAddStudentModal,
  openAddAssignmentModal,
  closeAddAssignmentModal,
  openImportModal,
  closeImportModal,
  setDeletingSessionId,
  setDeletingStudentId,
  setDeletingAssignmentId,
  toggleSelectStudent,
  setSelectedStudents,
  clearSelectedStudents,
} = uiSlice.actions;

export default uiSlice.reducer;
