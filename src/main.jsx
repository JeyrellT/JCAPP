import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter, createRoutesFromElements, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LeanSixSigmaProvider } from './contexts/LeanSixSigmaContext';
import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LeanSixSigmaProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </LeanSixSigmaProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
