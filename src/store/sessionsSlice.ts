import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session, SessionStatus } from '../types';
import { INITIAL_SESSIONS } from '../utils/mockData';

const SESSIONS_STORAGE_KEY = 'mentor_log_sessions_v1';

function loadInitialSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse sessions from localStorage', e);
  }
  return INITIAL_SESSIONS;
}

interface SessionsState {
  items: Session[];
}

const initialState: SessionsState = {
  items: loadInitialSessions(),
};

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    addSession: (state, action: PayloadAction<Session>) => {
      state.items.unshift(action.payload);
    },
    updateSession: (state, action: PayloadAction<Session>) => {
      const index = state.items.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteSession: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
    },
    updateSessionStatus: (
      state,
      action: PayloadAction<{ id: string; status: SessionStatus }>
    ) => {
      const session = state.items.find((s) => s.id === action.payload.id);
      if (session) {
        session.sessionStatus = action.payload.status;
        session.classStatus = action.payload.status;
        session.updatedAt = new Date().toISOString();
      }
    },
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.items = action.payload;
    },
    clearAllSessions: (state) => {
      state.items = [];
    },
  },
});

export const {
  addSession,
  updateSession,
  deleteSession,
  updateSessionStatus,
  setSessions,
  clearAllSessions,
} = sessionsSlice.actions;

export default sessionsSlice.reducer;
