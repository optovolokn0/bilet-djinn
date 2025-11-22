import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// SVG-иконка открытого глаза (Показать пароль)
const EyeOpenIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

// SVG-иконка закрытого глаза (Скрыть пароль)
const EyeClosedIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.46m3.02-1.9A10.07 10.07 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.21a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);


export default function LoginPage() {

    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // showPassword: false гарантирует, что изначально будет type="password"
    const [showPassword, setShowPassword] = useState(false); 
    const [error, setError] = useState<string | null>(null);

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!username.trim()) {
            setError('Введите логин');
            return;
        }
        if (!password) {
            setError('Введите пароль');
            return;
        }

        navigate('/reader/catalog');
    };


    return (
        <div className="login-card">
            <p className="login-title">Вход в аккаунт</p>

            <form onSubmit={handleSubmit} className="login-form">
                <div className="username">
                    <label className="label">Логин</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoComplete="username"
                        placeholder="Введите логин"
                        className="input"
                    />
                </div>


                <div className="password">
                    <label className="label">Пароль</label>
                    <div className="password-input-wrapper"> 
                        <input
                            id="password"
                            // Тип поля: 'password' (****) если showPassword=false
                            type={showPassword ? 'text' : 'password'} 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
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


                <button className="btn" type="submit">Войти</button>
                <p className="hint">Для получения доступа или создания нового аккаунта, пожалуйста, обратитесь к сотруднику библиотеки</p>
            </form>
        </div>
    );
}