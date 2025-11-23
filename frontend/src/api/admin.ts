// src/api/admin.ts
import axios from 'axios'; // Или ваш настроенный инстанс
// import { apiInstance } from './index'; 

const BASE_URL = 'https://truly-economic-vervet.cloudpub.ru/api'; // Замените на ваш URL

// Вспомогательная функция заголовков (если нет интерцептора)
const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const adminApi = {
  // Логин админа
  login: async (credentials: {username: string, password: string}) => {
    const response = await axios.post(`${BASE_URL}/auth/admin/login/`, credentials);
    return response.data;
  },

  // Получить всех пользователей
  getAllUsers: async () => {
    const response = await axios.get(`${BASE_URL}/users/`, getAuthHeaders());
    return response.data;
  },

  // Удалить пользователя
  deleteUser: async (id: number) => {
    const response = await axios.delete(`${BASE_URL}/users/${id}/`, getAuthHeaders());
    return response.data;
  },

  // Создать библиотекаря
  createLibrarian: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/users/create-library/`, data, getAuthHeaders());
    return response.data;
  },

  // Создать читателя
  createReader: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/users/`, data, getAuthHeaders());
    return response.data;
  }
};