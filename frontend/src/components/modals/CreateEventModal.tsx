import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';
import { API_BASE_URL } from '../../config';
import type { IEvent } from '../../modules';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onCreated }: Props) {
  const token = useAppSelector(s => s.auth.access);
  const user = useAppSelector(s => s.auth.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState(''); // datetime-local string
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState(30);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const toISO = (localDateTime: string) => {
    if (!localDateTime) return '';
    const d = new Date(localDateTime);
    return d.toISOString();
  };

  const handleSubmit = async () => {
    if (!user) return setError('Требуется авторизация');
    if (!title) return setError('Введите название');

    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('start_at', toISO(startAt));
      form.append('duration_minutes', String(duration));
      form.append('capacity', String(capacity));
      form.append('created_by', String(user.id));
      if (coverFile) form.append('cover_image', coverFile);

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/events/`, {
        method: 'POST',
        headers, // don't set Content-Type
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data: IEvent = await res.json();
      console.log('[CreateEventModal] created', data);
      await onCreated();
      // clear
      setTitle('');
      setDescription('');
      setStartAt('');
      setDuration(60);
      setCapacity(30);
      setCoverFile(null);
      setPreview(null);
    } catch (err: any) {
      console.error('[CreateEventModal] error', err);
      setError(err?.message || 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <h2 className="modal-title">Создать мероприятие</h2>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Название</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Дата и время начала</label>
            <input className="input" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Длительность (минут)</label>
            <input className="input" type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value))} />
          </div>

          <div className="form-group">
            <label className="form-label">Количество мест</label>
            <input className="input" type="number" min={1} value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
          </div>

          <div className="form-group">
            <label className="form-label">Картинка мероприятия</label>
            <input type="file" accept="image/*" onChange={handleCover} />
            {preview && <img src={preview} alt="preview" style={{ maxWidth: '100%', marginTop: 8, borderRadius: 8 }} />}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={handleSubmit} disabled={loading}>{loading ? 'Создание...' : 'Создать'}</button>
            <button className="btn" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
}
