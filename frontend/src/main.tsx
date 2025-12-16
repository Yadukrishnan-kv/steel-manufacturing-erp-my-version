import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ModernThemeProvider } from './theme';
import { store } from './store/store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ModernThemeProvider defaultMode="light">
          <App />
        </ModernThemeProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);