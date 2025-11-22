// Моковые данные — используем те же интерфейсы из modules.ts (не обязателен импорт для моков)
const now = new Date().toISOString();

export const users = [
  { id: 1, role: 'reader', username: 'reader', first_name: 'Иван', last_name: 'Иванов', password: 'reader', email: 'ivan@example.com', phone: '+70000000001', birth_date: '1990-01-01', created_at: now, updated_at: now },
  { id: 2, role: 'library', username: 'lib1', first_name: 'Анна', last_name: 'Библиотекарь', password: 'library', email: 'lib@example.com', phone: '+70000000002', birth_date: '1985-05-05', created_at: now, updated_at: now }
];

export const authors = [
  { id: 1, name: 'Александр Пушкин' },
  { id: 2, name: 'Фёдор Достоевский' }
];

export const genres = [
  { id: 1, name: 'Классика' },
  { id: 2, name: 'Роман' }
];

export const bookGroups = [
  { id: 1, title: 'Евгений Онегин', subtitle: null, isbn: '978-1', publisher: 'Изд-во', year: 2000, description: 'Роман в стихах', cover_url: '', age_limit: 12, created_at: now, updated_at: now },
  { id: 2, title: 'Преступление и наказание', subtitle: null, isbn: '978-2', publisher: 'Изд-во', year: 1866, description: 'Роман', cover_url: '', age_limit: 16, created_at: now, updated_at: now }
];

export const bookCopies = [
  { id: 1001, book_group_id: 1, status: 'available', condition: 'good', created_at: now, updated_at: now },
  { id: 1002, book_group_id: 1, status: 'issued', condition: 'worn', created_at: now, updated_at: now },
  { id: 2001, book_group_id: 2, status: 'available', condition: 'new', created_at: now, updated_at: now }
];

export const loans = [
  {
    id: 1,
    copy_id: 1002,
    reader_id: 1,
    issued_by: 2,
    issued_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    due_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    returned_at: null,
    return_condition: null,
    renew_count: 0,
    status: 'active'
  }
];

export const renewRequests = [
  { id: 1, loan_id: 1, requested_by: 1, requested_at: now, new_due_at: null, status: 'pending' }
];
