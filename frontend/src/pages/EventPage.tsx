import CreateEventModal from '../components/modals/CreateEventModal';
import React, { useEffect, useState } from 'react';
import EventCard from '../components/EventCard';
import SearchBar from '../components/SearchBar';
import { useAppSelector } from '../hooks';
import { API_BASE_URL } from '../config';
import type { IEvent, IEventWithAvailability } from '../modules';

export default function EventsPage() {
  const user = useAppSelector(s => s.auth.user);
  const token = useAppSelector(s => s.auth.access);

  const [events, setEvents] = useState<IEventWithAvailability[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const isReader = user?.role === 'reader';
  const isLibrarian = user?.role === 'library';

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/events/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Не удалось загрузить события');

      const data: IEvent[] = await res.json();
      const mapped = data.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date_time: e.start_at,
        duration_minutes: e.duration_minutes,
        total_seats: e.capacity,
        booked_seats: e.participants_count,
        free_seats: e.seats_left,
        is_full: e.seats_left === 0,
        cover_url: e.cover_url,
        created_by: e.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      setEvents(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const filteredEvents = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  const handleSign = async (id: number) => alert(`Вы записались на мероприятие ${id}`);
  const handleOpenModal = () => setModalOpen(true);

  return (
    <div className="events-page">
      <h2 className="events-title">Мероприятия</h2>

      <SearchBar value={search} onChange={setSearch} placeholder="Поиск по названию..." />

      {isLibrarian && <button className="btn create-btn" onClick={handleOpenModal}>Создать мероприятие</button>}

      <div className="events-list">
        {filteredEvents.map(e => (
          <EventCard key={e.id} event={e} onSign={isReader ? handleSign : undefined} />
        ))}
        {filteredEvents.length === 0 && <p className="text-gray-500 mt-4">Ничего не найдено</p>}
      </div>

      <CreateEventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchEvents}
      />
    </div>
  );
}
