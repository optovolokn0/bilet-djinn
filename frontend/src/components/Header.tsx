import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks';
import { logout } from '../features/auth/authSlice';
import CreateBookModal from './modals/CreateBookModal';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpenModal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const handleIconClick = () => setIsDropdownOpen((prev) => !prev);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutsideMenu = (event: MouseEvent) => {
      const burgerBtn = document.querySelector('.burger-btn');
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        burgerBtn &&
        !burgerBtn.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutsideMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, [isMenuOpen]);

  return (
    <header className="header">
      <div className="burger-btn" onClick={toggleMenu}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 18L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 12L20 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 6L20 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <Link to="/" className="logo">Библиотеки Екатеринбурга</Link>

      <div className="user">
        {user ? (
          <>
            <div className="user-id">ID: {user.id}</div>
            <svg
              className='user-icon'
              width="31"
              height="34"
              viewBox="0 0 36 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={handleIconClick}
            >
              <path
                d="M34 38V34C34 31.8783 33.1571 29.8434 31.6569 28.3431C30.1566 26.8429 28.1217 26 26 26H10C7.87827 26 5.84344 26.8429 4.34315 28.3431C2.84285 29.8434 2 31.8783 2 34V38M26 10C26 14.4183 22.4183 18 18 18C13.5817 18 10 14.4183 10 10C10 5.58172 13.5817 2 18 2C22.4183 2 26 5.58172 26 10Z"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {isDropdownOpen && (
              <div className="dropdown-menu" ref={dropdownRef}>
                {user?.role === 'reader' && (
                  <>
                    <Link to="/reader/my-books" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Мои книги</Link>
                    <Link to="/reader/history" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>История</Link>
                  </>
                )}
                <div onClick={handleLogout} className="dropdown-item logout-item">Выход</div>
              </div>
            )}
          </>
        ) : (
          <Link to="/login" className="text-sm underline">Войти</Link>
        )}
      </div>

      {/* Мобильное меню для всех экранов */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`} ref={menuRef}>
        <div className="mobile-menu-content">
          {user?.role === 'reader' && (
            <>
              <Link to="/reader/catalog" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Каталог</Link>
              <Link to="/reader/events" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Мероприятия</Link>
              <Link to="/reader/recommendations" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Рекомендации</Link>
              <Link to="/reader/map" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Карта</Link>
            </>
          )}

          {user?.role === 'library' && (
            <>
              <Link to="/library/catalog" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Каталог</Link>
              <Link to="/library/events" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Мероприятия</Link>
              <Link to="/library/issued" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Выданные книги</Link>
              <Link to="/library/new-book" className="mobile-nav-item" onClick={handleOpenModal}>Добавить книгу</Link>
              <Link to="/library/register-reader" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Регистрация читателя</Link>
              <Link to="/library/renew" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Заявки на продление</Link>
            </>
          )}

          {user && <div className="mobile-divider"></div>}

          {user?.role === 'reader' && (
            <>
              <Link to="/reader/my-books" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Мои книги</Link>
              <Link to="/reader/history" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>История</Link>
            </>
          )}

          {user && <div onClick={handleLogout} className="mobile-nav-item logout-item">Выход</div>}
        </div>
      </div>

      <CreateBookModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </header>
  );
}
