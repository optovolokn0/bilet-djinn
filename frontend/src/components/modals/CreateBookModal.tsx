import React, { useState, useEffect } from 'react';
// Импортируем стили, чтобы они применились к разметке ниже
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

    const [copyCount, setCopyCount] = useState<number>(1);
    const [instanceIds, setInstanceIds] = useState<string[]>(['']);

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

    // 💡 НОВЫЙ ЭФФЕКТ: Синхронизация полей ID с количеством копий
    useEffect(() => {
        // Создаем новый массив ID, основываясь на новом copyCount
        setInstanceIds(prevIds => {
            const newIds = Array(copyCount).fill('');
            // Копируем существующие значения, если они есть
            for (let i = 0; i < Math.min(copyCount, prevIds.length); i++) {
                newIds[i] = prevIds[i];
            }
            return newIds;
        });
    }, [copyCount]);

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
        setCopyCount(1);
        setInstanceIds(['']);
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
        setCopyCount(1);
    };

    // 💡 НОВЫЙ ХЕНДЛЕР: Обновление количества копий
    const handleCopyCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        // Проверка на корректность и минимальное значение
        if (!isNaN(value) && value >= 1) {
            setCopyCount(value);
        } else if (e.target.value === '') {
            setCopyCount(0); // Или 1, в зависимости от требуемой логики
        }
    };

    // 💡 НОВЫЙ ХЕНДЛЕР: Обновление ID конкретного экземпляра
    const handleInstanceIdChange = (index: number, value: string) => {
        setInstanceIds(prevIds => {
            const newIds = [...prevIds];
            newIds[index] = value;
            return newIds;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 💡 ЛОГИКА: Фильтрация пустых ID перед отправкой
        const validInstanceIds = instanceIds.filter(id => id.trim() !== '');

        if (selectedGroup) {
            console.log(`Добавление ${validInstanceIds.length} экземпляров для группы:`, selectedGroup.id);
            console.log('ID экземпляров:', validInstanceIds);
            alert(`Успешно добавлено ${validInstanceIds.length} новых экземпляров для книги "${selectedGroup.title}" (ID: ${validInstanceIds.join(', ')})`);
        } else {
            console.log('Создание новой группы книг:', { title, author, isbn, year, publisher });
            console.log('ID экземпляров:', validInstanceIds);
            alert(`Создана новая книга "${title}" и её ${validInstanceIds.length} экземпляров (ID: ${validInstanceIds.join(', ')})`);
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
                            value={copyCount}
                            onChange={handleCopyCountChange}
                            min="1"
                            required
                        />
                    </div>

          
                    {copyCount > 0 && (
                        <div className="instance-ids-container">
                            <label className="form-label" style={{ marginBottom: '5px', display: 'block' }}>
                                ID {copyCount > 1 ? `для каждого из ${copyCount} экземпляров` : 'экземпляра'}
                            </label>
                          
                            {instanceIds.map((id, index) => (
                                <div key={index} className="form-group-small" style={{ marginBottom: '10px' }}>
                                    <input
                                        className="input"
                                        type="text"
                                        value={id}
                                        onChange={(e) => handleInstanceIdChange(index, e.target.value)}
                                        placeholder={`Введите ID экземпляра ${index + 1}`}
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <button type="submit" className="btn" style={{ marginTop: '10px' }}>
                        {selectedGroup ? 'Добавить экземпляр' : 'Создать книгу'}
                    </button>
                </form>
            </div>
        </div>
    );
}