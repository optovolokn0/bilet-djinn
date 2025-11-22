import React, { useMemo, useState, useEffect } from 'react';
import SearchBar from '../../components/SearchBar';
import BookList from '../../components/BookList';
import { type IBookGroup } from '../../modules'; // IBookGroup теперь должен содержать available_count
import { useAppSelector } from '../../hooks';
import { fetchBookGroups } from '../../api/books';

export default function ReaderCatalog() {
  const token = useAppSelector(state => state.auth.access);

  // --- Состояние данных ---
  const [allBookGroups, setAllBookGroups] = useState<IBookGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Состояние поиска ---
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState(q);

  // Эффект для debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);

    return () => clearTimeout(handler);
  }, [q]);

  // --- Эффект для загрузки данных из API ---
  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setLoadError("Ошибка аутентификации: токен не найден.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await fetchBookGroups(token);
        // data уже содержит поля copies_count и available_count
        setAllBookGroups(data);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
        setLoadError("Не удалось загрузить каталог книг.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Фильтрация: теперь использует allBookGroups
  const items = useMemo(() =>
    allBookGroups.filter(b => {
      const query = debouncedQ.toLowerCase();
      const inTitle = b.title.toLowerCase().includes(query);
      const inAuthors = b.authors?.some(a => a.name.toLowerCase().includes(query));
      // Поиск по ID
      const inId = String(b.id) === debouncedQ.trim(); 
      return inTitle || inAuthors || inId;
    })
    , [debouncedQ, allBookGroups]);

  // <-- ИЗМЕНЕНИЕ: Корректный подсчет доступных книг
  const counts = useMemo(() => {
    const map: Record<number, number> = {};
    allBookGroups.forEach(bg => {
      // Используем поле available_count, приходящее с бэкенда
      map[bg.id] = bg.available_count || 0; 
    });
    return map;
  }, [allBookGroups]);
  // -->

  return (
    <div className="book-catalog">
      <h2 className='book-catalog title'>Каталог книг библиотекаря</h2>
      <SearchBar value={q} onChange={setQ} placeholder="Название, автор или ID" />

      {isLoading && <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка каталога...</div>}
      {loadError && <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>Ошибка: {loadError}</div>}

      {!isLoading && !loadError && items.length > 0 && (
        <BookList items={items} counts={counts} />
      )}
      {!isLoading && !loadError && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px' }}>{q ? 'Ничего не найдено.' : 'Каталог пуст.'}</div>
      )}
    </div>
  );
}