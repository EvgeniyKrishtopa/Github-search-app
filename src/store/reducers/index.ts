import { combineReducers } from 'redux';
import repos from './reducers';

export const rootReducer = combineReducers({ repos });
export type RootState = ReturnType<typeof rootReducer>;
