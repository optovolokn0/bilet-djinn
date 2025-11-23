// src/pages/RenewRequestsPage.tsx
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
  status: string;
}
interface IRenewRequest {
  id: number;
  loan: ILoan;
  requested_by: number;
  requested_at: string;
  new_due_at: string;
  status: 'pending' | 'approved' | 'rejected' | string;
}

export default function RenewRequestsPage() {
  const token = useAppSelector(s => s.auth.access);
  const user = useAppSelector(s => s.auth.user);
  const [requests, setRequests] = useState<IRenewRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Загружаем только pending-заявки
  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/renew-requests/`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: IRenewRequest[] = await res.json();
      // Покажем только pending (защита от возвращения уже обработанных)
      const pending = (Array.isArray(data) ? data : []).filter(r => r.status === 'pending');
      setRequests(pending);
    } catch (err: any) {
      console.error('[RenewRequestsPage] fetch', err);
      setError(err?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setRequests([]);
      return;
    }
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!user) return <p>Требуется авторизация</p>;
  if (user.role !== 'library') return <p>Доступ запрещён — страница только для библиотекаря</p>;

  // общая функция обработки ответа: если сервер вернул объект заявки с новым статусом != pending — удаляем её из UI,
  // иначе — обновляем список один раз и показываем предупреждение.
  const handleServerResponse = async (reqId: number, res: Response, fallbackMessage: string) => {
    try {
      // попытка прочитать JSON — если сервер вернул обновлённую заявку, используем её
      const payload = await res.json().catch(() => null);
      // если payload содержит статус и он не pending — удаляем заявку локально
      if (payload && payload.status && payload.status !== 'pending') {
        setRequests(prev => prev.filter(r => r.id !== reqId));
        return;
      }
      // иногда API возвращает вложенный объект (например { id, loan: { ... }, status })
      // проверим более глубоко
      if (payload && payload.renew_request && payload.renew_request.status && payload.renew_request.status !== 'pending') {
        setRequests(prev => prev.filter(r => r.id !== reqId));
        return;
      }
      // иначе попробуем обновить список один раз
      await fetchRequests();
      alert(fallbackMessage);
    } catch (err: any) {
      console.error('[RenewRequestsPage] handleServerResponse', err);
      await fetchRequests();
      alert(fallbackMessage);
    }
  };

  const handleApprove = async (req: IRenewRequest) => {
    if (!token) return;
    if (!window.confirm('Одобрить продление?')) return;
    setProcessing(p => [...p, req.id]);
    try {
      const payload = {
        loan_id: req.loan.id,
        requested_by: req.requested_by,
        requested_at: req.requested_at,
        new_due_at: req.new_due_at,
        status: req.status,
      };
      const res = await fetch(`${API_BASE_URL}/renew-requests/${req.id}/approve/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        // если статус не OK — попытаемся прочитать текст и показать ошибку
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      // Обработка ответа сервером
      await handleServerResponse(req.id, res, 'Заявка принята на обработку, но сервер вернул неожиданный результат.');
    } catch (err: any) {
      console.error('[RenewRequestsPage] approve', err);
      alert(err?.message || 'Не удалось одобрить');
      // обновим список на всякий случай
      await fetchRequests();
    } finally {
      setProcessing(p => p.filter(id => id !== req.id));
    }
  };

  const handleReject = async (req: IRenewRequest) => {
    if (!token) return;
    if (!window.confirm('Отклонить продление?')) return;
    setProcessing(p => [...p, req.id]);
    try {
      const payload = {
        loan_id: req.loan.id,
        requested_by: req.requested_by,
        requested_at: req.requested_at,
        new_due_at: req.new_due_at,
        status: req.status,
      };
      const res = await fetch(`${API_BASE_URL}/renew-requests/${req.id}/reject/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      await handleServerResponse(req.id, res, 'Заявка отклонена, но сервер вернул неожиданный результат.');
    } catch (err: any) {
      console.error('[RenewRequestsPage] reject', err);
      alert(err?.message || 'Не удалось отклонить');
      await fetchRequests();
    } finally {
      setProcessing(p => p.filter(id => id !== req.id));
    }
  };

  return (
    <div className="renew-requests-page">
      <h2 className="page-title">Заявки на продление</h2>
      {loading ? <p>Загрузка...</p> : null}
      {error && <p className="text-error">{error}</p>}
      {!loading && requests.length === 0 && <p>Нет заявок</p>}

      <div style={{ display: 'grid', gap: 12 }}>
        {requests.map(r => {
          const isProc = processing.includes(r.id);
          return (
            <div key={r.id} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div><b>Заявка #{r.id}</b> — займ #{r.loan.id}</div>
                  <div>Копия: #{r.loan.copy.id} (group #{r.loan.copy.book_group})</div>
                  <div>Читатель: {r.loan.reader.username} ({r.loan.reader.first_name ?? ''} {r.loan.reader.last_name ?? ''})</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Текущий срок: <b>{new Date(r.loan.due_at).toLocaleString()}</b></div>
                  <div>Предлагаемая новая дата: <b>{new Date(r.new_due_at).toLocaleString()}</b></div>
                  <div>Запрошено: {new Date(r.requested_at).toLocaleString()}</div>
                  <div style={{ marginTop: 8 }}>
                    <button className="btn" onClick={() => handleApprove(r)} disabled={isProc}>{
                      isProc ? 'Обработка...' : 'Одобрить'
                    }</button>
                    <button className="btn btn-danger" onClick={() => handleReject(r)} disabled={isProc} style={{ marginLeft: 8 }}>
                      {isProc ? 'Обработка...' : 'Отклонить'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
