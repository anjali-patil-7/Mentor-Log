import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types';
import { DEFAULT_TRACKS } from '../utils/mockData';

const TRACKS_STORAGE_KEY = 'mentor_log_tracks_v1';

function loadInitialTracks(): Track[] {
  try {
    const raw = localStorage.getItem(TRACKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse tracks from localStorage', e);
  }
  return DEFAULT_TRACKS;
}

interface TracksState {
  items: Track[];
}

const initialState: TracksState = {
  items: loadInitialTracks(),
};

export const tracksSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    addTrack: (state, action: PayloadAction<Track>) => {
      // Ensure unique ID
      const exists = state.items.some((t) => t.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
      }
    },
    updateTrack: (state, action: PayloadAction<Track>) => {
      const index = state.items.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteTrack: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    setTracks: (state, action: PayloadAction<Track[]>) => {
      state.items = action.payload;
    },
  },
});

export const { addTrack, updateTrack, deleteTrack, setTracks } = tracksSlice.actions;

export default tracksSlice.reducer;
