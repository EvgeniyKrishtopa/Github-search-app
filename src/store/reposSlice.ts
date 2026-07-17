import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IGitHubRepo, IState } from 'typings/interfaces';

const HISTORY_CAP = 5;

const initialState: IState = {
  loading: false,
  sessions: [],
  error: null,
};

interface IFetchReposResult {
  repos: Array<IGitHubRepo>;
  request: string;
  id: number;
}

export const fetchRepos = createAsyncThunk<
  IFetchReposResult,
  string,
  { rejectValue: string }
>('repos/fetchRepos', async (request, { rejectWithValue }) => {
  let response: Response;

  try {
    response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(
        request,
      )}&per_page=8`,
    );
  } catch {
    return rejectWithValue('Network error. Please try again.');
  }

  if (!response.ok) {
    return rejectWithValue(response.statusText);
  }

  const data = await response.json();
  return { repos: data.items as Array<IGitHubRepo>, request, id: Date.now() };
});

const reposSlice = createSlice({
  name: 'repos',
  initialState,
  reducers: {
    changeSessionOpenedStatus: (state, action: PayloadAction<number>) => {
      state.sessions.forEach(session => {
        session.opened =
          session.id === action.payload ? !session.opened : false;
      });
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchRepos.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRepos.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions.forEach(session => {
          session.opened = false;
        });
        if (state.sessions.length >= HISTORY_CAP) {
          state.sessions.pop();
        }
        state.sessions.unshift({
          request: action.payload.request,
          data: action.payload.repos,
          opened: true,
          id: action.payload.id,
        });
      })
      .addCase(fetchRepos.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? action.error.message ?? 'Something went wrong';
      });
  },
});

export const { changeSessionOpenedStatus } = reposSlice.actions;
export default reposSlice.reducer;
