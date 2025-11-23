import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAppSelector } from "../../hooks";
import { fetchBookGroups } from "../../api/books";
import type { IBookGroup, ILoan as BaseILoan } from "../../modules";
import SearchBar from "../../components/SearchBar"; // Импортируем компонент поиска
import "../../style/loans.css";

interface ILoan extends Omit<BaseILoan, 'copy_id' | 'reader_id'> {
  copy: {
    id: number;
    book_group: number;
    status: string;
    condition: string;
    created_at: string;
    updated_at: string;
  };
  reader: any;
}

// --- Компонент страницы ---
export default function ReaderLoansPage() {
  const token = useAppSelector((s) => s.auth.access);

  const [loans, setLoans] = useState<ILoan[]>([]);
  const [booksMap, setBooksMap] = useState<Record<number, IBookGroup>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- НОВОЕ СОСТОЯНИЕ для отслеживания займов, отправленных на продление ---
  const [pendingExtensions, setPendingExtensions] = useState<Set<number>>(new Set());

  // --- Состояние поиска ---
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState(q);

  // Эффект для debounce (задержка ввода)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);

    return () => clearTimeout(handler);
  }, [q]);

  // Функция для загрузки данных (займов и книг)
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Загружаем активные займы
      const loansRes = await fetch(
        "https://truly-economic-vervet.cloudpub.ru/api/loans/active/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!loansRes.ok) throw new Error("Ошибка загрузки займов");
      const loansData: ILoan[] = await loansRes.json();

      // 2. Загружаем информацию о книгах, чтобы получить названия по ID
      const booksData = await fetchBookGroups(token);

      const bMap: Record<number, IBookGroup> = {};
      booksData.forEach(b => { bMap[b.id] = b });

      setLoans(loansData);
      setBooksMap(bMap);

    } catch (e) {
      console.error("Ошибка загрузки:", e);
      setError("Не удалось загрузить данные о займах.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Фильтрация списка займов ---
  const filteredLoans = useMemo(() => {
    if (!debouncedQ) return loans; // Если поиск пуст, возвращаем все

    const query = debouncedQ.toLowerCase().trim();

    return loans.filter(loan => {
      // Получаем данные о книге для этого займа
      const book = booksMap[loan.copy.book_group];

      // Поля для поиска
      const title = book?.title?.toLowerCase() || "";
      const authors = book?.authors?.map(a => a.name.toLowerCase()).join(' ') || "";
      const copyId = String(loan.copy.id); // Инвентарный номер

      // Проверяем вхождение
      return title.includes(query) || authors.includes(query) || copyId.includes(query);
    });
  }, [loans, booksMap, debouncedQ]);


  // --- Логика продления книги ---
  const handleExtend = async (loanId: number) => {
    if (!token) {
      alert("Ошибка: нет токена авторизации.");
      return;
    }

    const loanToExtend = loans.find(l => l.id === loanId);
    if (!loanToExtend) return;

    try {
      const res = await fetch(
        `https://truly-economic-vervet.cloudpub.ru/api/loans/${loanId}/extend/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Неизвестная ошибка' }));
        throw new Error(`Ошибка продления: ${errorData.detail || res.statusText}`);
      }

      // --- УСПЕШНОЕ ПРОДЛЕНИЕ: Обновляем состояние pendingExtensions ---
      setPendingExtensions(prev => new Set(prev).add(loanId));


    } catch (e) {
      console.error("Ошибка при продлении:", e);
      alert(e instanceof Error ? e.message : "Не удалось продлить книгу.");
    }
  };

  if (loading) return <div className="loader">Загрузка...</div>;
  if (error) return <div className="loader error">Ошибка: {error}</div>;

  return (
    <div className="loans-page">
      <h2 className="loans-title">Мои книги</h2>

      {/* Строка поиска */}
      <div>
        <SearchBar value={q} onChange={setQ} placeholder="Название, автор или инвентарный ID" />
      </div>

      {/* Если у пользователя вообще нет книг */}
      {!loading && loans.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: 20 }}>У вас нет активных книг</p>
      )}

      {/* Если книги есть, но поиск ничего не нашел */}
      {!loading && loans.length > 0 && filteredLoans.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
          Ничего не найдено по запросу "{q}"
        </p>
      )}

      <div className="loans-list">
        {filteredLoans.map((loan) => {
          const book = booksMap[loan.copy.book_group];
          // --- Передаем флаг о том, находится ли заявка на продление на рассмотрении ---
          const isPending = pendingExtensions.has(loan.id);
          return (
            <LoanCard
              key={loan.id}
              loan={loan}
              book={book}
              onExtend={() => handleExtend(loan.id)}
              isExtendPending={isPending} // ПЕРЕДАЧА НОВОГО ПРОПСА
            />
          );
        })}
      </div>
    </div>
  );
}

// --- Внутренний компонент карточки (с изменениями) ---
function LoanCard({
  loan,
  book,
  onExtend,
  isExtendPending // ПРИНИМАЕМ НОВЫЙ ПРОПС
}: {
  loan: ILoan;
  book?: IBookGroup,
  onExtend: () => void,
  isExtendPending: boolean // ТИП НОВОГО ПРОПСА
}) {
  const due = new Date(loan.due_at).toLocaleDateString("ru-RU");

  const title = book?.title || "Неизвестная книга";
  const authors = book?.authors?.map(a => a.name).join(', ') || "Автор неизвестен";
  const genres = book?.genres?.map(g => g.name).join(', ') || "Жанр не указан";
  const coverSrc = book?.cover_image || "/cover.jpg";

  const conditionMap: Record<string, string> = {
    new: 'Новая',
    good: 'Хорошая',
    worn: 'Потрепанная',
    damaged: 'Повреждена'
  };
  const conditionRu = loan.copy.condition ? (conditionMap[loan.copy.condition] || loan.copy.condition) : 'Не указано';

  const daysLeft = Math.ceil((new Date(loan.due_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const isUrgent = daysLeft <= 3 && daysLeft >= 0;

  // --- ОПРЕДЕЛЕНИЕ ТЕКСТА КНОПКИ ---
  const buttonText = isExtendPending ? 'На рассмотрении' : 'Продлить';

  // --- ОПРЕДЕЛЕНИЕ ДОСТУПНОСТИ КНОПКИ ---
  const isDisabled = isOverdue || isExtendPending;

  return (
    <article className="book-card loan-card-custom">
      <div className="img-wrapper">
        <img src={coverSrc} alt={title} className="img cover-img" />
      </div>

      <div className="book-container">
        <div className="container">
          <p className="book-title" title={title}>{title}</p>
          <p className="book-authors">{authors}</p>
          <p className="book-genres">{genres}</p>

          <div className="loan-details">
            <p className="loan-text">
              Инвентарный ID: <b>{loan.copy.id}</b>
            </p>
            <p className="loan-text">
              Состояние: <b>{conditionRu}</b>
            </p>
            <p className="loan-text">
              Статус займа: <b>{loan.status}</b>
            </p>
            <p className="loan-text">
              Сдать до: <b style={{ color: isOverdue ? '#d32f2f' : isUrgent ? '#f57c00' : 'inherit' }}>{due}</b>
            </p>
            {isOverdue && <span className="status-alert">Просрочено!</span>}
            {isUrgent && <span className="status-warning">Скоро сдача!</span>}
          </div>
        </div>

        <button
          className="btn btn-reserve"
          onClick={onExtend}
          disabled={isDisabled} // ИСПОЛЬЗУЕМ НОВУЮ ЛОГИКУ
        >
          {buttonText} {/* ИСПОЛЬЗУЕМ НОВЫЙ ТЕКСТ */}
        </button>
      </div>
    </article>
  );
}