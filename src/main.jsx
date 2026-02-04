import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ color: '#b91c1c', fontSize: '1.25rem' }}>Erreur au chargement</h1>
          <p style={{ color: '#333', marginTop: '0.5rem' }}>{this.state.error.message}</p>
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '1rem' }}>Ouvrez la console (F12) pour plus de détails.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<p style="padding:1rem;color:#333;">Erreur: élément #root introuvable.</p>';
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

