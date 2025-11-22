// src/pages/EventsPage.tsx
import React, { useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import SearchBar from '../components/SearchBar';
import CreateEventModal from '../components/modals/CreateEventModal';
import EditEventModal from '../components/modals/EditEventModal';
import { useAppSelector } from '../hooks';
import { API_BASE_URL } from '../config';
import type { IEvent, IEventWithAvailability } from '../modules';

type ViewMode = 'all' | 'mine';

export default function EventsPage() {
    const user = useAppSelector(s => s.auth.user);
    const token = useAppSelector(s => s.auth.access);

    // оригинальные объекты из API (все мероприятия) и мероприятия текущего пользователя
    const [events, setEvents] = useState<IEvent[]>([]);
    const [myEvents, setMyEvents] = useState<IEvent[]>([]);
    const [view, setView] = useState<ViewMode>('all');

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [processingIds, setProcessingIds] = useState<number[]>([]);

    // registeredIds — список id мероприятий, на которые текущий пользователь записан
    const [registeredIds, setRegisteredIds] = useState<number[]>([]);

    const isReader = user?.role === 'reader';
    const isLibrarian = user?.role === 'library';

    // debounced search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
        return () => clearTimeout(t);
    }, [search]);

    // Fetch all events
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
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch my events (events where current user is participant)
    const fetchMyEvents = async () => {
        if (!token) {
            setMyEvents([]);
            setRegisteredIds([]);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/events/me/`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                throw new Error(txt || `HTTP ${res.status}`);
            }
            const data: IEvent[] = await res.json();
            setMyEvents(Array.isArray(data) ? data : []);

            // Update registeredIds from response
            const ids = (Array.isArray(data) ? data : []).map(d => d.id);
            setRegisteredIds(ids);
        } catch (err: any) {
            console.error('[EventsPage] fetchMyEvents error:', err);
            setMyEvents([]);
            setRegisteredIds([]);
        }
    };

    // On mount and when token changes, load events and (if reader) my events
    useEffect(() => {
        fetchEvents();
        if (token && isReader) {
            fetchMyEvents();
        } else {
            setMyEvents([]);
            setRegisteredIds([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Map IEvent -> IEventWithAvailability (and attach is_registered using registeredIds)
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
        // is_registered is not in original type but allowed by your interface
        is_registered: registeredIds.includes(e.id),
    });

    // Choose source by view mode
    const sourceEvents = view === 'all' ? events : myEvents;

    // filtered + mapped
    const filteredEvents: IEventWithAvailability[] = sourceEvents
        .filter(e => e.title.toLowerCase().includes(debouncedSearch || ''))
        .map(toUI);

    // Register handler
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

            // backend updates seats_left — refresh both all-events and my-events
            await Promise.all([
                fetchEvents(),
                fetchMyEvents(),
            ]);
        } catch (err: any) {
            console.error('[EventsPage] register error:', err);
            alert(err?.message || 'Не удалось зарегистрироваться на мероприятие');
        } finally {
            setProcessingIds(prev => prev.filter(x => x !== id));
        }
    };

    // Unregister handler
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

            // refresh lists
            await Promise.all([
                fetchEvents(),
                fetchMyEvents(),
            ]);
        } catch (err: any) {
            console.error('[EventsPage] unregister error:', err);
            alert(err?.message || 'Не удалось отменить запись на мероприятие');
        } finally {
            setProcessingIds(prev => prev.filter(x => x !== id));
        }
    };

    // Toggle wrapper for card prop
    const handleToggleRegister = (id: number, currentlyRegistered: boolean) => {
        if (currentlyRegistered) handleUnregister(id);
        else handleRegister(id);
    };

    // edit / delete
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
            if (isReader) await fetchMyEvents();
        } catch (err: any) {
            console.error('[EventsPage] delete error:', err);
            alert(err?.message || 'Не удалось удалить мероприятие');
        }
    };

    const onCreated = async () => { await fetchEvents(); setCreateModalOpen(false); if (isReader) await fetchMyEvents(); };
    const onUpdated = async () => { await fetchEvents(); await fetchMyEvents(); handleEditClose(); };

    // When switching to "mine" view: ensure myEvents loaded
    useEffect(() => {
        if (view === 'mine' && token && isReader) fetchMyEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    return (
        <div className="events-page">
            <h2 className="events-title">Мероприятия</h2>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className={`btn main-btn${view === 'all' ? 'active' : ''}`}
                        onClick={() => setView('all')}
                        aria-pressed={view === 'all'}
                    >
                        Все мероприятия
                    </button>

                    {isReader && (
                        <button
                            className={`btn main-btn${view === 'mine' ? 'active' : ''}`}
                            onClick={() => setView('mine')}
                            aria-pressed={view === 'mine'}
                        >
                            Мои мероприятия
                        </button>
                    )}
                </div>


                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <SearchBar value={search} onChange={setSearch} placeholder="Поиск по названию..." />
                    {isLibrarian && <button className="btn create-btn" onClick={() => setCreateModalOpen(true)}>Создать мероприятие</button>}
                </div>
            </div>

            {loading ? (
                <p>Загрузка мероприятий...</p>
            ) : (
                <div className="events-list">
                    {filteredEvents.map(e => (
                        <EventCard
                            key={e.id}
                            event={e}
                            // карточка ожидает onToggleRegister(id, currentlyRegistered)
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
