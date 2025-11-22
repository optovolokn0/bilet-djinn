import React, { useState } from 'react';
import { useAppSelector } from '../../hooks';
import { API_BASE_URL } from '../../config';

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
  const [capacity, setCapacity] = useState(100);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('start_at', new Date(startAt).toISOString());
      formData.append('duration_minutes', duration.toString());
      formData.append('capacity', capacity.toString());
      formData.append('created_by', user.id.toString());
      if (coverFile) {
        formData.append('cover_image', coverFile);
      }

      const res = await fetch(`${API_BASE_URL}/events/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Ошибка при создании мероприятия');

      onCreated();
      onClose();

      // сброс полей
      setTitle('');
      setDescription('');
      setStartAt('');
      setDuration(60);
      setCapacity(100);
      setCoverFile(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <h2 className="modal-title">Создать мероприятие</h2>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Название</label>
            <input className="input" type="text" value={title} onChange={e => setTitle(e.target.value)} />
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
            <label className="form-label">Длительность (мин)</label>
            <input className="input" type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value))} />
          </div>

          <div className="form-group">
            <label className="form-label">Количество мест</label>
            <input className="input" type="number" min={1} value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
          </div>

          <div className="form-group">
            <label className="form-label">Обложка мероприятия</label>
            <input className="input" type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button className="btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Создание...' : 'Создать'}
            </button>
            <button className="btn" onClick={onClose}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  );
}
