export interface ISession {
  data: Array<any>;
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
