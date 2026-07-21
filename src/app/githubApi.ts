import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { IGitHubRepo } from 'typings/interfaces';

// The arg carries the session `id` alongside the query text so RTK Query keys
// its cache per session, not per query text: a new session (new id) always
// fetches fresh — even when the text repeats — while re-expanding the same
// session reuses its own cached entry within `keepUnusedDataFor`.
export interface SearchReposArg {
  id: number;
  q: string;
}

interface SearchReposResponse {
  items: Array<IGitHubRepo>;
}

export const githubApi = createApi({
  reducerPath: 'githubApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.github.com' }),
  endpoints: builder => ({
    searchRepos: builder.query<Array<IGitHubRepo>, SearchReposArg>({
      query: ({ q }) =>
        `/search/repositories?q=${encodeURIComponent(q)}&per_page=8`,
      transformResponse: (response: SearchReposResponse) => response.items,
      keepUnusedDataFor: 300,
    }),
  }),
});

export const { useSearchReposQuery } = githubApi;
