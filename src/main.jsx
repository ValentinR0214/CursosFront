import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx'
import AppRouter from './Router.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx';
import 'primereact/resources/themes/lara-light-indigo/theme.css';   
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <BrowserRouter>
    <App/>
    </BrowserRouter>
    </ToastProvider>
  </StrictMode>,
);
