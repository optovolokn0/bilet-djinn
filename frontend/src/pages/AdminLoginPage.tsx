// src/pages/admin/AdminLoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await adminApi.login({ username, password });
      // Сохраняем токены
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      // Сохраняем роль, чтобы ProtectedRoute пустил нас
      localStorage.setItem('user_role', 'admin'); 
      
      navigate('/admin/users');
    } catch (err) {
      setError('Неверный логин или пароль администратора');
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Вход для администратора</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        <button type="submit" style={{ padding: '10px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Войти
        </button>
      </form>
    </div>
  );
}