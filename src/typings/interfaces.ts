export interface IGitHubRepo {
  id: number;
  name: string;
  html_url: string;
}

export interface ISession {
  data: Array<IGitHubRepo>;
  id: number;
  opened: boolean;
  request: string;
}

export interface IState {
  loading: boolean;
  sessions: Array<ISession>;
  error: null | string;
}

export interface IRepository {
  name: string;
  url: string;
}

// New query-key history log (rework-state-architecture). A session entry holds
// only its identity + query; repository results are owned by githubApi and
// re-derived live on expand. In Group 3 the old `ISession`/`IState` above are
// removed with `reposSlice`, at which point these become the sole session types.
export interface IHistoryEntry {
  id: number;
  query: string;
}

export interface SearchHistoryState {
  entries: Array<IHistoryEntry>;
  openId: number | null;
}
