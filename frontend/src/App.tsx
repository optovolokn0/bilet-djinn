import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import '../src/App.css'
// import Login from './pages/Login';
import ReaderCatalog from './pages/reader/Catalog';
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
    <Routes>
      <Route path="/reader/catalog" element={<ReaderCatalog />}/>
      {/* <Route path="/" element={<Landing />} /> */}
      { /*
      <Route path="/login" element={<Login />} />

      
      <Route path="/reader/catalog/book/:bookId" element={<RequireAuth role="reader"><ReaderBook /></RequireAuth>} />
      <Route path="/reader/account" element={<RequireAuth role="reader"><ReaderAccount /></RequireAuth>} />
      <Route path="/reader/account/my-books" element={<RequireAuth role="reader"><MyBooks /></RequireAuth>} />
      <Route path="/reader/account/history" element={<RequireAuth role="reader"><History /></RequireAuth>} />
      <Route path="/reader/account/extend/:loanId" element={<RequireAuth role="reader"><ExtendLoan /></RequireAuth>} />

      <Route path="/library/catalog" element={<RequireAuth role="library"><LibraryCatalog /></RequireAuth>} />
      <Route path="/library/catalog/book/:bookId" element={<RequireAuth role="library"><LibraryBook /></RequireAuth>} />
      <Route path="/library/reader/:readerId" element={<RequireAuth role="library"><LibraryReader /></RequireAuth>} />
      <Route path="/library/issued" element={<RequireAuth role="library"><IssuedCatalog /></RequireAuth>} />
      <Route path="/library/new-book" element={<RequireAuth role="library"><NewBook /></RequireAuth>} /> */}
    </Routes>
  );
}
