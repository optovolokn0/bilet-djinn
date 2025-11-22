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

  // оригинальные объекты из API
  const [events, setEvents] = useState<IEvent[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<number[]>([]);

  // локальные ID, на которые пользователь записан (если есть endpoint — можно заменить fetch'ем)
  const [registeredIds, setRegisteredIds] = useState<number[]>(() => {
    try {
      const key = `registered_${user?.id ?? 'anon'}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as number[] : [];
    } catch { return []; }
  });

  const isReader = user?.role === 'reader';
  const isLibrarian = user?.role === 'library';

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // fetch list
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/events/`, { headers });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data: IEvent[] = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[EventsPage] fetchEvents error:', err);
    } finally {
      setLoading(false);
    }
  };

  // reload on token or mount
  useEffect(() => { fetchEvents(); }, [token]);

  // helper: map IEvent -> IEventWithAvailability (includes is_registered from registeredIds)
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
    cover_url: e.cover_url ?? e.cover_image ?? '',
    created_by: e.created_by,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_registered: registeredIds.includes(e.id),
  });

  const filteredEvents: IEventWithAvailability[] = events
    .filter(e => e.title.toLowerCase().includes(debouncedSearch || ''))
    .map(toUI);

  // persist registeredIds (per user)
  useEffect(() => {
    try {
      const key = `registered_${user?.id ?? 'anon'}`;
      localStorage.setItem(key, JSON.stringify(registeredIds));
    } catch { /* ignore */ }
  }, [registeredIds, user?.id]);

  // register
  const handleRegister = async (id: number) => {
    if (!token) { alert('Требуется авторизация'); return; }
    if (processingIds.includes(id)) return;

    setProcessingIds(prev => [...prev, id]);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}/register/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      // backend updates seats_left → fetch updated event
      const single = await fetch(`${API_BASE_URL}/events/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!single.ok) throw new Error('Не удалось загрузить обновлённый ивент');
      const updated: IEvent = await single.json();

      setEvents(prev => prev.map(ev => ev.id === id ? updated : ev));

      // пометим локально, что пользователь записан на этот id
      setRegisteredIds(prev => Array.from(new Set([...prev, id])));
    } catch (err: any) {
      console.error('[EventsPage] register error:', err);
      alert(err?.message || 'Не удалось зарегистрироваться на мероприятие');
    } finally {
      setProcessingIds(prev => prev.filter(x => x !== id));
    }
  };

  // unregister
  const handleUnregister = async (id: number) => {
    if (!token) { alert('Требуется авторизация'); return; }
    if (processingIds.includes(id)) return;

    setProcessingIds(prev => [...prev, id]);
    try {
      const res = await fetch(`${API_BASE_URL}/events/${id}/unregister/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const single = await fetch(`${API_BASE_URL}/events/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!single.ok) throw new Error('Не удалось загрузить обновлённый ивент');
      const updated: IEvent = await single.json();

      setEvents(prev => prev.map(ev => ev.id === id ? updated : ev));

      setRegisteredIds(prev => prev.filter(x => x !== id));
    } catch (err: any) {
      console.error('[EventsPage] unregister error:', err);
      alert(err?.message || 'Не удалось отменить запись на мероприятие');
    } finally {
      setProcessingIds(prev => prev.filter(x => x !== id));
    }
  };

  // unified toggle handler (передаём её в карточку)
  const handleToggleRegister = (id: number, currentlyRegistered: boolean) => {
    if (currentlyRegistered) handleUnregister(id);
    else handleRegister(id);
  };

  // edit/delete
  const handleEditOpen = (id: number) => {
    const orig = events.find(x => x.id === id) ?? null;
    setEditingEvent(orig);
    setEditModalOpen(true);
  };
  const handleEditClose = () => { setEditingEvent(null); setEditModalOpen(false); };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы точно хотите удалить это мероприятие?')) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/events/${id}/`, { method: 'DELETE', headers });
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

  const onCreated = async () => { await fetchEvents(); setCreateModalOpen(false); };
  const onUpdated = async () => { await fetchEvents(); handleEditClose(); };

  return (
    <div className="events-page">
      <h2 className="events-title">Мероприятия</h2>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Поиск по названию..." />
        {isLibrarian && <button className="btn create-btn" onClick={() => setCreateModalOpen(true)}>Создать мероприятие</button>}
      </div>

      {loading ? (
        <p>Загрузка мероприятий...</p>
      ) : (
        <div className="events-list">
          {filteredEvents.map(e => (
            <EventCard
              key={e.id}
              event={e}
              onToggleRegister={isReader ? handleToggleRegister : undefined}
              onEdit={isLibrarian ? handleEditOpen : undefined}
              onDelete={isLibrarian ? handleDelete : undefined}
              processingIds={processingIds}
            />
          ))}
          {filteredEvents.length === 0 && <p className="text-gray-500 mt-4">Ничего не найдено</p>}
        </div>
      )}

      <CreateEventModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} onCreated={onCreated} />

      {editingEvent && (
        <EditEventModal isOpen={editModalOpen} onClose={handleEditClose} onUpdated={onUpdated} event={editingEvent} />
      )}
    </div>
  );
}
