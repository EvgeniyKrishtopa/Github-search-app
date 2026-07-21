import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ISession, SearchHistoryState } from 'typings/interfaces';

const HISTORY_CAP = 5;

const initialState: SearchHistoryState = {
  entries: [],
  openId: null,
};

const searchHistorySlice = createSlice({
  name: 'searchHistory',
  initialState,
  reducers: {
    addSession: {
      // Identity is assigned here, in the slice, so `Date.now()` never lives in
      // a component and the id-uniqueness rule is unit-testable (design D2).
      prepare: (query: string) => ({ payload: { id: Date.now(), query } }),
      reducer: (state, action: PayloadAction<ISession>) => {
        if (state.entries.length >= HISTORY_CAP) {
          state.entries.pop();
        }
        state.entries.unshift(action.payload);
        state.openId = action.payload.id;
      },
    },
    // The whole single-open invariant lives in this one reducer, never in a
    // component (design D3).
    toggleSession: (state, action: PayloadAction<number>) => {
      state.openId = state.openId === action.payload ? null : action.payload;
    },
  },
});

export const { addSession, toggleSession } = searchHistorySlice.actions;
export default searchHistorySlice.reducer;
