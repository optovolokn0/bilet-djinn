import React from 'react';
import BookCard from './BookCard';
import { type IBookGroup } from '../modules';

export default function BookList({ items, counts }:
  { items: IBookGroup[]; counts: Record<number, number> }) {
  return (
    <div className="space-y-3">
      {items.map(b => <BookCard key={b.id} book={b} availableCount={counts[b.id] || 0} />)}
    </div>
  );
}
