import React from 'react';
import { type IBookGroup } from '../modules';
import { Link } from 'react-router-dom';

export default function BookCard({ book, availableCount }:
  { book: IBookGroup; availableCount: number }) {
  return (
    <div className="bg-white rounded shadow p-3 flex gap-3">
      <div className="w-20 h-28 bg-gray-200 flex items-center justify-center">Обложка</div>
      <div className="flex-1">
        <Link to={`/reader/catalog/book/${book.id}`} className="font-semibold">{book.title}</Link>
        {book.subtitle && <div className="text-sm text-gray-600">{book.subtitle}</div>}
        <div className="text-xs text-gray-500">ID: {book.id}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="text-sm">Доступно: {availableCount}</div>
        <button className="px-3 py-1 border rounded text-sm">Отложить</button>
      </div>
    </div>
  );
}
