import React from 'react';
import type { IEventWithAvailability } from '../modules';

interface Props {
  event: IEventWithAvailability;
  onToggleRegister?: (id: number, currentlyRegistered: boolean) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  processingIds?: number[];
}

export default function EventCard({ event, onToggleRegister, onEdit, onDelete, processingIds }: Props) {
  const isProcessing = processingIds?.includes(event.id);

  return (
    <div className="event-card">
      <img
        src={event.cover_url || '../../public/event.jpg'}
        alt={event.title}
        className="img event-img"
      />

      <div className="event-text">
        <h3 className="event-title">{event.title}</h3>

        <div className="event-subtext">
          <p className="event-descr">{event.description}</p>
          <p className="event-datetime">{new Date(event.date_time).toLocaleString()}</p>
          <p className="event-count-places">
            {event.free_seats > 0 ? `Свободных мест: ${event.free_seats}` : 'Мест нет'}
          </p>
        </div>

        <div className="btns-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onToggleRegister && (
            <button
              className="btn event-btn"
              onClick={() => onToggleRegister(event.id, !!event.is_registered)}
              disabled={isProcessing || (event.is_full && !event.is_registered)}
            >
              {isProcessing ? '...' : (event.is_registered ? 'Отписаться' : 'Записаться')}
            </button>
          )}

          {onEdit && <button className="btn event-btn blue" onClick={() => onEdit(event.id)}>Редактировать</button>}
          {onDelete && <button className="btn event-btn red" onClick={() => onDelete(event.id)}>Удалить</button>}
        </div>
      </div>
    </div>
  );
}
