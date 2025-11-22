import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';

export const authApi = createApi({
  reducerPath: 'authApi',

  baseQuery: fetchBaseQuery({
    baseUrl: 'https://truly-economic-vervet.cloudpub.ru',

    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.access;

      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),

  endpoints: (builder) => ({
    // вход библиотекаря/админа
    loginLibrary: builder.mutation<
      { access: string; refresh: string },
      { username: string; password: string }
    >({
      query: (body) => ({
        url: '/api/auth/library/login/',
        method: 'POST',
        body,
      }),
    }),

    // вход читателя по билету
    loginReader: builder.mutation<
      { access: string; refresh: string },
      { ticket_number: string; password: string }
    >({
      query: (body) => ({
        url: '/api/auth/reader/login/',
        method: 'POST',
        body,
      }),
    }),

    // обновление токенов
    refresh: builder.mutation<
      { access: string; refresh: string },
      { refresh: string }
    >({
      query: (body) => ({
        url: '/api/auth/refresh/',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginLibraryMutation,
  useLoginReaderMutation,
  useRefreshMutation
} = authApi;
