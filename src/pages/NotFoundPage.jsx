import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cerip-forest-light px-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-cerip-forest mb-2">404</h1>
        <p className="text-cerip-forest/80 text-lg mb-6">Cette page n’existe pas ou a été déplacée.</p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-cerip-lime text-white font-semibold text-sm hover:bg-cerip-lime-dark transition"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
