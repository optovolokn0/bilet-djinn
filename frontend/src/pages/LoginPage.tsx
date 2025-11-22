// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { users } from '../mocks';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(''); // телефон, email или ID
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Находим пользователя по email, телефону или ID
    const user = users.find(u =>
      u.password === password && (
        u.email === identifier ||
        u.phone === identifier ||
        String(u.id) === identifier
      )
    );

    if (!user) {
      setError('Неверный логин или пароль');
      return;
    }

    // Сохраняем пользователя в контекст
    login(user);

    // Редирект в зависимости от роли
    if (user.role === 'reader') navigate('/reader/catalog');
    else if (user.role === 'library') navigate('/library/catalog');
  };

  return (
    <div className="login-page flex justify-center items-center h-screen bg-gray-100">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl mb-4 text-center">Вход</h2>

        <label className="block mb-2">Телефон / Email / ID</label>
        <input
          type="text"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          placeholder="Введите телефон, email или ID"
        />

        <label className="block mb-2">Пароль</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          placeholder="Введите пароль"
        />

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Войти
        </button>
      </form>
    </div>
  );
}
