// ==========================
// USERS
// ==========================
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

// ==========================
// AUTHORS
// ==========================
export interface IAuthor {
  id: number;
  name: string;
}

// ==========================
// GENRES
// ==========================
export interface IGenre {
  id: number;
  name: string;
}

// ==========================
// BOOK GROUPS
// ==========================
export interface IBookGroup {
  id: number;
  title: string;
  subtitle: string | null;
  isbn: string | null;
  publisher: string | null;
  year: number | null;
  description: string | null;
  cover_url: string | null;
  age_limit: number | null;
  created_at: string;
  updated_at: string;
}

// Relations
export interface IBookGroupAuthor {
  book_group_id: number;
  author_id: number;
}

export interface IBookGroupGenre {
  book_group_id: number;
  genre_id: number;
}

// ==========================
// BOOK COPIES
// ==========================
export type CopyStatus = 'available' | 'issued' | 'lost' | 'reserved';

export interface IBookCopy {
  id: number;
  book_group_id: number;
  status: CopyStatus;
  condition: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================
// LOANS
// ==========================
export type LoanStatus = 'active' | 'returned' | 'overdue' | 'cancelled';

export interface ILoan {
  id: number;
  copy_id: number;
  reader_id: number;
  issued_by: number | null;
  issued_at: string;
  due_at: string;
  returned_at: string | null;
  return_condition: string | null;
  renew_count: number;
  status: LoanStatus;
}

// ==========================
// RENEW REQUESTS
// ==========================
export type RenewRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IRenewRequest {
  id: number;
  loan_id: number;
  requested_by: number;
  requested_at: string;
  new_due_at: string | null;
  status: RenewRequestStatus;
}
