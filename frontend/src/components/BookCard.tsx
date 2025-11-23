// BookCard.tsx
import React, { useState } from 'react'; // Добавляем useState
import { type IBookGroup } from '../modules';
import { useAppSelector } from '../hooks';
// Импортируем новую модалку
import IssueBookModal from './modals/IssueBookModal';

interface BookCardProps {
    book: IBookGroup;
    availableCount: number;
    // Можно добавить callback для обновления списка после выдачи
    onUpdate?: () => void;
}

export default function BookCard({ book, availableCount, onUpdate }: BookCardProps) {
    const user = useAppSelector(s => s.auth.user);
    const isLibrary = user?.role === 'library';

    // Состояние для модалки выдачи
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

    const authors = book.authors?.map(a => a.name).join(', ') || 'Неизвестно';
    const genres = book.genres?.map(g => g.name).join(', ') || 'Не указано';
    const coverSrc = book.cover_image || "../../public/cover.jpg";

    return (
        <>
            <article className="book-card">
                <img
                    src={coverSrc}
                    alt={`Обложка книги: ${book.title}`}
                    className="img cover-img"
                />
                <div className="book-container">
                    {/* 1. КОНТЕЙНЕР ДЛЯ ВСЕХ ВЕРХНИХ ЭЛЕМЕНТОВ */}
                    <div className="book-info-top">
                        {/* Название */}
                        <p className='book-title' title={book.title}>{book.title}</p>

                        {/* Авторы */}
                        <p className='book-authors'>{authors}</p>

                        {/* Жанры */}
                        {!isLibrary && (
                            <p className='book-genres' style={{ fontSize: '14px', color: '#666' }}>
                                {genres}
                            </p>
                        )}

                        {/* ID КНИГИ */}
                        <p className='book-id' style={{ marginTop: '8px' }}>ID: {book.id}</p>
                    </div>
                    {/* КОНЕЦ book-info-top */}


                    {/* 2. ДОСТУПНОЕ КОЛИЧЕСТВО + КНОПКИ (Блок, который будет позиционироваться) */}
                    <div className='book-availability-wrapper'>
                        {/* БЛОК КОЛИЧЕСТВА КНИГ */}
                        <div>
                            {availableCount > 0 ? (
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#A8C0A6' }}>
                                    Доступно: {availableCount}
                                </span>
                            ) : (
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#d32f2f' }}>
                                    Нет в наличии
                                </span>
                            )}
                        </div>
                        {/* Кнопка для Читателя: рендерится, только если availableCount > 0 */}
                        {!isLibrary && availableCount > 0 && (
                            <button
                                className="btn btn-reserve"
                            >
                                Забронировать
                            </button>
                        )}
                        {/* Кнопка для Библиотекаря: рендерится, только если availableCount > 0 */}
                        {isLibrary && availableCount > 0 && ( // <-- ИЗМЕНЕНО УСЛОВИЕ
                            <button
                                className="btn btn-reserve"
                                onClick={() => setIsIssueModalOpen(true)}
                            >
                                Выдать
                            </button>
                        )}
                    </div>
                    {/* КОНЕЦ book-availability-wrapper */}
                </div>

            </article>

            {/* Подключаем модалку выдачи */}
            {
                isLibrary && (
                    <IssueBookModal
                        isOpen={isIssueModalOpen}
                        onClose={() => setIsIssueModalOpen(false)}
                        book={book}
                        onSuccess={() => {
                            // Здесь можно вызвать обновление списка книг, если передали onUpdate
                            if (onUpdate) onUpdate();
                        }}
                    />
                )
            }
        </>
    );
}