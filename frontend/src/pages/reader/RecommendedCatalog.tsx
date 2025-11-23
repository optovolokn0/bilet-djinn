import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookList from '../../components/BookList'; // Тот же компонент списка
import { useAppSelector } from '../../hooks';
import { API_BASE_URL } from '../../config';
import { fetchBookGroups } from '../../api/books';
import type { IBookGroup } from '../../modules';
import type { IReturnedLoan } from './HistoryPage';


export default function RecommendedCatalog() {
    const user = useAppSelector(s => s.auth.user);
    const token = useAppSelector(s => s.auth.access);
    const navigate = useNavigate();

    // --- Состояние ---
    const [allBookGroups, setAllBookGroups] = useState<IBookGroup[]>([]);
    const [loans, setLoans] = useState<IReturnedLoan[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Загрузка данных (Каталог + История) ---
    useEffect(() => {
        if (!user || !token) return;

        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 1. Запускаем оба запроса параллельно
                const [booksData, loansResponse] = await Promise.all([
                    fetchBookGroups(token),
                    fetch(`${API_BASE_URL}/loans/returned/`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    })
                ]);

                // 2. Обрабатываем ответ по истории
                if (!loansResponse.ok) {
                    throw new Error('Не удалось загрузить историю для рекомендаций');
                }
                const loansData: IReturnedLoan[] = await loansResponse.json();

                // 3. Сохраняем в стейт
                setAllBookGroups(booksData);
                setLoans(Array.isArray(loansData) ? loansData : []);

            } catch (err: any) {
                console.error("Ошибка при подготовке рекомендаций:", err);
                setError("Не удалось сформировать рекомендации.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user, token]);

    // --- Логика рекомендаций (Самая важная часть) ---
    const recommendedItems = useMemo(() => {
        if (loans.length === 0 || allBookGroups.length === 0) return [];

        // 1. Сортируем историю: самые новые (по дате выдачи) в начале
        // Используем slice(), чтобы не мутировать исходный массив
        const sortedLoans = [...loans].sort((a, b) =>
            new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
        );

        // 2. Берем последние 4 (или меньше)
        const lastLoans = sortedLoans.slice(0, 4);

        // 3. Извлекаем "книги-источники" из общего массива по ID
        // Нам нужны полные данные книги (авторы, название), которых нет в объекте loan
        const sourceBooks: IBookGroup[] = [];
        lastLoans.forEach(loan => {
            const foundBook = allBookGroups.find(bg => bg.id === loan.copy.book_group);
            if (foundBook) {
                sourceBooks.push(foundBook);
            }
        });

        if (sourceBooks.length === 0) return [];

        // 4. Собираем критерии фильтрации
        const targetAuthorIds = new Set<number>();
        const targetFirstWords = new Set<string>();

        sourceBooks.forEach(book => {
            // Собираем ID авторов
            book.authors?.forEach(a => targetAuthorIds.add(a.id));

            // Берем первое слово названия (убираем лишние пробелы, нижний регистр)
            const firstWord = book.title.trim().split(/\s+/)[0].toLowerCase();
            if (firstWord.length > 2) { // Игнорируем предлоги, если они короче 3 букв (по желанию)
                targetFirstWords.add(firstWord);
            } else {
                // Если слово короткое (например "The"), всё равно добавляем, если таково условие
                targetFirstWords.add(firstWord);
            }
        });

        // 5. Фильтруем общий каталог
        return allBookGroups.filter(book => {
            // Условие 1: Совпадение по автору
            const hasAuthorMatch = book.authors?.some(a => targetAuthorIds.has(a.id));

            // Условие 2: Совпадение по первому слову
            const currentFirstWord = book.title.trim().split(/\s+/)[0].toLowerCase();
            const hasTitleMatch = targetFirstWords.has(currentFirstWord);

            // Важно: исключаем ли мы книги, которые уже прочитаны? 
            // В ТЗ не сказано "исключить", но для рекомендаций это логично.
            // Если нужно исключить прочитанные (те, что попали в sourceBooks), раскомментируй строку ниже:
            // const isAlreadyReadSource = sourceBooks.some(sb => sb.id === book.id);
            // return (hasAuthorMatch || hasTitleMatch) && !isAlreadyReadSource;

            return hasAuthorMatch || hasTitleMatch;
        });

    }, [loans, allBookGroups]);

    // --- Подсчет доступных книг (как в ReaderCatalog) ---
    const counts = useMemo(() => {
        const map: Record<number, number> = {};
        allBookGroups.forEach(bg => {
            map[bg.id] = bg.available_count || 0;
        });
        return map;
    }, [allBookGroups]);

    return (
        <div className="book-catalog">
            {/* Заголовок и классы как в оригинальном каталоге */}
            <h2 className='book-catalog title'>Рекомендуем вам</h2>

            {/* Можно добавить описание, почему мы это рекомендуем */}
            <p className="text-muted" style={{ marginBottom: 20 }}>
                Подборка на основе ваших последних прочитанных книг.
            </p>

            {isLoading && <div style={{ textAlign: 'center', padding: '20px' }}>Подбираем книги...</div>}
            {error && <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>Ошибка: {error}</div>}

            {!isLoading && !error && recommendedItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    {loans.length === 0
                        ? "Прочитайте пару книг, чтобы мы могли составить рекомендации!"
                        : "Пока не удалось подобрать похожие книги."}
                </div>
            )}

            {!isLoading && !error && recommendedItems.length > 0 && (
                <BookList items={recommendedItems} counts={counts} />
            )}
        </div>
    );
}