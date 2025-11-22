// src/app/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';
import { logout, setCredentials } from '../features/auth/authSlice';


/**
 * Базовый URL — из твоего сообщения
 * В endpoints используем относительные пути:
 * POST /auth/library/login/
 * POST /auth/reader/login/
 * POST /users/
 */
const baseUrl = 'https://truly-economic-vervet.cloudpub.ru/api';

const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithAuth: typeof baseQuery = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  // если 401 — простой поворот: разлогиниваемся (пользователь должен перелогиниться)
  if (result.error && (result.error as any).status === 401) {
    // можно дополнительно попытаться обновить токен если есть эндпоинт refresh
    api.dispatch(logout());
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['User', 'Event'],
  endpoints: (build) => ({
    // login для библиотекаря / админа (POST /auth/library/login/)
    libraryLogin: build.mutation<{ access: string; refresh: string }, { username: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/library/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    // login для читателя (POST /auth/reader/login/)
    readerLogin: build.mutation<{ access: string; refresh: string }, { ticket_number: string; password: string }>({
      query: (cred) => ({
        url: '/auth/reader/login/',
        method: 'POST',
        body: cred,
      }),
    }),
    // create user (admin) POST /users/
    createUser: build.mutation<
      {
        id: number;
        ticket_number: string;
        contract_number?: string;
        first_name: string;
        last_name: string;
        phone: string;
        birth_date: string;
        role: string;
        password: string;
      },
      {
        ticket_number: string;
        contract_number?: string;
        first_name: string;
        last_name: string;
        phone: string;
        birth_date: string;
        role: string;
      }
    >({
      query: (body) => ({
        url: '/users/',
        method: 'POST',
        body,
      }),
    }),

    // Примеры: получить список событий (опционально, если понадобятся later)
    getEvents: build.query<any[], void>({
      query: () => ({ url: '/events/', method: 'GET' }),
      providesTags: ['Event'],
    }),
    // можно добавить другие endpoint'ы по необходимости
  }),
});

export const {
  useLibraryLoginMutation,
  useReaderLoginMutation,
  useCreateUserMutation,
  useGetEventsQuery,
} = api;
