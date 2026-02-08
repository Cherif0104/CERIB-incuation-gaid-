import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function AcceptAdminInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token] = useState(() => searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Lien d’invitation invalide.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        setError('Vous devez d’abord créer ou confirmer votre compte via le lien reçu par e-mail.');
        setLoading(false);
        return;
      }
      const { data: acceptData, error: acceptError } = await supabase.rpc('accept_admin_invitation', {
        p_token: token.trim(),
      });
      if (acceptError || !acceptData?.success) {
        setError(acceptData?.error || acceptError?.message || 'Erreur lors de l’activation de votre rôle administrateur.');
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-12 bg-gradient-to-b from-cerip-forest-light to-[#f8f9f8]">
          <div className="w-full max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg shadow-cerip-forest/10 border border-cerip-forest/10 p-8">
              <div className="w-14 h-14 rounded-full bg-cerip-lime/20 flex items-center justify-center text-cerip-lime mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h1 className="text-xl font-bold text-cerip-forest mb-2">Rôle administrateur activé</h1>
              <p className="text-sm text-cerip-forest/70 mb-6">
                Votre accès administrateur à l’organisation est maintenant actif. Vous pouvez vous connecter pour accéder au tableau de bord.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-cerip-lime hover:bg-cerip-lime-dark text-white font-semibold py-3 px-6 text-sm transition"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
        <div className="flex-1 cerip-panel-dark flex items-center justify-center p-8 relative overflow-hidden">
          <div className="absolute inset-0 cerip-panel-shine pointer-events-none" />
          <img src="/lion-gainde.webp" alt="Parcours Gaindé" className="relative z-10 max-h-80 w-auto object-contain mix-blend-multiply opacity-95" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="flex-1 flex flex-col justify-center px-6 py-10 md:px-12 bg-gradient-to-b from-cerip-forest-light to-[#f8f9f8]">
        <div className="w-full max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <img src="/logo-cerip-senegal.png" alt="CERIP Sénégal" className="h-14 w-auto object-contain" />
          </div>
          <p className="text-center text-xs font-semibold text-cerip-forest/80 uppercase tracking-wider mb-6">Savana · Invitation administrateur</p>

          <h1 className="text-2xl md:text-3xl font-bold text-cerip-forest mb-1">Activer votre accès admin</h1>
          <p className="text-sm text-cerip-forest/70 mb-6">
            Choisissez un mot de passe pour sécuriser votre compte puis validez l&apos;invitation.
          </p>

          <div className="bg-white rounded-2xl shadow-lg shadow-cerip-forest/10 border border-cerip-forest/10 p-6 md:p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cerip-forest mb-1.5 uppercase tracking-wide">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6+ caractères"
                  className="w-full border border-cerip-forest/20 rounded-xl pl-3 pr-4 py-3 text-sm text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-cerip-forest mb-1.5 uppercase tracking-wide">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="6+ caractères"
                  className="w-full border border-cerip-forest/20 rounded-xl pl-3 pr-4 py-3 text-sm text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition"
                  required
                />
              </div>
              {error && (
                <p className="text-xs text-cerip-magenta-dark bg-cerip-magenta-light border border-cerip-magenta/30 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cerip-lime hover:bg-cerip-lime-dark text-white font-semibold py-3 text-sm transition shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {loading ? 'Activation…' : 'Activer mon accès admin'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-cerip-forest/70 mt-6">
            <Link to="/login" className="text-cerip-magenta font-semibold hover:underline">Retour à la connexion</Link>
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-14 cerip-panel-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 cerip-panel-shine pointer-events-none" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
            Rejoignez la <span className="text-cerip-lime">savana</span> côté administration.
          </h2>
          <p className="text-cerip-lime text-lg font-semibold mb-4">Pilotez vos incubés et promotions.</p>
          <p className="text-white/90 text-sm leading-relaxed">
            Cet accès est réservé aux administrateurs d&apos;organisation. Ne partagez pas ce lien.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AcceptAdminInvitationPage;

