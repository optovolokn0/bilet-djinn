import React from 'react';
import { type IBookGroup } from '../modules';
import { Link } from 'react-router-dom';

// Убедитесь, что BookList и ReaderCatalog передают корректный тип IBookGroup, 
// который включает cover_image, как мы обсуждали ранее.
export default function BookCard({ book, availableCount }:
    { book: IBookGroup; availableCount: number }) {

    // Собираем строку с именами авторов
    const authors = book.authors?.map(a => a.name).join(', ') || 'Неизвестно';

    // Определяем источник изображения: используем cover_image, если оно есть, 
    // иначе используем cover_url (хотя в API оно null), иначе заглушку.
    const coverSrc = book.cover_image
        ? book.cover_image
        : book.cover_image
            ? book.cover_image
            : "../../public/cover.jpg"; // Путь к вашей локальной заглушке

    return (
        <article className="book-card">
            <img
                // <-- ИЗМЕНЕНИЕ: Используем coverSrc, который приоритетно берет cover_image
                src={coverSrc}
                alt={`Обложка книги: ${book.title}`}
                className="img cover-img"
            />
            <div className="book-container">
                <div className="container">
                    <p className='book-title'>{book.title}</p>
                    <p className='book-authors'>{authors}</p>

                    {/* <-- ID КНИГИ */}
                    <p className='book-id'>ID: {book.id}</p>

                    {/* <-- ДОСТУПНОЕ КОЛИЧЕСТВО */}
                    <p className='book-available-count'>Доступно книг: {availableCount}</p>
                </div>
                <button className="btn btn-reserve" disabled={availableCount === 0}>
                    {availableCount > 0 ? 'Забронировать' : 'Нет в наличии'}
                </button>
            </div>
        </article>
    );
}