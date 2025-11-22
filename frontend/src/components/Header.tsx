import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { auth } from '../App';

export default function Header() {
    //   const user = auth.getUser();
    const user = {
        id: 1,
        role: 'reader'
    }
    // const nav = useNavigate();

    return (
        <header className="header">
            <div className="catalog">
                <Link to="/" className="font-bold text-lg">Library</Link>
                {user && user.role === 'reader' && <Link to="/reader/catalog" className="text-sm">Каталог</Link>}
                {user && user.role === 'library' && <Link to="/library/catalog" className="text-sm">Каталог</Link>}
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        {/* {user.role === 'library' && (
                            <input className="p-1 border rounded text-sm" placeholder="Поиск читателя по ID" onKeyDown={(e) => {
                                if (e.key === 'Enter') nav(`/library/reader/${(e.target as HTMLInputElement).value}`);
                            }} />
                        )} */}
                        <div className="text-sm">ID: {user.id}</div>
                        {/* <button className="text-sm underline" onClick={() => { auth.logout(); nav('/login'); }}>Выйти</button> */}
                    </>
                ) : (
                    <Link to="/login" className="text-sm underline">Войти</Link>
                )}
            </div>
        </header>
    );
}
