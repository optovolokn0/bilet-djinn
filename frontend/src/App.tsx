import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import '../src/App.css'
// import Login from './pages/Login';
import ReaderCatalog from './pages/reader/ReaderCatalog';
import LibraryCatalog from './pages/library/LibraryCatalog';
import { ProtectedRoute } from './routes/ProtectedRoutes';
import LoginPage from './pages/LoginPage';
// import ReaderBook from './pages/reader/BookPage';
// import ReaderAccount from './pages/reader/Account';
// import MyBooks from './pages/reader/MyBooks';
// import History from './pages/reader/History';
// import ExtendLoan from './pages/reader/ExtendLoan';
// import LibraryCatalog from './pages/library/Catalog';
// import LibraryBook from './pages/library/BookPage';
// import LibraryReader from './pages/library/Reader';
// import IssuedCatalog from './pages/library/Issued';
// import NewBook from './pages/library/NewBook';

// export const auth = {
//   getUser: () => {
//     const raw = localStorage.getItem('lib_user');
//     return raw ? JSON.parse(raw) : null;
//   },
//   login: (user: any) => { localStorage.setItem('lib_user', JSON.stringify(user)); },
//   logout: () => { localStorage.removeItem('lib_user'); }
// };

// function RequireAuth({ children, role }: { children: JSX.Element; role?: 'reader' | 'library' }) {
//   const user = auth.getUser();
//   if (!user) return <Navigate to="/login" replace />;
//   if (role && user.role !== role) {
//     return <Navigate to={user.role === 'reader' ? '/reader/catalog' : '/library/catalog'} replace />;
//   }
//   return children;
// }

export default function App() {
  return (
    <main>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Reader */}
        <Route path="/reader/catalog" element={
            <ReaderCatalog />
        } />

        {/* Library */}
        <Route path="/library/catalog" element={
            <LibraryCatalog />
        } />
      </Routes>
    </main>

  );
}
