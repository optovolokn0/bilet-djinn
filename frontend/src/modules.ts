export type UserRole = 'reader' | 'library';

export interface IUser {
  id: number;
  role: UserRole;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  password: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null; // ISO date
  created_at: string;
  updated_at: string;
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
  cover_url?: string | null;
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
