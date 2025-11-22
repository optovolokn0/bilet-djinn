// src/api/events.ts
import { API_BASE_URL } from "../config";

export const EVENTS_URL = `${API_BASE_URL}/events/`;

export interface IEventPayload {
  title: string;
  description: string;
  start_at: string; // ISO
  duration_minutes: number;
  capacity: number;
  cover_url: string;
  created_by: number;
}

export interface IEventResponse {
  id: number;
  title: string;
  description: string;
  start_at: string;
  duration_minutes: number;
  capacity: number;
  cover_url: string;
  cover_image: string | null;
  created_by: number;
  participants_count: number;
  seats_left: number;
}

export const fetchEvents = async (token: string): Promise<IEventResponse[]> => {
  const res = await fetch(EVENTS_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Не удалось получить список мероприятий");
  return res.json();
};

export const createEvent = async (token: string, data: IEventPayload): Promise<IEventResponse> => {
  const res = await fetch(EVENTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Не удалось создать мероприятие");
  return res.json();
};
