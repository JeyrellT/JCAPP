import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { LeanSixSigmaProvider } from './contexts/LeanSixSigmaContext';
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LeanSixSigmaProvider>
        <BrowserRouter
          basename={import.meta.env.BASE_URL}
          future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        >
          <App />
        </BrowserRouter>
      </LeanSixSigmaProvider>
    </ThemeProvider>
  </React.StrictMode>
);
