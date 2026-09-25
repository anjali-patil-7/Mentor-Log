import { RootState } from './index';

export const selectFilters = (state: RootState) => state.filters;
export const selectUI = (state: RootState) => state.ui;

export const selectHasActiveFilters = (state: RootState) => {
  const filters = state.filters;
  return Boolean(
    filters.searchQuery.trim() ||
      filters.studentId !== 'all' ||
      filters.trackId !== 'all' ||
      filters.sessionStatus !== 'all' ||
      filters.attendance !== 'all' ||
      filters.datePreset !== 'all' ||
      filters.startDate ||
      filters.endDate
  );
};
