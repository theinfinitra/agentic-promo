import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWithRouting from './AppWithRouting';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <AppWithRouting />
  </React.StrictMode>
);
