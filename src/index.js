import toast from 'react-hot-toast';

// Suppress all non-error action toasters per user requirement:
// No toaster for any normal action; ONLY show toaster when an error occurs.
toast.success = () => '';
toast.loading = () => '';
toast.custom = () => '';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register PWA Service Worker for offline capability & fast loading
serviceWorkerRegistration.register();

// Measure performance if needed
reportWebVitals();
