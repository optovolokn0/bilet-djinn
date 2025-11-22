import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../hooks';
import type { IBookGroup } from '../../modules';
// Импортируем функции API
import { fetchBookGroups, createBookGroup, createBookCopy } from '../../api/books';

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
    // ИЗМЕНЕНИЕ 1: Вместо URL храним файл
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [genre, setGenre] = useState('');
    const [ageLimit, setAgeLimit] = useState('');

    // --- Состояние логики поиска ---
    const [allGroups, setAllGroups] = useState<IBookGroup[]>([]);
    const [suggestions, setSuggestions] = useState<IBookGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<IBookGroup | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Состояние экземпляров ---
    const [copyCount, setCopyCount] = useState<number>(1);
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

    // 2. Синхронизация инпутов ID
    useEffect(() => {
        setInstanceIds(prevIds => {
            const newIds = Array(copyCount).fill('');
            for (let i = 0; i < Math.min(copyCount, prevIds.length); i++) {
                newIds[i] = prevIds[i];
            }
            return newIds;
        });
    }, [copyCount]);

    // 3. Обработка клика вне контейнера заголовка для закрытия suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                titleContainerRef.current &&
                !titleContainerRef.current.contains(event.target as Node)
            ) {
                // Скрываем предложения, если клик произошел вне контейнера
                setSuggestions([]);
            }
        };

        // Добавляем слушателя только когда модалка открыта
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Очистка слушателя
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // --- Загрузка списка книг через API ---
    const loadGroups = async () => {
        if (!token) return;
        try {
            const data = await fetchBookGroups(token);
            setAllGroups(data);
        } catch (e) {
            console.error(e);
        }
    };

    // --- Сброс формы ---
    const resetForm = () => {
        setTitle('');
        setAuthor('');
        setIsbn('');
        setYear('');
        setPublisher('');
        // Сброс новых полей
        setDescription('');
        setCoverFile(null); // Сброс файла
        setGenre('');
        setAgeLimit('');

        setSelectedGroup(null);
        setSuggestions([]);
        setCopyCount(1);
        setInstanceIds(['']);
        setError(null);
        setIsLoading(false);
    };

    const handleCreateNewWithTitle = () => {
        // Сохраняем: title, author, genre
        // Сбрасываем: все, что связано с группой (selectedGroup, suggestions)
        // Сбрасываем: технические/дополнительные поля (isbn, year, publisher, description, ageLimit, coverFile)

        setSelectedGroup(null);
        setSuggestions([]);

        setIsbn('');
        setYear('');
        setPublisher('');
        setDescription('');
        setAgeLimit('');
        setCoverFile(null);

        // Оставляем title, author, genre, copyCount, instanceIds
        setError(null);
        setIsLoading(false);
    };

    // --- Хендлеры инпутов ---
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

        // Автозаполнение
        setDescription(group.description || '');
        setAgeLimit(group.age_limit?.toString() || '');
        // Жанры
        setGenre(group.genres ? group.genres.map(g => g.name).join(', ') : '');

        // При выборе существующей группы мы обычно не меняем обложку, 
        // но можно оставить null или как-то обозначить, что обложка есть.
        setCoverFile(null);

        setSuggestions([]);
        setCopyCount(1);
    };

    const handleCopyCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        // 1. Принудительное удаление ведущего нуля, если за ним следует другая цифра
        // Например: "05" -> "5", "007" -> "7". Но "0" остается "0".
        if (val.length > 1 && val.startsWith('0')) {
            val = val.replace(/^0+/, ''); // Удаляем один или несколько ведущих нулей
        }

        // 2. Если пользователь стер все (пустая строка) -> ставим 0
        if (val === '') {
            setCopyCount(0);
            return;
        }

        // 3. Преобразуем в число. (Если val уже "5" из "05", то все ок)
        const value = parseInt(val, 10);

        if (!isNaN(value) && value >= 0) {
            setCopyCount(value);
        }
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

        const validInstanceIds = instanceIds.filter(id => id.trim() !== '');
        if (validInstanceIds.length === 0) {
            setError("Введите хотя бы один ID экземпляра");
            setIsLoading(false);
            return;
        }

        try {
            let targetGroupId: number;

            if (selectedGroup) {
                targetGroupId = selectedGroup.id;
            } else {
                // ИЗМЕНЕНИЕ: Формируем FormData с правильными ключами для массивов
                const formData = new FormData();

                formData.append('title', title);
                formData.append('subtitle', '');
                // ... (остальные append'ы полей, не являющихся массивами)
                formData.append('isbn', isbn);
                formData.append('publisher', publisher);
                formData.append('year', (parseInt(year) || 0).toString());
                formData.append('description', description || "Описание отсутствует");
                formData.append('age_limit', (parseInt(ageLimit) || 0).toString());

                if (coverFile) {
                    formData.append('cover_image', coverFile);
                }
                formData.append('created_at', new Date().toISOString());

                // --- ИСПРАВЛЕНИЕ: Сериализация Авторов в JSON строку ---
                const authorsList = author.split(',').map(a => a.trim()).filter(a => a);
                const authorsJson = authorsList.map(authName => ({ name: authName }));

                // Передаем как JSON строку
                formData.append('authors', JSON.stringify(authorsJson));


                // --- ИСПРАВЛЕНИЕ: Сериализация Жанров в JSON строку ---
                const genresList = genre.split(',').map(g => g.trim()).filter(g => g);
                const genresJson = genresList.map(genName => ({ name: genName }));

                // Передаем как JSON строку
                formData.append('genres', JSON.stringify(genresJson));


                // Отправляем FormData в API
                const newGroup = await createBookGroup(token, formData);
                targetGroupId = newGroup.id;
            }

            // Создаем копии (здесь остается JSON, так как файлы не нужны)
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

                    {/* --- Основной блок --- */}
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

                    {/* ИЗМЕНЕНИЕ 3: Input file */}
                    <div className="form-group">
                        <label className="form-label">Загрузить обложку</label>
                        <input
                            className="input"
                            type="file"
                            accept="image/*"
                            onChange={e => setCoverFile(e.target.files?.[0] || null)}
                            disabled={!!selectedGroup}
                            style={{ paddingTop: '8px' }} // Небольшой фикс для input type=file
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

                    {/* --- Технические поля --- */}
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

                    {copyCount > 0 && (
                        <div className="instance-ids-container">
                            <label className="form-label" style={{ marginBottom: '5px', display: 'block' }}>
                                Инвентарный номер (ID) {copyCount > 1 ? `для каждого из ${copyCount} экземпляров` : 'экземпляра'}
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
                        disabled={isLoading || copyCount === 0}
                    >
                        {isLoading ? 'Сохранение...' : (selectedGroup ? 'Добавить экземпляр' : 'Создать книгу')}
                    </button>
                </form>
            </div>
        </div>
    );
}