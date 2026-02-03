import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<p style="padding:1rem;color:#333;">Erreur: élément #root introuvable.</p>';
} else {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error(err);
    root.innerHTML = '<p style="padding:2rem;font-family:sans-serif;color:#b91c1c;">Erreur au chargement de l\'application. Ouvrez la console (F12) pour les détails.</p>';
  }
}

