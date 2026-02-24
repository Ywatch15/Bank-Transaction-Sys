import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ToastProvider wraps everything so any component can use useToast() */}
      <ToastProvider>
        {/* ErrorBoundary catches render errors with fallback UI */}
        <ErrorBoundary>
          {/* AuthProvider makes auth state + helpers available everywhere */}
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
