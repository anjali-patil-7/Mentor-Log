import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { closeAddTrackModal } from '../store/uiSlice';
import { addTrackDB } from '../db/operations';
import { useTracks } from '../db/hooks';
import { TRACK_COLOR_PALETTE } from '../utils/mockData';
import { Track } from '../types';
import { useToast } from './Toast';

interface AddTrackModalProps {
  onTrackCreated?: (trackId: string) => void;
}

export function AddTrackModal({ onTrackCreated }: AddTrackModalProps) {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isAddTrackModalOpen);
  const existingTracks = useTracks();
  const { showToast } = useToast();

  const [trackName, setTrackName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TRACK_COLOR_PALETTE[3].hex);
  const [error, setError] = useState('');

  const handleClose = () => {
    setTrackName('');
    setError('');
    dispatch(closeAddTrackModal());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = trackName.trim();
    if (!trimmed) {
      setError('Please enter a track name');
      return;
    }

    const duplicate = existingTracks.some(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      setError('A track with this name already exists');
      return;
    }

    const newId = `track-custom-${Date.now()}`;
    const newTrack: Track = {
      id: newId,
      name: trimmed,
      color: selectedColor,
      isCustom: true,
    };

    await addTrackDB(newTrack);
    showToast(`Added new track: ${trimmed}`, 'success');
    if (onTrackCreated) {
      onTrackCreated(newId);
    }
    handleClose();
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
          className="fixed inset-0 bg-neutral-900/50 dark:bg-black/70 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Plus className="w-4 h-4" />
              </span>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Add Custom Tech Track
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="custom-track-name"
                className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5"
              >
                Track Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="custom-track-name"
                type="text"
                autoFocus
                value={trackName}
                onChange={(e) => {
                  setTrackName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. AI / Machine Learning, Cybersecurity"
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                Badge Accent Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TRACK_COLOR_PALETTE.map((item) => {
                  const isSelected = selectedColor === item.hex;
                  return (
                    <button
                      key={item.hex}
                      type="button"
                      onClick={() => setSelectedColor(item.hex)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-neutral-900 dark:border-white ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner"
                        style={{ backgroundColor: item.hex }}
                      />
                      <span className="truncate text-neutral-800 dark:text-neutral-200">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-500">Preview tag:</span>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${selectedColor}15`,
                  borderColor: `${selectedColor}40`,
                  color: selectedColor,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                {trackName.trim() || 'Track Name'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors"
              >
                Create Track
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
