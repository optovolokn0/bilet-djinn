import React, { useState, useEffect } from 'react';
// Импортируем стили, чтобы они применились к разметке ниже
import '../../style/modal.css';
import { bookGroups } from '../../mocks';
import type { IBookGroup } from '../../modules';

interface CreateBookModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateBookModal({ isOpen, onClose }: CreateBookModalProps) {
    // --- Состояние формы ---
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [year, setYear] = useState('');
    const [publisher, setPublisher] = useState('');

    // --- Состояние логики "Существующая группа vs Новая" ---
    const [suggestions, setSuggestions] = useState<IBookGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<IBookGroup | null>(null);

    // 1. ЛОГИКА МОДАЛКИ: Блокировка скролла при открытии
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            resetForm(); // Сбрасываем форму при открытии
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // 2. ЛОГИКА МОДАЛКИ: Закрытие по клику на фон
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const resetForm = () => {
        setTitle('');
        setAuthor('');
        setIsbn('');
        setYear('');
        setPublisher('');
        setSelectedGroup(null);
        setSuggestions([]);
    };

    // --- Логика формы (без изменений) ---

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);

        if (selectedGroup && val !== selectedGroup.title) {
            setSelectedGroup(null);
        }

        if (val.trim().length > 1) {
            const matches = bookGroups.filter(bg =>
                bg.title.toLowerCase().includes(val.toLowerCase())
            );
            setSuggestions(matches);
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectSuggestion = (group: IBookGroup) => {
        setSelectedGroup(group);
        setTitle(group.title);
        setAuthor(group.authors.map(a => a.name).join(', '));
        setIsbn(group.isbn || '');
        setYear(group.year?.toString() || '');
        setPublisher(group.publisher || '');
        setSuggestions([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedGroup) {
            console.log('Создание экземпляра для группы:', selectedGroup.id);
            alert(`Успешно добавлен новый экземпляр книги "${selectedGroup.title}" (ID группы: ${selectedGroup.id})`);
        } else {
            console.log('Создание новой группы книг:', { title, author, isbn, year, publisher });
            alert(`Создана новая книга "${title}" и её первый экземпляр`);
        }

        onClose();
    };

    // Если закрыто — ничего не рендерим
    if (!isOpen) return null;

    return (
        // Оверлей (фон)
        <div className="modal-overlay" onClick={handleOverlayClick}>

            {/* Контент модалки */}
            <div className="modal-content">
                {/* Кнопка закрытия (крестик) */}
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <h2 className="modal-title">
                    {selectedGroup ? "Добавление экземпляра" : "Добавление книги"}
                </h2>

                <form onSubmit={handleSubmit} className="modal-form">

                    {selectedGroup && (
                        <div className="existing-book-info">
                            <strong>Выбрана существующая группа книг!</strong>
                            <p>Вы добавляете новый физический экземпляр для книги:</p>
                            <p><i>{selectedGroup.title} ({selectedGroup.year})</i></p>
                            <span className="reset-link" onClick={resetForm}>
                                Нет, я хочу создать новую книгу с таким названием
                            </span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Название книги</label>
                        <input
                            className="input"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="Введите название (например, Война и мир)"
                            autoComplete="off"
                            required
                        />
                        {/* Выпадающий список */}
                        {!selectedGroup && suggestions.length > 0 && (
                            <div className="suggestions-list">
                                {suggestions.map(bg => (
                                    <div key={bg.id} className="suggestion-item" onClick={() => handleSelectSuggestion(bg)}>
                                        <strong>{bg.title}</strong>
                                        <small>{bg.authors.map(a => a.name).join(', ')} ({bg.year})</small>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Автор(ы)</label>
                        <input
                            className="input"
                            value={author}
                            onChange={e => setAuthor(e.target.value)}
                            placeholder="Авторы через запятую"
                            disabled={!!selectedGroup}
                        />
                    </div>


                    <div className="form-group">
                        <label className="form-label">Год издания</label>
                        <input
                            className="input"
                            type="number"
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            disabled={!!selectedGroup}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">ISBN</label>
                        <input
                            className="input"
                            value={isbn}
                            onChange={e => setIsbn(e.target.value)}
                            disabled={!!selectedGroup}
                        />
                    </div>


                    <div className="form-group">
                        <label className="form-label">Издательство</label>
                        <input
                            className="input"
                            value={publisher}
                            onChange={e => setPublisher(e.target.value)}
                            disabled={!!selectedGroup}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Количество копий</label>
                        <input
                            className="input"
                            type="number"
                            defaultValue="1"
                            min="1"
                        />
                    </div>

                    <button type="submit" className="btn" style={{ marginTop: '10px' }}>
                        {selectedGroup ? 'Добавить экземпляр' : 'Создать книгу'}
                    </button>
                </form>
            </div>
        </div>
    );
}