import React, { useState, useEffect } from 'react';
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
  const [startAt, setStartAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState(30);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Блокируем скролл страницы при открытии модалки
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
        headers,
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data: IEvent = await res.json();
      console.log('[CreateEventModal] created', data);

      await onCreated();
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
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">

        <button className="modal-close-btn" onClick={onClose}>×</button>

        <h2 className="modal-title">Создать мероприятие</h2>

        <form className="modal-form" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>

          {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Название</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="form-group">
            <label className="form-label">Дата и время начала</label>
            <input className="input" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} required />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Длительность (мин)</label>
              <input className="input" type="number" min={1} value={duration} onChange={e => setDuration(+e.target.value)} />
            </div>

            <div style={{ flex: 1 }}>
              <label className="form-label">Количество мест</label>
              <input className="input" type="number" min={1} value={capacity} onChange={e => setCapacity(+e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Картинка мероприятия</label>
            <input className="input" type="file" accept="image/*" onChange={handleCover} style={{ paddingTop: 6 }} />
            {preview && (
              <img
                src={preview}
                alt="preview"
                style={{ maxWidth: '100%', marginTop: 10, borderRadius: 8 }}
              />
            )}
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Создание...' : 'Создать'}
          </button>

        </form>
      </div>
    </div>
  );
}
