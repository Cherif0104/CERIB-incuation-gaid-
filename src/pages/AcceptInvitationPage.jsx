import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Page "Accepter une invitation" : formulaire réservé aux incubés ayant un code.
 * 1) Saisie du code → validation (RPC validate_invitation_code)
 * 2) Si valide : formulaire nom + email + mot de passe → signUp puis accept_invitation (RPC)
 * Le code peut être prérempli via l'URL : /accept-invitation?code=xxx
 */
function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get('code') || '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [codeValidated, setCodeValidated] = useState(null);

  const handleValidateCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Saisissez le code d\'invitation.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('validate_invitation_code', { p_code: code.trim() });
      if (rpcError) {
        setCodeValidated(null);
        setError('Code invalide ou expiré. Vérifiez le code reçu par e-mail.');
        setLoading(false);
        return;
      }
      if (data && data.valid) {
        setCodeValidated({ org_name: data.org_name || 'votre organisation' });
        setError('');
      } else {
        setCodeValidated(null);
        setError('Code invalide ou expiré.');
      }
    } catch (_) {
      setCodeValidated(null);
      setError('Impossible de valider le code. Réessayez.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      const { data: acceptData, error: acceptError } = await supabase.rpc('accept_invitation', {
        p_code: code.trim(),
        p_full_name: fullName.trim(),
      });
      if (acceptError || !acceptData?.success) {
        setError(acceptData?.error || acceptError?.message || 'Erreur lors de l\'activation du compte.');
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
              <h1 className="text-xl font-bold text-cerip-forest mb-2">Compte créé</h1>
              <p className="text-sm text-cerip-forest/70 mb-6">Vérifiez votre e-mail pour confirmer l'adresse, puis connectez-vous.</p>
              <Link to="/login" className="inline-flex items-center justify-center rounded-xl bg-cerip-lime hover:bg-cerip-lime-dark text-white font-semibold py-3 px-6 text-sm transition">Se connecter</Link>
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
          <p className="text-center text-xs font-semibold text-cerip-forest/80 uppercase tracking-wider mb-6">Savana · Accepter une invitation</p>

          {!codeValidated ? (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-cerip-forest mb-1">Code d'invitation</h1>
              <p className="text-sm text-cerip-forest/70 mb-6">Saisissez le code reçu par e-mail pour continuer.</p>
              <div className="bg-white rounded-2xl shadow-lg shadow-cerip-forest/10 border border-cerip-forest/10 p-6 md:p-7">
                <form onSubmit={handleValidateCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-cerip-forest mb-1.5 uppercase tracking-wide">Code d'invitation</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ex. ABC123"
                      className="w-full border border-cerip-forest/20 rounded-xl px-4 py-3 text-sm text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition font-mono"
                    />
                  </div>
                  {error && <p className="text-xs text-cerip-magenta-dark bg-cerip-magenta-light border border-cerip-magenta/30 rounded-xl px-3 py-2">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full rounded-xl bg-cerip-lime hover:bg-cerip-lime-dark text-white font-semibold py-3 text-sm transition shadow-md hover:shadow-lg disabled:opacity-60">
                    {loading ? 'Vérification…' : 'Valider le code'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-cerip-forest mb-1">Créer votre compte</h1>
              <p className="text-sm text-cerip-forest/70 mb-6">Vous rejoignez <strong>{codeValidated.org_name}</strong>. Renseignez vos informations.</p>
              <div className="bg-white rounded-2xl shadow-lg shadow-cerip-forest/10 border border-cerip-forest/10 p-6 md:p-7">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-cerip-forest mb-1.5 uppercase tracking-wide">Nom complet</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Votre nom et prénom" className="w-full border border-cerip-forest/20 rounded-xl pl-3 pr-4 py-3 text-sm text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-cerip-forest mb-1.5 uppercase tracking-wide">Adresse e-mail</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@mail.com" className="w-full border border-cerip-forest/20 rounded-xl pl-3 pr-4 py-3 text-sm text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-cerip-forest mb-1.5 uppercase tracking-wide">Mot de passe</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ caractères" className="w-full border border-cerip-forest/20 rounded-xl pl-3 pr-4 py-3 text-sm text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-cerip-forest mb-1.5 uppercase tracking-wide">Confirmer le mot de passe</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="6+ caractères" className="w-full border border-cerip-forest/20 rounded-xl pl-3 pr-4 py-3 text-sm text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition" required />
                  </div>
                  {error && <p className="text-xs text-cerip-magenta-dark bg-cerip-magenta-light border border-cerip-magenta/30 rounded-xl px-3 py-2">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full rounded-xl bg-cerip-lime hover:bg-cerip-lime-dark text-white font-semibold py-3 text-sm transition shadow-md hover:shadow-lg disabled:opacity-60">
                    {loading ? 'Création…' : 'Créer mon compte'}
                  </button>
                </form>
              </div>
            </>
          )}

          <p className="text-center text-sm text-cerip-forest/70 mt-6">
            <Link to="/signup" className="text-cerip-forest/80 hover:underline">Retour à l'inscription</Link>
            {' · '}
            <Link to="/login" className="text-cerip-magenta font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-14 cerip-panel-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 cerip-panel-shine pointer-events-none" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-2">De l'<span className="text-cerip-lime">idée</span> à l'entreprise.</h2>
          <p className="text-cerip-lime text-lg font-semibold mb-4">De lionceau à Gaindé.</p>
          <div className="flex gap-1 mb-4">
            <div className="w-1 h-14 bg-cerip-lime rounded-full" />
            <div className="w-1 h-14 bg-cerip-magenta rounded-full" />
            <div className="w-1 h-14 bg-cerip-forest-mid rounded-full" />
          </div>
          <p className="text-white/90 text-sm leading-relaxed">Un accès sécurisé pour votre parcours d'incubation.</p>
        </div>
      </div>
    </div>
  );
}

export default AcceptInvitationPage;
