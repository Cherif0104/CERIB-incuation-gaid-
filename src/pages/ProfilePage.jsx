import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_ORG: 'Admin Organisation',
  COACH: 'Coach',
  CERTIFICATEUR: 'Certificateur',
};

function ProfilePage({ profile, onUpdate }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const isStaff = profile?.kind === 'staff';
  const table = isStaff ? 'staff_users' : 'incubes';
  const id = profile?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id || fullName.trim() === (profile?.full_name ?? '')) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const { error: err } = await supabase.from(table).update({ full_name: fullName.trim() }).eq('id', id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage('Profil mis à jour.');
    onUpdate?.();
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);
    const { current, newPassword: newPwd, confirm } = passwordForm;
    if (!newPwd || newPwd.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPwd !== confirm) {
      setPasswordError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setPasswordSaving(true);
    if (current) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profile?.email,
        password: current,
      });
      if (signInErr) {
        setPasswordSaving(false);
        setPasswordError('Mot de passe actuel incorrect.');
        return;
      }
    }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPwd });
    setPasswordSaving(false);
    if (updateErr) {
      setPasswordError(updateErr.message || 'Erreur lors du changement de mot de passe.');
      return;
    }
    setPasswordMessage('Mot de passe mis à jour. Utilisez-le à la prochaine connexion.');
    setPasswordForm({ current: '', newPassword: '', confirm: '' });
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="px-6 py-5 border-b border-cerip-forest/10 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-cerip-forest">Mon profil</h1>
        <p className="text-sm text-cerip-forest/70 mt-1">
          Consultez et modifiez vos informations. L&apos;adresse e-mail est gérée par l&apos;authentification.
        </p>
      </header>
      <main className="flex-1 p-6 max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-cerip-forest/10 p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">E-mail</label>
            <p className="text-cerip-forest font-medium">{profile?.email ?? '—'}</p>
            <p className="text-xs text-cerip-forest/60 mt-0.5">Non modifiable depuis cette page.</p>
          </div>
          {isStaff && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">Rôle</label>
              <p className="text-cerip-forest font-medium">{ROLE_LABELS[profile?.role] ?? profile?.role}</p>
            </div>
          )}
          {profile?.organisation_id && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">Organisation</label>
              <p className="text-cerip-forest font-medium">{profile?.organisation_id}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">
                Nom complet
              </label>
              <input
                id="full_name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-cerip-forest/20 rounded-xl px-4 py-3 text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition"
                placeholder="Votre nom"
              />
            </div>
            {message && <p className="text-sm text-cerip-lime font-medium">{message}</p>}
            {error && <p className="text-sm text-cerip-magenta bg-cerip-magenta-light rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={saving || fullName.trim() === (profile?.full_name ?? '')}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-cerip-lime text-white hover:bg-cerip-lime-dark disabled:opacity-50 transition"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>

          <div className="border-t border-cerip-forest/10 pt-5">
            <h2 className="text-sm font-semibold text-cerip-forest mb-3">Changer le mot de passe</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">
                  Mot de passe actuel
                </label>
                <input
                  id="current_password"
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                  className="w-full border border-cerip-forest/20 rounded-xl px-4 py-3 text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition"
                  placeholder="Optionnel pour vérifier"
                />
              </div>
              <div>
                <label htmlFor="new_password" className="block text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  id="new_password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                  className="w-full border border-cerip-forest/20 rounded-xl px-4 py-3 text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition"
                  placeholder="6 caractères minimum"
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-xs font-semibold uppercase tracking-wider text-cerip-forest/70 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                  className="w-full border border-cerip-forest/20 rounded-xl px-4 py-3 text-cerip-forest focus:outline-none focus:ring-2 focus:ring-cerip-lime/50 focus:border-cerip-lime transition"
                  placeholder="Confirmer"
                />
              </div>
              {passwordMessage && <p className="text-sm text-cerip-lime font-medium">{passwordMessage}</p>}
              {passwordError && <p className="text-sm text-cerip-magenta bg-cerip-magenta-light rounded-lg px-3 py-2">{passwordError}</p>}
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-cerip-forest/10 text-cerip-forest hover:bg-cerip-forest/20 disabled:opacity-50 transition"
              >
                {passwordSaving ? 'Mise à jour…' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
