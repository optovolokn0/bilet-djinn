// src/api/books.ts
import { API_BASE_URL } from "../config";
import type { IBookGroup } from "../modules";

const BOOK_GROUPS_URL = `${API_BASE_URL}/book-groups/`;
const BOOK_COPIES_URL = `${API_BASE_URL}/book-copies/`;

// --- Интерфейсы ---

export interface ICreateBookCopyPayload {
  id: number;
  book_group_id: number;
  status: 'available' | 'issued' | 'lost' | 'maintenance' | 'reserved';
  condition?: string;
  created_at?: string;
}

// --- Функции API ---

// 1. Получить список всех групп книг (для автокомплита)
export const fetchBookGroups = async (token: string): Promise<IBookGroup[]> => {
  const res = await fetch(BOOK_GROUPS_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Не удалось загрузить список книг");
  }
  return res.json();
};

// 2. Создать новую группу книг (Теперь принимает FormData)
export const createBookGroup = async (token: string, data: FormData): Promise<IBookGroup> => {
  const res = await fetch(BOOK_GROUPS_URL, {
    method: "POST",
    headers: {
      // Content-Type НЕ указываем, браузер сам поставит multipart/form-data boundary
      Authorization: `Bearer ${token}`,
    },
    body: data, // Отправляем FormData напрямую
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Не удалось создать группу книг");
  }
  
  return res.json();
};

// 3. Создать экземпляр (копию) книги
export const createBookCopy = async (token: string, data: ICreateBookCopyPayload): Promise<any> => {
  const res = await fetch(BOOK_COPIES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Не удалось создать экземпляр ID: ${data.id}`);
  }
  
  return res.json();
};