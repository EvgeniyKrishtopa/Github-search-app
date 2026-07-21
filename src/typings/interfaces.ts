export interface IGitHubRepo {
  id: number;
  name: string;
  html_url: string;
}

// A history entry holds only its identity + query; repository results are owned
// by githubApi and re-derived live on expand (rework-state-architecture).
export interface ISession {
  id: number;
  query: string;
}

export interface SearchHistoryState {
  entries: Array<ISession>;
  openId: number | null;
}

export interface IRepository {
  name: string;
  url: string;
}
