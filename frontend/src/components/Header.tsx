import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { auth } from '../App';

export default function Header() {
    //   const user = auth.getUser();
    const user = {
        id: 523523,
        role: 'library'
    }
    // const nav = useNavigate();

    return (
        <header className="header">
            <Link to="/" className="logo">Библиотеки Екатеринбурга</Link>
            <nav className='nav'>

                <div className='actions'>
                    <div className="catalog">
                        {user && user.role === 'reader' && <Link to="/reader/catalog" className="nav-item">Каталог</Link>}
                        {user && user.role === 'library' && <Link to="/library/catalog" className="nav-item">Каталог</Link>}
                    </div>

                    <div className="events">
                        {user && user.role === 'reader' && <Link to="/reader/events" className="nav-item">Мероприятия</Link>}
                        {user && user.role === 'library' && <Link to="/library/events" className="nav-item">Мероприятия</Link>}
                    </div>

                    <div className="catalog">
                        {user && user.role === 'library' && <Link to="/library/issued" className="nav-item">Выданные книги</Link>}
                    </div>

                    <div className="catalog">
                        {user && user.role === 'library' && <Link to="/library/new-book" className="nav-item">Добавить книгу</Link>}
                    </div>

                    <div className="catalog">
                        {user && user.role === 'library' && <Link to="/library/reg-reader" className="nav-item">Регистрация читателя</Link>}
                    </div>
                </div>

                <div className="user">
                    {user ? (
                        <>
                            {/* {user.role === 'library' && (
                            <input className="p-1 border rounded text-sm" placeholder="Поиск читателя по ID" onKeyDown={(e) => {
                                if (e.key === 'Enter') nav(`/library/reader/${(e.target as HTMLInputElement).value}`);
                            }} />
                        )} */}
                            <div className="user-id">ID: {user.id}</div>
                            <svg className='notification-icon' width="31" height="34" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21.0758 36.2061C20.7632 36.7517 20.3146 37.2046 19.7749 37.5194C19.2351 37.8343 18.6231 38 18.0002 38C17.3773 38 16.7654 37.8343 16.2256 37.5194C15.6859 37.2046 15.2372 36.7517 14.9247 36.2061M28.6669 12.8019C28.6669 9.93707 27.5431 7.18956 25.5427 5.16381C23.5423 3.13806 20.8292 2 18.0002 2C15.1713 2 12.4582 3.13806 10.4578 5.16381C8.45738 7.18956 7.33358 9.93707 7.33358 12.8019C7.33358 25.4041 2.00024 29.0048 2.00024 29.0048H34.0002C34.0002 29.0048 28.6669 25.4041 28.6669 12.8019Z" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            <svg className='user-icon' width="31" height="34" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M34 38V34C34 31.8783 33.1571 29.8434 31.6569 28.3431C30.1566 26.8429 28.1217 26 26 26H10C7.87827 26 5.84344 26.8429 4.34315 28.3431C2.84285 29.8434 2 31.8783 2 34V38M26 10C26 14.4183 22.4183 18 18 18C13.5817 18 10 14.4183 10 10C10 5.58172 13.5817 2 18 2C22.4183 2 26 5.58172 26 10Z" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>


                            {/* <button className="text-sm underline" onClick={() => { auth.logout(); nav('/login'); }}>Выйти</button> */}
                        </>
                    ) : (
                        <Link to="/login" className="text-sm underline">Войти</Link>
                    )}
                </div>

            </nav>

        </header>
    );
}
