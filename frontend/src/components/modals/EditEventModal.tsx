import React, { useState, useEffect, type ChangeEvent } from 'react';
import type { IEvent } from '../../modules';
import { API_BASE_URL } from '../../config';
import { useAppSelector } from '../../hooks';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  event: IEvent;
}

export default function EditEventModal({ isOpen, onClose, onUpdated, event }: EditEventModalProps) {
  const token = useAppSelector(s => s.auth.access);

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [startAt, setStartAt] = useState('');
  const [duration, setDuration] = useState(event.duration_minutes);
  const [capacity, setCapacity] = useState(event.capacity);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(event.cover_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // безопасный конвертер ISO -> datetime-local value
  const isoToLocalInput = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setStartAt(isoToLocalInput(event.start_at));
      setDuration(event.duration_minutes);
      setCapacity(event.capacity);
      setCoverFile(null);
      setPreviewUrl(event.cover_url || '');
      setError('');
    }
  }, [event]);

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const localToISO = (local: string) => {
    if (!local) return '';
    // local looks like "YYYY-MM-DDTHH:mm"
    const d = new Date(local);
    return isNaN(d.getTime()) ? '' : d.toISOString();
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('start_at', localToISO(startAt));
      form.append('duration_minutes', String(duration));
      form.append('capacity', String(capacity));
      if (coverFile) form.append('cover_image', coverFile);

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/events/${event.id}/`, {
        method: 'PATCH',
        headers, // no Content-Type for FormData
        body: form,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      await onUpdated();
    } catch (err: any) {
      console.error('[EditEventModal] update error:', err);
      setError(err?.message || 'Ошибка обновления');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <h2 className="modal-title">Редактировать мероприятие</h2>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        <form className="modal-form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div className="form-group">
            <label className="form-label">Название</label>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea className="input" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Дата и время начала</label>
            <input className="input" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Длительность (мин)</label>
            <input className="input" type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value))} />
          </div>

          <div className="form-group">
            <label className="form-label">Вместимость</label>
            <input className="input" type="number" min={1} value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
          </div>

          <div className="form-group">
            <label className="form-label">Картинка мероприятия</label>
            <input type="file" accept="image/*" onChange={handleCoverChange} />
            {previewUrl && <img src={previewUrl} alt="preview" style={{ marginTop: 8, width: '100%', borderRadius: 8 }} />}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
            <button className="btn" type="button" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}
