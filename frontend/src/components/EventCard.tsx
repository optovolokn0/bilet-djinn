// src/components/EventCard.tsx
import React from 'react';
import { type IEventWithAvailability } from '../modules';

interface Props {
    event: IEventWithAvailability;
    onSign?: (id: number) => void;
}

export default function EventCard({ event, onSign }: Props) {
    return (
        <div className="event-card">
            <img
                src='../../public/event.jpg'
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

                <div className="btns-container">
                    <button
                        className="btn event-btn"
                        onClick={() => onSign?.(event.id)}
                    >
                        Записаться
                    </button>
                </div>
            </div>
        </div>
    );
}
