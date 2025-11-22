import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

import Header from './components/Header';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <Header /> 
      <App />
    </BrowserRouter>
);
