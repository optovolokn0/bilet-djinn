const now = new Date().toISOString();

export const users = [
  { id: 1423422, role: 'reader', username: 'reader', first_name: 'Иван', last_name: 'Иванов', password: 'reader', email: 'ivan@example.com', phone: '+70000000001', birth_date: '1990-01-01', created_at: now, updated_at: now },
  { id: 2552466, role: 'library', username: 'lib1', first_name: 'Анна', last_name: 'Библиотекарь', password: 'library', email: 'lib@example.com', phone: '+70000000002', birth_date: '1985-05-05', created_at: now, updated_at: now },
  { id: 3552467, role: 'reader', username: 'reader2', first_name: 'Пётр', last_name: 'Петров', password: 'reader2', email: 'petr@example.com', phone: '+70000000003', birth_date: '1992-07-10', created_at: now, updated_at: now }
];

export const authors = [
  { id: 1, name: 'Александр Пушкин' },
  { id: 2, name: 'Фёдор Достоевский' },
  { id: 3, name: 'Николай Гоголь' },
  { id: 4, name: 'Лев Толстой' },
  { id: 5, name: 'Антон Чехов' }
];

export const genres = [
  { id: 1, name: 'Классика' },
  { id: 2, name: 'Роман' },
  { id: 3, name: 'Драма' },
  { id: 4, name: 'Поэзия' },
  { id: 5, name: 'Рассказ' }
];

export const bookGroups = [
  { id: 1, title: 'Евгений Онегин', subtitle: null, authors: [authors[0]], genres: [genres[0], genres[3]], isbn: '978-1', publisher: 'Изд-во А', year: 2000, description: 'Роман в стихах', cover_url: '', age_limit: 12, created_at: now, updated_at: now },
  { id: 2, title: 'Преступление и наказание', subtitle: null, authors: [authors[1]], genres: [genres[1], genres[2]], isbn: '978-2', publisher: 'Изд-во Б', year: 1866, description: 'Роман', cover_url: '', age_limit: 16, created_at: now, updated_at: now },
  { id: 3, title: 'Горе от ума', subtitle: null, authors: [authors[2]], genres: [genres[2]], isbn: '978-3', publisher: 'Изд-во В', year: 1833, description: 'Комедия', cover_url: '', age_limit: 14, created_at: now, updated_at: now },
  { id: 4, title: 'Война и мир', subtitle: null, authors: [authors[3]], genres: [genres[0], genres[1]], isbn: '978-4', publisher: 'Изд-во Г', year: 1869, description: 'Роман-эпопея', cover_url: '', age_limit: 16, created_at: now, updated_at: now },
  { id: 5, title: 'Толстый и тонкий', subtitle: null, authors: [authors[4]], genres: [genres[4]], isbn: '978-5', publisher: 'Изд-во Д', year: 1883, description: 'Рассказ', cover_url: '', age_limit: 12, created_at: now, updated_at: now },
  { id: 6, title: 'Анна Каренина', subtitle: null, authors: [authors[3]], genres: [genres[1], genres[2]], isbn: '978-6', publisher: 'Изд-во Е', year: 1877, description: 'Роман', cover_url: '', age_limit: 16, created_at: now, updated_at: now },
  { id: 7, title: 'Мёртвые души', subtitle: null, authors: [authors[2]], genres: [genres[0], genres[2]], isbn: '978-7', publisher: 'Изд-во Ж', year: 1842, description: 'Поэма', cover_url: '', age_limit: 14, created_at: now, updated_at: now },
  { id: 8, title: 'Идиот', subtitle: null, authors: [authors[1]], genres: [genres[1], genres[2]], isbn: '978-8', publisher: 'Изд-во З', year: 1869, description: 'Роман', cover_url: '', age_limit: 16, created_at: now, updated_at: now },
  { id: 9, title: 'Ревизор', subtitle: null, authors: [authors[2]], genres: [genres[2]], isbn: '978-9', publisher: 'Изд-во И', year: 1836, description: 'Комедия', cover_url: '', age_limit: 14, created_at: now, updated_at: now },
  { id: 10, title: 'Капитанская дочка', subtitle: null, authors: [authors[0]], genres: [genres[1]], isbn: '978-10', publisher: 'Изд-во К', year: 1836, description: 'Роман', cover_url: '', age_limit: 12, created_at: now, updated_at: now }
];

export const bookCopies = [
  { id: 1001, book_group_id: 1, status: 'available', condition: 'good', created_at: now, updated_at: now },
  { id: 1002, book_group_id: 1, status: 'issued', condition: 'worn', created_at: now, updated_at: now },
  { id: 2001, book_group_id: 2, status: 'available', condition: 'new', created_at: now, updated_at: now },
  { id: 2002, book_group_id: 2, status: 'available', condition: 'good', created_at: now, updated_at: now },
  { id: 3001, book_group_id: 3, status: 'available', condition: 'good', created_at: now, updated_at: now },
  { id: 4001, book_group_id: 4, status: 'reserved', condition: 'new', created_at: now, updated_at: now },
  { id: 5001, book_group_id: 5, status: 'available', condition: 'good', created_at: now, updated_at: now },
  { id: 6001, book_group_id: 6, status: 'issued', condition: 'good', created_at: now, updated_at: now },
  { id: 7001, book_group_id: 7, status: 'available', condition: 'worn', created_at: now, updated_at: now },
  { id: 8001, book_group_id: 8, status: 'available', condition: 'new', created_at: now, updated_at: now },
  { id: 9001, book_group_id: 9, status: 'available', condition: 'good', created_at: now, updated_at: now },
  { id: 10001, book_group_id: 10, status: 'available', condition: 'good', created_at: now, updated_at: now }
];

export const loans = [
  {
    id: 1,
    copy_id: 1002,
    reader_id: 1423422,
    issued_by: 2552466,
    issued_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    due_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    returned_at: null,
    return_condition: null,
    renew_count: 0,
    status: 'active'
  }
];

export const renewRequests = [
  { id: 1, loan_id: 1, requested_by: 1423422, requested_at: now, new_due_at: null, status: 'pending' }
];
