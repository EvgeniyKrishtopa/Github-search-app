import { createSlice } from '@reduxjs/toolkit';
import type { ThemeMode } from 'app/theme/palettes';
import type { RootState } from 'app/store';

export interface ThemeState {
  mode: ThemeMode;
}

// Default is resolved at store creation by loadThemeMode() (persisted → OS → dark)
// and injected as preloadedState; this fallback only applies if the slice is used
// without hydration (design D2).
const initialState: ThemeState = { mode: 'dark' };

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // The whole two-theme invariant lives in this one reducer, mirroring
    // searchHistory's single-reducer toggle (design D2).
    toggleTheme: state => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
  },
});

export const { toggleTheme } = themeSlice.actions;

export const selectThemeMode = (state: RootState): ThemeMode =>
  state.theme.mode;

export default themeSlice.reducer;
