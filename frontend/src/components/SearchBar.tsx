import React from 'react';

export default function SearchBar({ value, onChange, placeholder }:
  { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || 'Поиск'}
      className="input search-input"
    />
  );
}