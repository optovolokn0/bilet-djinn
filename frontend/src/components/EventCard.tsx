import React from 'react';
import { type IEventWithAvailability } from '../modules';

interface Props {
  event: IEventWithAvailability;
  onSign?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function EventCard({ event, onSign, onEdit, onDelete }: Props) {
  return (
    <div className="event-card">
      <img src={event.cover_url || '../../public/event.jpg'} alt={event.title} className="img event-img" />
      <div className="event-text">
        <h3 className="event-title">{event.title}</h3>
        <div className="event-subtext">
          <p className="event-descr">{event.description}</p>
          <p className="event-datetime">{new Date(event.date_time).toLocaleString()}</p>
          <p className="event-count-places">
            {event.free_seats > 0 ? `Свободных мест: ${event.free_seats}` : 'Мест нет'}
          </p>
        </div>
        <div className="btns-container">
          {onSign && <button className="btn event-btn" onClick={() => onSign(event.id)}>Записаться</button>}
          {onEdit && <button className="btn event-btn blue" onClick={() => onEdit(event.id)}>Редактировать</button>}
          {onDelete && <button className="btn event-btn red" onClick={() => onDelete(event.id)}>Удалить</button>}
        </div>
      </div>
    </div>
  );
}
