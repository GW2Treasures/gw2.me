import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';
import '@gw2treasures/icons/styles.css';
import "@fontsource/bitter/700.css";
import { App } from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
