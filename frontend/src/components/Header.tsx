import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks';
import { logout } from '../features/auth/authSlice';
import CreateBookModal from './modals/CreateBookModal';

export default function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // 🆕 Состояние для мобильного меню
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const dropdownRef = useRef<HTMLDivElement>(null);
  // 🆕 Реф для мобильного меню
  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpenModal = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsModalOpen(true);
    setIsMenuOpen(false); // Закрываем меню при открытии модалки
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const handleIconClick = () => {
    setIsDropdownOpen(prev => !prev);
  };

  // 🆕 Тоггл для мобильного меню
  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 🆕 Закрытие мобильного меню при клике вне
  useEffect(() => {
    const handleClickOutsideMenu = (event: MouseEvent) => {
      // Игнорируем клик по самой кнопке бургера (она обрабатывается своим onClick)
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

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutsideMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMenu);
    };
  }, [isMenuOpen]);

  return (
    <header className="header">
      {/* 🆕 Кнопка бургера (видна только на < 820px) */}
      <div className="burger-btn" onClick={toggleMenu}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 18L20 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M4 12L20 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M4 6L20 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <Link to="/" className="logo">Библиотеки Екатеринбурга</Link>

      <nav className="nav">
        {/* Десктопное меню (скрывается на < 820px через CSS) */}
        <div className="actions">
          {user?.role === 'reader' && (
            <>
              <Link to="/reader/catalog" className="nav-item">Каталог</Link>
              <Link to="/reader/events" className="nav-item">Мероприятия</Link>
              <Link to="/reader/map" className="nav-item">Карта</Link>
            </>
          )}

          {user?.role === 'library' && (
            <>
              <Link to="/library/catalog" className="nav-item">Каталог</Link>
              <Link to="/library/events" className="nav-item">Мероприятия</Link>
              <Link to="/library/issued" className="nav-item">Выданные книги</Link>
              <Link to="/library/new-book" className="nav-item" onClick={handleOpenModal}>Добавить книгу</Link>
              <Link to="/library/register-reader" className="nav-item">Регистрация читателя</Link>
              <Link to="/library/renew" className="nav-item">Заявки на продление</Link>
            </>
          )}
        </div>

        <div className="user">
          {user ? (
            <>
              <div className="user-id">ID: {user.id}</div>
              <svg className='notification-icon' width="31" height="34" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.0758 36.2061C20.7632 36.7517 20.3146 37.2046 19.7749 37.5194C19.2351 37.8343 18.6231 38 18.0002 38C17.3773 38 16.7654 37.8343 16.2256 37.5194C15.6859 37.2046 15.2372 36.7517 14.9247 36.2061M28.6669 12.8019C28.6669 9.93707 27.5431 7.18956 25.5427 5.16381C23.5423 3.13806 20.8292 2 18.0002 2C15.1713 2 12.4582 3.13806 10.4578 5.16381C8.45738 7.18956 7.33358 9.93707 7.33358 12.8019C7.33358 25.4041 2.00024 29.0048 2.00024 29.0048H34.0002C34.0002 29.0048 28.6669 25.4041 28.6669 12.8019Z" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div className="user-menu-wrapper" ref={dropdownRef}>
                <svg className='user-icon' width="31" height="34" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg" onClick={handleIconClick} >
                  <path d="M34 38V34C34 31.8783 33.1571 29.8434 31.6569 28.3431C30.1566 26.8429 28.1217 26 26 26H10C7.87827 26 5.84344 26.8429 4.34315 28.3431C2.84285 29.8434 2 31.8783 2 34V38M26 10C26 14.4183 22.4183 18 18 18C13.5817 18 10 14.4183 10 10C10 5.58172 13.5817 2 18 2C22.4183 2 26 5.58172 26 10Z" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    {user?.role === 'reader' && (
                      <>
                        <Link to="/reader/my-books" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Мои книги</Link>
                        <Link to="/reader/history" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>История</Link>
                      </>
                    )}
                    <div onClick={handleLogout} className="dropdown-item logout-item">Выход</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="text-sm underline">Войти</Link>
          )}
        </div>
      </nav>

      {/* 🆕 Мобильное меню (выезжает слева) */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`} ref={menuRef}>
        <div className="mobile-menu-content">
          {user?.role === 'reader' && (
            <>
              <Link to="/reader/catalog" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Каталог</Link>
              <Link to="/reader/events" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Мероприятия</Link>
              <Link to="/reader/map" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Карта</Link>
            </>
          )}

          {user?.role === 'library' && (
            <>
              <Link to="/library/catalog" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Каталог</Link>
              <Link to="/library/events" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Мероприятия</Link>
              <Link to="/library/issued" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Выданные книги</Link>
              <Link to="/library/new-book" className="mobile-nav-item" onClick={handleOpenModal}>Добавить книгу</Link>
              <Link to="/library/reg-reader" className="mobile-nav-item" onClick={() => setIsMenuOpen(false)}>Регистрация читателя</Link>
            </>
          )}

           {/* Дублируем ссылки профиля для удобства на мобильном */}
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

      <CreateBookModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </header>
  );
}