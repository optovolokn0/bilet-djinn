import React, { useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import SearchBar from '../components/SearchBar';
import CreateEventModal from '../components/modals/CreateEventModal';
import EditEventModal from '../components/modals/EditEventModal';
import { useAppSelector } from '../hooks';
import { API_BASE_URL } from '../config';
import type { IEvent, IEventWithAvailability } from '../modules';

export default function EventsPage() {
  const user = useAppSelector(s => s.auth.user);
  const token = useAppSelector(s => s.auth.access);

  const [events, setEvents] = useState<IEvent[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isReader = user?.role === 'reader';
  const isLibrarian = user?.role === 'library';

  // debounce для поиска
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      console.log('[EventsPage] fetch events, auth:', !!token);
      const res = await fetch(`${API_BASE_URL}/events/`, { headers });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data: IEvent[] = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[EventsPage] fetchEvents error:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // преобразование IEvent -> IEventWithAvailability для EventCard
  const toUI = (e: IEvent): IEventWithAvailability => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date_time: e.start_at,
    duration_minutes: e.duration_minutes,
    total_seats: e.capacity,
    booked_seats: e.participants_count,
    free_seats: e.seats_left,
    is_full: (e.seats_left ?? 0) <= 0,
    cover_url: e.cover_url,
    created_by: e.created_by,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const filteredEvents: IEventWithAvailability[] = events
    .filter(e => e.title.toLowerCase().includes(debouncedSearch || ''))
    .map(toUI);

  // actions
  const handleSign = async (id: number) => {
    // заглушка: можно реализовать POST /api/events/{id}/participate/ или т.п.
    alert(`Вы записались на мероприятие ${id}`);
    // await fetchEvents();
  };

  const handleEditOpen = (id: number) => {
    const evt = events.find(x => x.id === id) ?? null;
    setEditingEvent(evt);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditingEvent(null);
    setEditModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы точно хотите удалить это мероприятие?')) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/events/${id}/`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      await fetchEvents();
    } catch (err: any) {
      console.error('[EventsPage] delete error:', err);
      alert(err?.message || 'Не удалось удалить мероприятие');
    }
  };

  const onCreated = async () => {
    await fetchEvents();
    setCreateModalOpen(false);
  };

  const onUpdated = async () => {
    await fetchEvents();
    handleEditClose();
  };

  return (
    <div className="events-page">
      <h2 className="events-title">Мероприятия</h2>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Поиск по названию..." />
        {isLibrarian && (
          <button className="btn create-btn" onClick={() => setCreateModalOpen(true)}>
            Создать мероприятие
          </button>
        )}
      </div>

      {loading ? (
        <p>Загрузка мероприятий...</p>
      ) : (
        <div className="events-list">
          {filteredEvents.map(e => (
            <EventCard
              key={e.id}
              event={e}
              onSign={isReader ? handleSign : undefined}
              onEdit={isLibrarian ? handleEditOpen : undefined}
              onDelete={isLibrarian ? handleDelete : undefined}
            />
          ))}
          {filteredEvents.length === 0 && <p className="text-gray-500 mt-4">Ничего не найдено</p>}
        </div>
      )}

      <CreateEventModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreated={onCreated} />

      {editingEvent && (
        <EditEventModal
          isOpen={editModalOpen}
          onClose={handleEditClose}
          onUpdated={onUpdated}
          event={editingEvent}
        />
      )}
    </div>
  );
}
