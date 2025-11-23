// src/pages/ReaderEvents.tsx
import React, { useMemo, useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { events as mockEvents } from '../mocks';
import type { IEventWithAvailability } from '../modules';
import SearchBar from '../components/SearchBar';

export default function ReaderEvents() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // --- Дебаунс поиска 300мс ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // --- Маппинг mockEvents в IEventWithAvailability и фильтрация ---
  const events: IEventWithAvailability[] = useMemo(() => {
    return mockEvents
      .map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date_time: e.start_at,
        duration_minutes: e.duration_minutes,
        total_seats: e.capacity,
        booked_seats: e.participants_count,
        free_seats: (e.capacity ?? 0) - (e.participants_count ?? 0),
        is_full: (e.participants_count ?? 0) >= (e.capacity ?? 0),
        cover_url: e.cover_url ?? e.cover_image ?? '',
        created_by: e.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      .filter(e => e.title.toLowerCase().includes(debouncedSearch));
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
          <EventCard key={event.id} event={event} />
        ))}

        {events.length === 0 && (
          <p className="text-gray-500 mt-4">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
