// 1. Добавляем 'admin' в UserRole
export type UserRole = 'reader' | 'library' | 'admin';

export interface IUser {
  id: number;
  role: UserRole;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  password?: string; // Делаем необязательным, так как при получении списка хеш может не приходить или не нужен
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  created_at?: string;
  updated_at?: string;
  // Поля, специфичные для читателя, которые могут прийти
  ticket_number?: string;
  contract_number?: string;
}

// Тип для создания Библиотекаря
export interface ICreateLibrarianPayload {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string;
  password: string;
  role: 'library';
}

// Тип для создания Читателя
export interface ICreateReaderPayload {
  ticket_number: string;
  contract_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string;
  role: 'reader';
}

export interface IAuthor { id: number; name: string; }
export interface IGenre { id: number; name: string; }

export interface IBookGroup {
  id: number;
  title: string;
  subtitle?: string | null;
  authors: IAuthor[];   // вместо author: string
  genres?: IGenre[];    // для фильтров по жанрам
  isbn?: string | null;
  publisher?: string | null;
  year?: number | null;
  description?: string | null;
  cover_image?: string | null; // URL для обложки (важно!)
  copies_count: number; // Общее количество копий
  available_count: number; // Доступное количество копий (важно!)

  age_limit?: number | null;
  created_at: string;
  updated_at: string;
}

export interface IBookCopy {
  id: number;
  book_group_id: number;
  status: 'available' | 'issued' | 'lost' | 'reserved';
  condition?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ILoan {
  id: number;
  copy_id: number;
  reader_id: number;
  issued_by?: number | null;
  issued_at: string;
  due_at: string;
  returned_at?: string | null;
  return_condition?: string | null;
  renew_count: number;
  status: 'active' | 'returned' | 'overdue' | 'cancelled';
}

export interface IRenewRequest {
  id: number;
  loan_id: number;
  requested_by: number;
  requested_at: string;
  new_due_at?: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

// src/modules/events.ts
export interface IEvent {
  id: number;
  title: string;
  description: string;
  start_at: string;
  duration_minutes: number;
  capacity: number;
  cover_url: string;
  cover_image: string | null;
  created_by: number;
  participants_count: number;
  seats_left: number;
}

export interface IEventWithAvailability {
  id: number;
  title: string;
  description: string;
  date_time: string;
  duration_minutes: number;
  total_seats: number;
  booked_seats: number;
  free_seats: number;
  is_full: boolean;
  cover_url?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_registered?: boolean; // новый флаг для текущего пользователя
}


export interface IEventFromApi {
  id: number;
  title: string;
  description: string;
  start_at: string;
  duration_minutes: number;
  capacity: number;
  cover_url: string | null;
  cover_image: string | null;
  created_by: number;
  participants_count: number;
  seats_left: number;
}

export interface IEventUI extends IEventFromApi {
  date_time: string;       // дублируем start_at для удобства UI
  is_full: boolean;
  is_registered?: boolean; // для текущего пользователя
}

