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
