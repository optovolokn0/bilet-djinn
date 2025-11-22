import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../hooks';
import type { IBookGroup } from '../../modules';
// Импортируем функции API
import { fetchBookGroups, createBookGroup, updateBookGroupImage, createBookCopy } from '../../api/books';

interface CreateBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CreateBookModal({ isOpen, onClose, onSuccess }: CreateBookModalProps) {
    const token = useAppSelector(state => state.auth.access);
    const titleContainerRef = useRef<HTMLDivElement>(null);

    // --- Состояние формы ---
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [year, setYear] = useState('');
    const [publisher, setPublisher] = useState('');

    // Новые поля
    const [description, setDescription] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [genre, setGenre] = useState('');
    const [ageLimit, setAgeLimit] = useState('');

    // --- Состояние логики поиска ---
    const [allGroups, setAllGroups] = useState<IBookGroup[]>([]);
    const [suggestions, setSuggestions] = useState<IBookGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<IBookGroup | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Состояние экземпляров (Copy Count - СТРОКА) ---
    const [copyCount, setCopyCount] = useState<string>('1');
    const [instanceIds, setInstanceIds] = useState<string[]>(['']);

    // 1. Загрузка данных при открытии
    useEffect(() => {
        if (isOpen && token) {
            loadGroups();
            document.body.style.overflow = 'hidden';
            resetForm();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, token]);

    // 2. Синхронизация инпутов ID (преобразуем строку в число)
    useEffect(() => {
        const count = parseInt(copyCount) || 0;
        setInstanceIds(prevIds => {
            const newIds = Array(count).fill('');
            for (let i = 0; i < Math.min(count, prevIds.length); i++) {
                newIds[i] = prevIds[i];
            }
            return newIds;
        });
    }, [copyCount]);

    // 3. Закрытие саджестов по клику вне
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (titleContainerRef.current && !titleContainerRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const loadGroups = async () => {
        if (!token) return;
        try {
            const data = await fetchBookGroups(token);
            setAllGroups(data);
        } catch (e) {
            console.error(e);
        }
    };

    const resetForm = () => {
        setTitle('');
        setAuthor('');
        setIsbn('');
        setYear('');
        setPublisher('');
        setDescription('');
        setCoverFile(null);
        setGenre('');
        setAgeLimit('');
        setSelectedGroup(null);
        setSuggestions([]);
        setCopyCount('1'); // Сброс на строку '1'
        setInstanceIds(['']);
        setError(null);
        setIsLoading(false);
    };

    const handleCreateNewWithTitle = () => {
        setSelectedGroup(null);
        setSuggestions([]);
        setIsbn('');
        setYear('');
        setPublisher('');
        setDescription('');
        setAgeLimit('');
        setCoverFile(null);
        setError(null);
        setIsLoading(false);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTitle(val);
        if (selectedGroup && val !== selectedGroup.title) {
            setSelectedGroup(null);
        }
        if (val.trim().length > 1) {
            const matches = allGroups.filter(bg =>
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
        setDescription(group.description || '');
        setAgeLimit(group.age_limit?.toString() || '');
        setGenre(group.genres ? group.genres.map(g => g.name).join(', ') : '');
        setCoverFile(null);
        setSuggestions([]);
        setCopyCount('1');
    };

    // --- ЛОГИКА INPUT (String based) ---
    const handleCopyCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        // Разрешаем только цифры
        const numericRegex = /^\d*$/;
        if (!numericRegex.test(val)) return;

        // Если пусто - ставим пусто
        if (val === '') {
            setCopyCount('');
            return;
        }

        // Убираем ведущие нули (если это не просто "0")
        let normalizedVal = val;
        if (val.length > 1 && val.startsWith('0')) {
            normalizedVal = val.replace(/^0+/, '');
        }

        setCopyCount(normalizedVal);
    };

    const handleInstanceIdChange = (index: number, value: string) => {
        setInstanceIds(prevIds => {
            const newIds = [...prevIds];
            newIds[index] = value;
            return newIds;
        });
    };

    // --- SUBMIT ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setError(null);
        setIsLoading(true);

        const finalCopyCount = parseInt(copyCount) || 0;
        const validInstanceIds = instanceIds.filter(id => id.trim() !== '');

        if (validInstanceIds.length === 0 || finalCopyCount === 0) {
            setError("Введите хотя бы один ID экземпляра");
            setIsLoading(false);
            return;
        }

        try {
            let targetGroupId: number;

            if (selectedGroup) {
                targetGroupId = selectedGroup.id;
            } else {
                // --- ШАГ 1: Создаем книгу (JSON) ---

                // Подготовка авторов
                const authorsList = author
                    .split(',')
                    .map(a => a.trim())
                    .filter(a => a.length > 0)
                    .map(name => ({ name }));

                // Подготовка жанров
                const genresList = genre
                    .split(',')
                    .map(g => g.trim())
                    .filter(g => g.length > 0)
                    .map(name => ({ name }));

                // Payload (Обычный объект JS)
                const newBookPayload = {
                    title,
                    subtitle: '',
                    isbn,
                    publisher,
                    year: parseInt(year) || 0,
                    description: description || "Описание отсутствует",
                    age_limit: parseInt(ageLimit) || 0,
                    created_at: new Date().toISOString(),
                    authors: authorsList,
                    genres: genresList,
                    cover_image: null // Пока null
                };

                // Отправляем JSON
                const newGroup = await createBookGroup(token, newBookPayload);
                targetGroupId = newGroup.id;

                // --- ШАГ 2: Загружаем обложку (FormData/PATCH) ---
                if (coverFile) {
                    const imageFormData = new FormData();
                    imageFormData.append('cover_image', coverFile);
                    await updateBookGroupImage(token, targetGroupId, imageFormData);
                }
            }

            // --- ШАГ 3: Создаем копии ---
            const copyPromises = validInstanceIds.map(copyId =>
                createBookCopy(token, {
                    id: parseInt(copyId),
                    book_group_id: targetGroupId,
                    status: 'available',
                    condition: 'new',
                    created_at: new Date().toISOString()
                })
            );

            await Promise.all(copyPromises);

            if (onSuccess) onSuccess();
            onClose();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Произошла ошибка при сохранении");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <h2 className="modal-title">
                    {selectedGroup ? "Добавление экземпляра" : "Добавление книги"}
                </h2>

                <form onSubmit={handleSubmit} className="modal-form">

                    {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                    {selectedGroup && (
                        <div className="existing-book-info">
                            <strong>Выбрана существующая группа книг!</strong>
                            <p>Вы добавляете новый физический экземпляр для книги:</p>
                            <p><i>{selectedGroup.title} ({selectedGroup.year})</i></p>
                            <span className="reset-link" onClick={handleCreateNewWithTitle}>Нет, я хочу создать новую книгу с таким названием</span>
                        </div>
                    )}

                    <div className="form-group" style={{ position: 'relative' }} ref={titleContainerRef}>
                        <label className="form-label">Название книги</label>
                        <input
                            className="input"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="Введите название"
                            autoComplete="off"
                            required
                        />
                        {!selectedGroup && suggestions.length > 0 && (
                            <div className="suggestions-list" style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                background: 'white', border: '1px solid #ccc', zIndex: 10,
                                maxHeight: '150px', overflowY: 'auto'
                            }}>
                                {suggestions.map(bg => (
                                    <div
                                        key={bg.id}
                                        className="suggestion-item"
                                        onClick={() => handleSelectSuggestion(bg)}
                                        style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                    >
                                        <strong>{bg.title}</strong> ({bg.year})
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
                        <label className="form-label">Жанры</label>
                        <input
                            className="input"
                            value={genre}
                            onChange={e => setGenre(e.target.value)}
                            placeholder="Фантастика, Драма (через запятую)"
                            disabled={!!selectedGroup}
                        />
                    </div>

                    <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Возраст (Limit)</label>
                            <input
                                className="input"
                                type="number"
                                value={ageLimit}
                                onChange={e => setAgeLimit(e.target.value)}
                                placeholder="0+"
                                onWheel={(e) => e.currentTarget.blur()}
                                disabled={!!selectedGroup}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="form-label">Год издания</label>
                            <input
                                className="input"
                                type="number"
                                value={year}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={e => setYear(e.target.value)}
                                disabled={!!selectedGroup}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Загрузить обложку</label>
                        <input
                            className="input"
                            type="file"
                            accept="image/*"
                            onChange={e => setCoverFile(e.target.files?.[0] || null)}
                            disabled={!!selectedGroup}
                            style={{ paddingTop: '8px' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Описание</label>
                        <textarea
                            className="input"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Краткое описание книги..."
                            rows={3}
                            disabled={!!selectedGroup}
                            style={{ resize: 'vertical' }}
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
                            onWheel={(e) => e.currentTarget.blur()}
                            required
                        />
                    </div>

                    {(parseInt(copyCount) || 0) > 0 && (
                        <div className="instance-ids-container">
                            <label className="form-label" style={{ marginBottom: '5px', display: 'block' }}>
                                Инвентарный номер (ID) {parseInt(copyCount) > 1 ? `для каждого из ${copyCount} экземпляров` : 'экземпляра'}
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

                    <button
                        type="submit"
                        className="btn"
                        style={{ marginTop: '10px' }}
                        disabled={isLoading || (parseInt(copyCount) || 0) === 0}
                    >
                        {isLoading ? 'Сохранение...' : (selectedGroup ? 'Добавить экземпляр' : 'Создать книгу')}
                    </button>
                </form>
            </div>
        </div>
    );
}