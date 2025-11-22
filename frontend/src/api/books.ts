// src/api/books.ts
import { API_BASE_URL } from "../config"; // Убедитесь, что путь к config верный
import type { IBookGroup } from "../modules";

const BOOK_GROUPS_URL = `${API_BASE_URL}/book-groups/`;
const BOOK_COPIES_URL = `${API_BASE_URL}/book-copies/`;

// --- Интерфейсы ---

export interface ICreateBookCopyPayload {
    id: number;
    book_group_id: number;
    status: 'available' | 'issued' | 'lost' | 'maintenance' | 'reserved';
    condition?: string;
    created_at?: string;
}

export interface IIssueBookPayload {
    id: number;           // ID копии
    reader_id: number;    // ID читателя
    book_group_id: number;// ID группы книг
    status: 'issued';     // Статус всегда 'issued' при выдаче
    condition?: string;   // Состояние книги
    created_at: string;   // Дата выдачи (обычно текущая)
    // Примечание: Если бэкенд начнет принимать срок сдачи, добавить due_at сюда
}

// --- Функции API ---

// 1. Получить список всех групп книг (для автокомплита)
export const fetchBookGroups = async (token: string): Promise<IBookGroup[]> => {
    const res = await fetch(BOOK_GROUPS_URL, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        throw new Error("Не удалось загрузить список книг");
    }
    return res.json();
};

// 2. Создать новую группу книг (JSON) - БЕЗ картинки
export const createBookGroup = async (token: string, data: any): Promise<IBookGroup> => {
    const res = await fetch(BOOK_GROUPS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json", // Важно: отправляем как JSON
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        // Пытаемся достать детали ошибки из DRF (обычно detail или поле с ошибкой)
        const errorMsg = JSON.stringify(errData) || "Не удалось создать группу книг";
        throw new Error(errorMsg);
    }

    return res.json();
};

// 3. Обновить обложку книги (FormData/PATCH) - Только картинка
export const updateBookGroupImage = async (token: string, id: number, formData: FormData): Promise<IBookGroup> => {
    const res = await fetch(`${BOOK_GROUPS_URL}${id}/`, {
        method: "PATCH",
        headers: {
            // Content-Type не ставим, браузер сам выставит boundary
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!res.ok) {
        console.error("Ошибка загрузки изображения");
        // Не выбрасываем критическую ошибку, так как книга уже создана, просто вернем что есть
    }
    return res.json();
}

// 4. Создать экземпляр (копию) книги
export const createBookCopy = async (token: string, data: ICreateBookCopyPayload): Promise<any> => {
    const res = await fetch(BOOK_COPIES_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error(`Не удалось создать экземпляр ID: ${data.id}`);
    }

    return res.json();
};

// 5. Выдать экземпляр книги читателю
export const issueBookCopy = async (token: string, copyId: number, data: IIssueBookPayload): Promise<any> => {
    // Обратите внимание: copyId идет и в URL, и в body (согласно вашему примеру)
    const res = await fetch(`${BOOK_COPIES_URL}${copyId}/issue/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.detail || JSON.stringify(errData) || `Не удалось выдать книгу (ID копии: ${copyId})`;
        throw new Error(errorMsg);
    }

    return res.json();
};