import React from 'react';
import { type IBookGroup } from '../modules';
import { Link } from 'react-router-dom';

export default function BookCard({ book, availableCount }:
    { book: IBookGroup; availableCount: number }) {

    // Собираем строку с именами авторов
    const authors = book.authors?.map(a => a.name).join(', ') || 'Неизвестно';

    return (
        <article className="book-card">
            <img
                src={book.cover_url ? book.cover_url : "../../public/cover.jpg"}
                alt="обложка"
                className="img cover-img"
            />
            <div className="book-container">
                <div className="container">
                    <p>{book.title}</p>
                    <p>{authors}</p>
                    <p>ID: {book.id}</p>
                    <p>Доступно книг: {availableCount}</p>
                </div>
                <button className="btn btn-reserve">Забронировать</button>
            </div>

        </article>
    );
}
