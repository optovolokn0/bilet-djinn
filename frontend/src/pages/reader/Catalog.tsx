import React, { useMemo, useState } from 'react';

import SearchBar from '../../components/SearchBar';
import BookList from '../../components/BookList';
import { bookGroups, bookCopies } from '../../mocks';
import { type IBookGroup } from '../../modules';

export default function ReaderCatalog(){
  const [q, setQ] = useState('');
  const items = useMemo(() => (bookGroups as IBookGroup[]).filter(b => b.title.toLowerCase().includes(q.toLowerCase()) || String(b.id) === q), [q]);
  const counts = useMemo(() => {
    const map: Record<number,number> = {};
    (bookCopies as any[]).forEach(c => { if (c.status === 'available') map[c.book_group_id] = (map[c.book_group_id] || 0) + 1; });
    return map;
  }, []);
  return (
    <div className="min-h-screen">
      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex gap-4 mb-4">
          <div className="flex-1"><SearchBar value={q} onChange={setQ} placeholder="Название, автор или ID" /></div>
          {/* <div className="w-64"><Filters>
            <div>Автор (заглушка)</div>
            <div>Жанр (заглушка)</div>
            <div>Доступность (заглушка)</div>
            <div>Возраст (заглушка)</div>
          </Filters></div> */}
        </div>
        <BookList items={items} counts={counts} />
      </main>
    </div>
  );
}
