import React, { useMemo, useState, useEffect } from 'react';
import SearchBar from '../../components/SearchBar';
import BookList from '../../components/BookList';
import { bookGroups, bookCopies } from '../../mocks';
import { type IBookGroup } from '../../modules';

export default function ReaderCatalog() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState(q);

  // Эффект для debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);

    return () => clearTimeout(handler);
  }, [q]);

  const items = useMemo(() =>
    (bookGroups as IBookGroup[]).filter(b => {
      const query = debouncedQ.toLowerCase();
      const inTitle = b.title.toLowerCase().includes(query);
      const inAuthors = b.authors?.some(a => a.name.toLowerCase().includes(query));
      const inId = String(b.id) === debouncedQ;
      return inTitle || inAuthors || inId;
    })
    , [debouncedQ]);

  const counts = useMemo(() => {
    const map: Record<number, number> = {};
    (bookCopies as any[]).forEach(c => {
      if (c.status === 'available') map[c.book_group_id] = (map[c.book_group_id] || 0) + 1;
    });
    return map;
  }, []);

  return (
    <div className="book-catalog">
      <h2 className='book-catalog title'>Каталог книг библиотекаря</h2>
      <SearchBar value={q} onChange={setQ} placeholder="Название, автор или ID" />
      <BookList items={items} counts={counts} />
    </div>
  );
}
