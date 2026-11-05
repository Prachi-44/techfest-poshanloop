import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { RoleProvider } from './contexts/RoleContext';
import { OnlineStatusProvider } from './contexts/OnlineContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <OnlineStatusProvider>
        <RoleProvider>
          <App />
        </RoleProvider>
      </OnlineStatusProvider>
    </BrowserRouter>
  </React.StrictMode>
);

