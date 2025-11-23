// src/pages/library/RegisterReaderPage.tsx
import React, { useState, useEffect, type JSX } from 'react';
import { useAppSelector } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

interface CreatedUserResp {
  id: number;
  ticket_number: string;
  contract_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string;
  role: string;
  password: string;
}

export default function RegisterReaderPage(): JSX.Element {
  const user = useAppSelector(s => s.auth.user);
  const token = useAppSelector(s => s.auth.access);
  const navigate = useNavigate();

  // Redirect if not authorized as library
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'library') {
      // можно редиректить на root или на страницу библиотеки
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [ticketNumber, setTicketNumber] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState(''); // YYYY-MM-DD
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedUserResp | null>(null);

  const clearForm = () => {
    setTicketNumber('');
    setContractNumber('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setBirthDate('');
    setError(null);
    setCreated(null);
  };

  const validate = () => {
    if (!ticketNumber.trim()) return 'Введите номер читательского билета';
    if (!contractNumber.trim()) return 'Введите номер договора';
    if (!firstName.trim()) return 'Введите имя';
    if (!lastName.trim()) return 'Введите фамилию';
    if (!phone.trim()) return 'Введите телефон';
    // простая проверка даты YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return 'Введите дату рождения в формате ГГГГ-ММ-ДД';
    return null;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setCreated(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const body = {
        ticket_number: ticketNumber,
        contract_number: contractNumber,
        first_name: firstName,
        last_name: lastName,
        phone,
        birth_date: birthDate,
        role: 'reader',
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      // Если backend возвращает JSON с ошибкой, попытаемся распарсить его
      if (!res.ok) {
        let message = `Ошибка: ${res.status}`;
        try {
          const j = await res.json();
          // попытка получить читаемое сообщение
          if (j && typeof j === 'object') {
            // если в ответе объект с полями ошибок — соберём их
            const msgs: string[] = [];
            for (const k of Object.keys(j)) {
              const val = (j as any)[k];
              if (Array.isArray(val)) msgs.push(`${k}: ${val.join(', ')}`);
              else if (typeof val === 'string') msgs.push(`${k}: ${val}`);
            }
            if (msgs.length) message = msgs.join('; ');
            else if (j.detail) message = j.detail;
          }
        } catch {
          // fallback - текст
          try {
            const txt = await res.text();
            if (txt) message = txt;
          } catch { /* ignore */ }
        }
        throw new Error(message);
      }

      const data: CreatedUserResp = await res.json();
      setCreated(data);
    } catch (err: any) {
      console.error('Register reader error', err);
      setError(err?.message || 'Не удалось зарегистрировать читателя');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!created?.password) return;
    try {
      await navigator.clipboard.writeText(created.password);
      // короткое подтверждение
      alert('Пароль скопирован в буфер обмена');
    } catch {
      alert('Не удалось скопировать пароль. Скопируйте вручную.');
    }
  };

  return (
    <div className="register-reader-page" style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h2 style={{textAlign: 'center'}}>Регистрация читателя</h2>

      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      {created ? (
        <div style={{ background: '#f6fffa', border: '1px solid #c6f6d5', padding: 16, borderRadius: 8 }}>
          <h3>Читатель успешно создан</h3>
          <p><strong>ID:</strong> {created.id}</p>
          <p><strong>Имя:</strong> {created.first_name} {created.last_name}</p>
          <p><strong>Телефон:</strong> {created.phone}</p>
          <p><strong>Билет:</strong> {created.ticket_number}</p>
          <p><strong>Договор:</strong> {created.contract_number}</p>
          <p><strong>Дата рождения:</strong> {created.birth_date}</p>
          <p><strong>Роль:</strong> {created.role}</p>
          <p>
            <strong>Сгенерированный пароль:</strong> <code style={{ padding: '2px 6px', background: '#fff', borderRadius: 4 }}>{created.password}</code>
          </p>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={handleCopyPassword}>Копировать пароль</button>
            <button
              className="btn"
              onClick={() => {
                clearForm();
              }}
            >
              Зарегистрировать ещё
            </button>
            <button className="btn" onClick={() => navigate('/library/catalog')}>Перейти в каталог</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div className="form-group">
            <label className="form-label">Номер читательского билета</label>
            <input className="input" value={ticketNumber} onChange={e => setTicketNumber(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Номер договора</label>
            <input className="input" value={contractNumber} onChange={e => setContractNumber(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Имя</label>
            <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Фамилия</label>
            <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Телефон</label>
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7..." required />
          </div>

          <div className="form-group">
            <label className="form-label">Дата рождения</label>
            <input className="input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрировать'}
            </button>
            <button type="button" className="btn" onClick={clearForm} disabled={loading}>Сбросить</button>
            <button type="button" className="btn" onClick={() => navigate(-1)}>Назад</button>
          </div>
        </form>
      )}
    </div>
  );
}
