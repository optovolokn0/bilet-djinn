import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks';
import { logout } from '../features/auth/authSlice';

export default function Header() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login'); // редирект на страницу входа
  };

  return (
    <header className="header">
      <Link to="/" className="logo">Библиотеки Екатеринбурга</Link>

      <nav className="nav">
        <div className="actions">
          {user?.role === 'reader' && (
            <>
              <Link to="/reader/catalog" className="nav-item">Каталог</Link>
              <Link to="/reader/events" className="nav-item">Мероприятия</Link>
            </>
          )}

          {user?.role === 'library' && (
            <>
              <Link to="/library/catalog" className="nav-item">Каталог</Link>
              <Link to="/library/events" className="nav-item">Мероприятия</Link>
              <Link to="/library/issued" className="nav-item">Выданные книги</Link>
              <Link to="/library/new-book" className="nav-item">Добавить книгу</Link>
              <Link to="/library/reg-reader" className="nav-item">Регистрация читателя</Link>
            </>
          )}
        </div>

        <div className="user">
          {user ? (
            <>
              <span className="user-id">ID: {user.id}</span>
              <button
                onClick={handleLogout}
                style={{ marginLeft: '10px', cursor: 'pointer' }}
              >
                Выйти
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm underline">Войти</Link>
          )}
        </div>
      </nav>
    </header>
  );
}