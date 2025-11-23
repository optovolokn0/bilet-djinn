// src/pages/IssuedBooksPage.tsx
import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks';
import { API_BASE_URL } from '../../config';

interface ICopy {
  id: number;
  book_group: number;
  status: string;
  condition?: string | null;
  created_at: string;
  updated_at: string;
}
interface IUser {
  id: number;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
}
interface ILoan {
  id: number;
  copy: ICopy;
  reader: IUser;
  issued_by?: number | null;
  issued_at: string;
  due_at: string;
  returned_at?: string | null;
  renew_count: number;
  status: 'active' | 'returned' | 'overdue' | 'cancelled' | string;
}

export default function IssuedBooksPage() {
  const token = useAppSelector(s => s.auth.access);
  const user = useAppSelector(s => s.auth.user);

  const [loans, setLoans] = useState<ILoan[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoans([]);
      return;
    }
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/loans/`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: ILoan[] = await res.json();
      // Отфильтруем сразу: показываем только не возвращённые
      setLoans(Array.isArray(data) ? data.filter(l => l.status !== 'returned') : []);
    } catch (err: any) {
      console.error('[IssuedBooksPage] fetchLoans', err);
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '-');

  const handleMarkReturned = async (loan: ILoan) => {
    if (!token) return;
    if (!window.confirm('Отметить эту книгу как возвращённую?')) return;
    setProcessingIds(p => [...p, loan.id]);
    try {
      const res = await fetch(`${API_BASE_URL}/loans/${loan.id}/mark_returned/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // минимальный payload, если сервер требует
      });
      if (!res.ok) throw new Error(await res.text());
      // Обновляем список после возврата
      await fetchLoans();
    } catch (err: any) {
      console.error('[IssuedBooksPage] mark_returned', err);
      alert(err?.message || 'Не удалось отметить возврат');
    } finally {
      setProcessingIds(p => p.filter(id => id !== loan.id));
    }
  };

  if (!user) return <p>Требуется авторизация</p>;
  if (user.role !== 'library' && user.role !== 'reader' && user.role !== 'admin') return <p>Нет доступа</p>;

  return (
    <div className="issued-books-page">
      <h2 className="page-title">Выданные книги</h2>

      {loading && <p>Загрузка...</p>}
      {error && <p className="text-error">{error}</p>}
      {!loading && loans.length === 0 && <p>Нет выданных книг</p>}

      <div className="loans-list" >
        {loans.map(loan => {
          const isProcessing = processingIds.includes(loan.id);
          const canAct = loan.status === 'active' || loan.status === 'overdue';

          return (
            <div key={loan.id} style={{ display: 'flex', gap: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>Копия: {loan.copy.id} (group #{loan.copy.book_group})</div>
                  <div style={{ fontSize: 14, color: '#333' }}>Статус: <b>{loan.status}</b></div>
                </div>

                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div>Выдано: <br/><b>{fmt(loan.issued_at)}</b></div>
                  <div>К возврату: <br/><b>{fmt(loan.due_at)}</b></div>
                  <div>Возвращено: <br/><b>{fmt(loan.returned_at)}</b></div>
                </div>

                <div style={{ marginTop: 8 }}>Читатель: {loan.reader.username} {loan.reader.first_name ?? ''} {loan.reader.last_name ?? ''}</div>
                <div style={{ marginTop: 8 }}>Продлений: {loan.renew_count}</div>

                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-danger" onClick={() => handleMarkReturned(loan)} disabled={!canAct || isProcessing}>
                    {isProcessing ? 'Обработка...' : 'Сдать'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
