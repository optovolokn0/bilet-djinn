import React, { useMemo, useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { events as mockEvents } from '../mocks';
import { type IEventWithAvailability } from '../modules';
import SearchBar from './SearchBar';

export default function ReaderEvents() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // --- Задержка 300мс ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // --- Вычисляемые поля + фильтрация ---
  const events: IEventWithAvailability[] = useMemo(() => {
    return mockEvents
      .map(e => ({
        ...e,
        free_seats: e.total_seats - e.booked_seats,
        is_full: e.booked_seats >= e.total_seats
      }))
      .filter(e =>
        e.title.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
  }, [debouncedSearch]);

  return (
    <div className="reader-events">
      <h2 className="events-title">Список мероприятий</h2>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Поиск по названию..."
      />

      <div className="events-list">
        {events.map(event => (
          <EventCard
            key={event.id}
            event={event}
          />
        ))}

        {events.length === 0 && (
          <p className="text-gray-500 mt-4">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
