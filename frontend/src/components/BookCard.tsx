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
                    <div className="container">
                        <p className='book-title' title={book.title}>{book.title}</p>
                        <p className='book-authors'>{authors}</p>

                        {!isLibrary && (
                            <p className='book-genres' style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                                {genres}
                            </p>
                        )}

                        <p className='book-id'>ID: {book.id}</p>

                        <div className='book-availability' style={{ marginTop: '10px' }}>
                            {availableCount > 0 ? (
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
                                    Доступно: {availableCount}
                                </span>
                            ) : (
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#d32f2f' }}>
                                    Нет в наличии
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Кнопка для библиотекаря */}
                    {isLibrary && (
                        <button
                            className="btn btn-reserve"
                            disabled={availableCount === 0}
                            style={{ marginTop: '15px' }}
                            // ОТКРЫВАЕМ МОДАЛКУ
                            onClick={() => setIsIssueModalOpen(true)}
                        >
                            {availableCount > 0 ? 'Выдать книгу' : 'Нет экземпляров'}
                        </button>
                    )}
                </div>
            </article>

            {/* Подключаем модалку выдачи */}
            {isLibrary && (
                <IssueBookModal
                    isOpen={isIssueModalOpen}
                    onClose={() => setIsIssueModalOpen(false)}
                    book={book}
                    onSuccess={() => {
                        // Здесь можно вызвать обновление списка книг, если передали onUpdate
                        if (onUpdate) onUpdate();
                    }}
                />
            )}
        </>
    );
}