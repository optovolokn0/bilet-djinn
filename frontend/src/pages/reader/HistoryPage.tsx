// src/pages/ReturnedLoansPage.tsx
import React, { useEffect, useState, type JSX } from 'react';
import { useAppSelector } from '../../hooks';
import { API_BASE_URL } from '../../config';
import { useNavigate } from 'react-router-dom';

export interface IReturnedLoan {
  id: number;
  copy: {
    id: number;
    book_group: number;
    status: string;
  };
  reader: {
    id: number;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    // возможно есть другие поля, не обязательно перечислять
  };
  issued_at: string;
  due_at: string;
  returned_at?: string | null;
  status: 'active' | 'returned' | 'overdue' | 'cancelled' | string;
}

export default function ReturnedLoansPage(): JSX.Element {
  const user = useAppSelector(s => s.auth.user);
  const token = useAppSelector(s => s.auth.access);
  const navigate = useNavigate();

  const [loans, setLoans] = useState<IReturnedLoan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // if not logged in -> go to login
    if (!user) {
      // optional: navigate('/login');
      return;
    }
    // если не reader — редиректим на главную
    if (user.role !== 'reader') {
      navigate('/');
      return;
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (!token) {
      setLoans([]);
      return;
    }

    const controller = new AbortController();

    const fetchLoans = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/loans/returned/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `HTTP ${res.status}`);
        }

        const data: IReturnedLoan[] = await res.json();
        setLoans(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('[ReturnedLoansPage] fetch error:', err);
        setError(err?.message || 'Не удалось загрузить историю');
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();

    return () => controller.abort();
  }, [token]);

  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString() : '-';

  return (
    <div className="returned-loans-page">
      <h2 className="page-title">История возвращённых книг</h2>

      {loading && <p>Загрузка...</p>}
      {error && <div className="text-error">Ошибка: {error}</div>}

      {!loading && !error && loans.length === 0 && (
        <p className="text-muted">У вас ещё нет возвращённых книг.</p>
      )}

      <div className="loans-list">
        {loans.map(loan => (
          <div className="loan-card" key={loan.id}>
            <div className="loan-left">
              {/* При необходимости можно показывать обложку, если получите book_group -> запрос */}
              <div className="loan-cover-placeholder">№{loan.copy.id}</div>
            </div>

            <div className="loan-right">
              <div className="loan-top">
                <div className="loan-title">
                  Экземпляр: <strong>{loan.copy.id}</strong>
                  <span className="loan-bookgroup"> (book_group #{loan.copy.book_group})</span>
                </div>
                <div className={`loan-status ${loan.status}`}>
                  Статус: {loan.status}
                </div>
              </div>

              <div className="loan-dates">
                <div>Выдано: <b>{fmt(loan.issued_at)}</b></div>
                <div>К возврату (due): <b>{fmt(loan.due_at)}</b></div>
                <div>Возвращено: <b>{fmt(loan.returned_at)}</b></div>
              </div>

              <div className="loan-reader">
                Читатель: {loan.reader?.username ?? `${loan.reader?.first_name ?? ''} ${loan.reader?.last_name ?? ''}`}
              </div>

              <div style={{ marginTop: 10 }}>
                {/* при желании можно добавить ссылку на детали копии / книги */}
                <button
                  className="btn small"
                  onClick={() => {
                    // если есть страница книги/группы, можно перейти
                    navigate(`/books/${loan.copy.book_group}`);
                  }}
                >
                  О книге
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
