import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IUser } from '../../modules';

interface AuthState {
  access: string | null;
  refresh: string | null;
  user: IUser | null;
}

const initialState: AuthState = {
  access: null,
  refresh: null,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ access: string; refresh: string; user: IUser }>
    ) => {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh;
      state.user = action.payload.user;
      localStorage.setItem(
        'auth',
        JSON.stringify({
          access: state.access,
          refresh: state.refresh,
          user: state.user,
        })
      );
    },
    logout: (state) => {
      state.access = null;
      state.refresh = null;
      state.user = null;
      localStorage.removeItem('auth');
    },
    loadFromStorage: (state) => {
      const saved = localStorage.getItem('auth');
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved);
        state.access = parsed.access ?? null;
        state.refresh = parsed.refresh ?? null;
        state.user = parsed.user ?? null;
      } catch (e) {
        console.error('Ошибка парсинга auth из localStorage', e);
      }
    },
  },
});

export const { setCredentials, logout, loadFromStorage } = authSlice.actions;
export default authSlice.reducer;
