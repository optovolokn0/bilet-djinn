import React from 'react';

// SVG-иконка лупы
const SearchIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export default function SearchBar({ value, onChange, placeholder }:
    { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        // Оборачиваем инпут в div для позиционирования иконки
        <div className="search-input-wrapper">
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || 'Поиск'}
                className="input search-input"
            />
            {/* Иконка лупы без функционала */}
            <div className="search-icon">
                {SearchIcon}
            </div>
        </div>
    );
}