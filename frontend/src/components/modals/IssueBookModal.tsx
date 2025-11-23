import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../hooks';
import type { IBookGroup } from '../../modules';
import { issueBookCopy } from '../../api/books';
import '../../style/modal.css'; // Используем те же стили

interface IssueBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: IBookGroup | null; // Книга, которую выдаем (для отображения названия)
    onSuccess?: () => void;
}

export default function IssueBookModal({ isOpen, onClose, book, onSuccess }: IssueBookModalProps) {
    const token = useAppSelector(state => state.auth.access);

    // --- Состояние формы ---
    const [copyId, setCopyId] = useState('');
    const [readerId, setReaderId] = useState('');
    const [condition, setCondition] = useState('good'); // По умолчанию хорошее
    // Срок выдачи (для UI, пока API не поддерживает отправку due_at, будем просто хранить)
    // const [dueDate, setDueDate] = useState(''); 

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1. Блокировка скролла и сброс при открытии
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            resetForm();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const resetForm = () => {
        setCopyId('');
        setReaderId('');
        setCondition('good');
        // setDueDate('');
        setError(null);
        setIsLoading(false);
    };

    // --- Хендлеры ---

    // Обработка ввода ID (разрешаем только цифры)
    const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        const val = e.target.value;
        const numericRegex = /^\d*$/;
        if (numericRegex.test(val)) {
            // Убираем ведущие нули
            if (val.length > 1 && val.startsWith('0')) {
                setter(val.replace(/^0+/, ''));
            } else {
                setter(val);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !book) return;

        setError(null);
        setIsLoading(true);

        if (!copyId || !readerId) {
            setError("Заполните ID экземпляра и ID читателя");
            setIsLoading(false);
            return;
        }

        try {
            const copyIdNum = parseInt(copyId);
            const readerIdNum = parseInt(readerId);

            // Формируем тело запроса согласно вашему примеру
            const payload = {
                id: copyIdNum,
                reader_id: readerIdNum,
                book_group_id: book.id,
                status: 'issued' as const,
                condition: condition,
                created_at: new Date().toISOString(),
                // Примечание: API в примере не принимает срок сдачи (dueDate),
                // поэтому отправляем дату выдачи (created_at).
            };

            await issueBookCopy(token, copyIdNum, payload);



            if (onSuccess) onSuccess();
            onClose();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ошибка при выдаче книги");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !book) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <h2 className="modal-title">Выдача книги</h2>

                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Информация о книге (только для чтения) */}
                    <div className="existing-book-info">
                        <p style={{ fontSize: '16px', marginBottom: '5px' }}>Вы выдаете книгу:</p>
                        <p><strong>{book.title}</strong></p>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                            {book.authors?.map(a => a.name).join(', ')} ({book.year})
                        </p>
                    </div>

                    {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                    {/* Поля ввода */}
                    <div className="form-group">
                        <label className="form-label">ID экземпляра (Инвентарный номер)</label>
                        <input
                            className="input"
                            type="text" // text чтобы контролировать ввод через regex
                            value={copyId}
                            onChange={(e) => handleNumberInput(e, setCopyId)}
                            placeholder="Например: 1052"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">ID Читателя</label>
                        <input
                            className="input"
                            type="text"
                            value={readerId}
                            onChange={(e) => handleNumberInput(e, setReaderId)}
                            placeholder="Введите ID читателя"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Состояние книги</label>
                        <select
                            className="input" // Используем тот же класс для стилей
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            style={{ background: 'white' }}
                        >
                            <option value="new">Новая</option>
                            <option value="good">Хорошее</option>
                            <option value="worn">Потрепанная</option>
                            <option value="damaged">Поврежденная</option>
                        </select>
                    </div>

                    {/* Пример поля "Срок выдачи" (закомментирован, т.к. бэкенд его не ждет в JSON) */}
                    {/* <div className="form-group">
                        <label className="form-label">Срок возврата</label>
                        <input
                            className="input"
                            type="date"
                            // Логика для dueDate...
                        />
                    </div> 
                    */}

                    <button
                        type="submit"
                        className="btn"
                        style={{ marginTop: '15px' }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Обработка...' : 'Выдать книгу'}
                    </button>
                </form>
            </div>
        </div>
    );
}