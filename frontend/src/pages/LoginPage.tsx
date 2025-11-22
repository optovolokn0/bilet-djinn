import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from "../hooks";
import { setCredentials } from "../features/auth/authSlice";
import type { IUser, UserRole } from "../modules";

// --- SVG Иконки (из второго файла) ---
const EyeOpenIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeClosedIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.46m3.02-1.9A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.21a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const LoginPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // --- Состояние (Логика из первого файла + UI стейт глаза из второго) ---
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [isLibrary, setIsLibrary] = useState(false); // Логика чекбокса
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false); // Логика глаза

    // Переключатель видимости пароля
    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    // --- Основная логика входа (из первого файла) ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Важно для работы внутри <form>
        
        try {
            setError("");

            // endpoint по роли
            const endpoint = isLibrary
                ? "https://truly-economic-vervet.cloudpub.ru/api/auth/library/login/"
                : "https://truly-economic-vervet.cloudpub.ru/api/auth/reader/login/";

            // 1. Логинимся
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: login, password }),
            });

            if (!response.ok) throw new Error("Неверный логин или пароль");

            const data = await response.json();
            const { access, refresh } = data;

            // 2. Получаем данные пользователя
            const userResp = await fetch(
                "https://truly-economic-vervet.cloudpub.ru/api/auth/me/",
                { headers: { Authorization: `Bearer ${access}` } }
            );

            if (!userResp.ok) throw new Error("Не удалось получить данные пользователя");

            const userData = await userResp.json();

            const mappedUser: IUser = {
                id: userData.id,
                role: userData.role as UserRole,
                username: userData.username ?? null,
                first_name: userData.first_name ?? null,
                last_name: userData.last_name ?? null,
                password: "",
                email: userData.email ?? null,
                phone: userData.phone ?? null,
                birth_date: userData.birth_date ?? null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // 3. Сохраняем в Redux
            dispatch(setCredentials({ access, refresh, user: mappedUser }));

            // 4. Редирект по роли
            if (mappedUser.role === "reader") navigate("/reader/catalog");
            else if (mappedUser.role === "library") navigate("/library/catalog");

        } catch (err: any) {
            setError(err?.message || "Ошибка входа");
        }
    };

    // --- Верстка (UI из второго файла) ---
    return (
        <div className="login-card">
            <p className="login-title">Вход в аккаунт</p>

            <form onSubmit={handleLogin} className="login-form">
                {/* Поле Логин */}
                <div className="username">
                    <label className="label">Логин</label>
                    <input
                        id="username"
                        type="text"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        autoComplete="username"
                        placeholder="Логин / Email / Номер билета"
                        className="input"
                    />
                </div>

                {/* Поле Пароль */}
                <div className="password">
                    <label className="label">Пароль</label>
                    <div className="password-input-wrapper">
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="Введите пароль"
                            className="input"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="toggle-password-btn"
                            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                        >
                            {showPassword ? EyeOpenIcon : EyeClosedIcon}
                        </button>
                    </div>
                </div>

                {/* Чекбокс "Библиотекарь" (Добавлен в дизайн) */}
                <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        id="is-library"
                        type="checkbox"
                        checked={isLibrary}
                        onChange={() => setIsLibrary(!isLibrary)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="is-library" style={{ fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}>
                        Войти как библиотекарь
                    </label>
                </div>

                {/* Вывод ошибки */}
                {error && (
                    <div style={{ color: "#d32f2f", fontSize: "14px", marginTop: "10px", textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {/* Кнопка */}
                <button className="btn" type="submit" style={{ marginTop: '20px' }}>
                    Войти
                </button>

                <p className="hint">
                    Для получения доступа или создания нового аккаунта, пожалуйста, обратитесь к сотруднику библиотеки
                </p>
            </form>
        </div>
    );
};

export default LoginPage;